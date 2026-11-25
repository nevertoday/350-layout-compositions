import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  CLAMP_MAX_VW,
  CLAMP_MIN_VW,
  CLAMP_PRESETS,
  DEFAULT_SPLITS,
  DEFAULT_VW,
  FIXED_MEDIA_H,
  MAX_VW,
  MIN_VW,
  PROSE_MAX_PX,
  SHELL_MIN_PCT,
  WCAG_CJK_MAX,
  calcFluidGrid,
  clamp,
  evaluateClampCurve,
  evaluateFourStrategies,
  evaluateHero,
  evaluateQuizOption,
  ratioToVw,
  snapVw,
  vwToRatio,
  vwToShellPct,
} from "./model.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// =========================================================================
// 1. HERO 主角玩具：三轨同步活体流体窗台 + 2D Canvas 弹性正弦波 + 轨 3 真像素缩排
// =========================================================================
const heroState = {
  vw: DEFAULT_VW,
  splits: [...DEFAULT_SPLITS],
  guarded: false,
  wavePhase: 0,
};

const benchEl = $("#fluid-bench");
const arenaEl = $("#bench-arena");
const shellEl = $("#viewport-shell");
const wallHandle = $("#wall-handle");
const vwOut = $("#hero-vw-val");
const badgeOut = $("#hero-badge");
const titleRatioEl = $("#title-ratio");
const guardBtn = $("#hero-guard-btn");
const guardLbl = $("#hero-guard-lbl");
const resetBtn = $("#hero-reset-btn");

const segL = $("#seg-l"), segM = $("#seg-m"), segR = $("#seg-r");
const segLP = $("#seg-l-p"), segMP = $("#seg-m-p"), segRP = $("#seg-r-p");
const segLPx = $("#seg-l-px"), segMPx = $("#seg-m-px"), segRPx = $("#seg-r-px");
const seam1 = $("#seam-1"), seam2 = $("#seam-2");
const t1Readout = $("#t1-readout");

const t2Readout = $("#t2-readout");
const wingL = $("#flex-wing-l"), wingR = $("#flex-wing-r");
const wingLPx = $("#wing-l-px"), wingRPx = $("#wing-r-px");
const coreTag = $("#core-tag");
const waveCanvas = $("#hero-wave-canvas");
const waveCtx = waveCanvas.getContext("2d");

const t3Readout = $("#t3-readout");
const stretchViewport = $("#stretch-viewport");
const stretchGrid = $("#stretch-grid");
const stL = $("#st-l"), stM = $("#st-m"), stR = $("#st-r");
const stLPx = $("#st-l-px"), stMPx = $("#st-m-px"), stRPx = $("#st-r-px");
const stMProse = $("#st-m-prose");
const stMCopy = $("#st-m-copy");
const wcagGuide = $("#wcag-guide");

const verdictLead = $("#hero-verdict");
const verdictWhy = $("#hero-why");
const heroBlobPath = $("#hero-blob-path");
const heroDecoWave = $("#hero-deco-wave");
const devBtns = $$(".dev-btn", benchEl);
const splitPills = $$(".mini-pill", benchEl);

let heroEvaluation = evaluateHero(heroState);

// 直接从 DOM 实测 #st-m-copy 第 1 行排出的真实字数（对 CSS scale 缩放完全不变）
const measureRange = document.createRange();
function measureFirstLineChars(pEl) {
  const node = pEl?.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const len = node.length;
  if (len < 2) return len;

  measureRange.setStart(node, 0);
  measureRange.setEnd(node, 1);
  const r0 = measureRange.getBoundingClientRect();
  if (!r0 || r0.height <= 0) return null;
  const lineTol = r0.height * 0.55;

  measureRange.setStart(node, len - 1);
  measureRange.setEnd(node, len);
  const rLast = measureRange.getBoundingClientRect();
  if (Math.abs(rLast.top - r0.top) <= lineTol) return len;

  let lo = 0;
  let hi = len - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    measureRange.setStart(node, mid);
    measureRange.setEnd(node, mid + 1);
    const rm = measureRange.getBoundingClientRect();
    if (Math.abs(rm.top - r0.top) <= lineTol) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

function renderHeroDOM() {
  const baseEv = evaluateHero(heroState);

  // 视口盒在舞台中的宽度映射（320px -> 36%, 1920px -> 100%，与顶沿标尺刻度严格共用 vwToShellPct）
  const r = vwToRatio(baseEv.vw);
  const shellPct = vwToShellPct(baseEv.vw);
  shellEl.style.width = `${shellPct.toFixed(2)}%`;

  // 轨 1：百分比宽度
  segL.style.width = `${baseEv.p1}%`;
  segM.style.width = `${baseEv.p2}%`;
  segR.style.width = `${baseEv.p3}%`;
  segLP.textContent = `${baseEv.p1}%`;
  segMP.textContent = `${baseEv.p2}%`;
  segRP.textContent = `${baseEv.p3}%`;
  segLPx.textContent = `${baseEv.pctPx[0]}px`;
  segMPx.textContent = `${baseEv.pctPx[1]}px`;
  segRPx.textContent = `${baseEv.pctPx[2]}px`;
  t1Readout.textContent = `${baseEv.pctPx[0]} · ${baseEv.pctPx[1]} · ${baseEv.pctPx[2]} px`;
  seam1.setAttribute("aria-valuenow", String(baseEv.p1));
  seam2.setAttribute("aria-valuenow", String(baseEv.p3));

  // 轨 2：连续拉伸 FLEX（左右定翼占当前模拟视口的真实比例）
  const wingShare = clamp((baseEv.wingPx / baseEv.vw) * 100, 8, 40);
  wingL.style.width = `${wingShare.toFixed(1)}%`;
  wingR.style.width = `${wingShare.toFixed(1)}%`;
  const compactWing = window.innerWidth <= 600;
  wingLPx.textContent = compactWing ? `${baseEv.wingPx}` : `${baseEv.wingPx}px`;
  wingRPx.textContent = compactWing ? `${baseEv.wingPx}` : `${baseEv.wingPx}px`;
  const wingTight = !heroState.guarded && baseEv.flexCenterPx < 220;
  wingL.classList.toggle("is-warn", wingTight);
  wingR.classList.toggle("is-warn", wingTight);
  coreTag.textContent = compactWing ? `${baseEv.flexCenterPx}PX` : `FLEX: 1 · ${baseEv.flexCenterPx}PX`;
  t2Readout.textContent = `定翼 ${baseEv.wingPx}px · 中栏 ${baseEv.flexCenterPx}px (${baseEv.flexCenterPct}%)`;

  // 轨 3：按模拟 vw 真像素（15px 正文）排版，再按「舞台宽 ÷ vw」等比缩小
  stretchGrid.dataset.cols = baseEv.col3Mode;
  stretchGrid.style.width = `${baseEv.vw}px`;
  if (baseEv.col3Mode === "3col") {
    stretchGrid.style.gridTemplateColumns = `${baseEv.col3Px[0]}px ${baseEv.col3Px[1]}px ${baseEv.col3Px[2]}px`;
  } else if (baseEv.col3Mode === "2col") {
    stretchGrid.style.gridTemplateColumns = `${baseEv.col3Px[0]}px ${baseEv.col3Px[1]}px`;
  } else {
    stretchGrid.style.gridTemplateColumns = `${baseEv.vw}px`;
  }
  const isClampedProse = heroState.guarded && baseEv.col3Px[1] > PROSE_MAX_PX;
  stMProse.classList.toggle("is-clamped", isClampedProse);

  const stageW = Math.max(100, stretchViewport.clientWidth);
  const scale = Math.min(1, stageW / baseEv.vw);
  stretchGrid.style.transform = `scale(${scale.toFixed(4)})`;

  // 直接从真实排版后的 DOM 测量第 1 行汉字数与自然高度
  const measuredChars = measureFirstLineChars(stMCopy);
  const naturalH = stretchGrid.offsetHeight || 200;
  const isShortLandscape = window.innerHeight <= 500 && window.innerWidth > window.innerHeight;
  const maxViewportH = isShortLandscape ? 72 : window.innerWidth <= 600 ? 112 : 146;
  const scaledH = naturalH * scale;
  const visH = Math.max(30, Math.min(maxViewportH, Math.ceil(scaledH)));
  stretchViewport.style.height = `${visH}px`;
  stretchViewport.classList.toggle("is-clipped-bottom", scaledH > maxViewportH + 3);

  // 用 DOM 实测字数产出唯一口径诊断
  const ev = evaluateHero(heroState, measuredChars);
  heroEvaluation = ev;

  benchEl.dataset.tone = ev.tone;
  benchEl.dataset.guarded = heroState.guarded ? "1" : "0";
  vwOut.textContent = `${ev.vw}PX`;
  badgeOut.textContent = ev.badge;
  titleRatioEl.textContent = `${ev.p1}% · ${ev.p2}% · ${ev.p3}%`;

  wallHandle.setAttribute("aria-valuenow", String(ev.vw));
  wallHandle.setAttribute("aria-valuetext", `${ev.vw} 像素，实测 ${ev.charsPerLine} 字/行，${ev.badge}`);
  guardBtn.setAttribute("aria-pressed", String(heroState.guarded));
  guardLbl.textContent = heroState.guarded ? "护栏已开 · 点此看裸流体" : "裸流体 % · 点此加护栏";

  const scalePct = Math.round(scale * 100);
  t3Readout.textContent = compactWing
    ? `缩 ${scalePct}% · 实测 ${ev.charsPerLine} 字/行`
    : `15px 真排 · 缩 ${scalePct}% · 中栏 ${ev.activeMidPx}px · 实测 ${ev.charsPerLine} 字/行`;

  stLPx.textContent = `${ev.col3Px[0]}px`;
  stMPx.textContent = `${ev.activeMidPx}px · 实测 ${ev.charsPerLine} 字/行`;
  stRPx.textContent = `${ev.col3Px[2]}px`;
  wcagGuide.classList.toggle("is-on", !heroState.guarded && ev.charsPerLine > WCAG_CJK_MAX);
  stL.classList.toggle("is-bad", !heroState.guarded && ev.col3Px[0] < 135);
  stR.classList.toggle("is-bad", !heroState.guarded && ev.col3Px[2] < 135);
  stM.classList.toggle("is-bad", !heroState.guarded && ev.charsPerLine > WCAG_CJK_MAX);

  // 设备锚点高亮
  for (const btn of devBtns) {
    const target = Number(btn.dataset.vw);
    const active = Math.abs(ev.vw - target) <= 20;
    btn.classList.toggle("is-on", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  // 快捷分栏高亮
  const splitKey = `${ev.p1},${ev.p2},${ev.p3}`;
  for (const p of splitPills) {
    const on = p.dataset.split === splitKey;
    p.classList.toggle("is-on", on);
    p.setAttribute("aria-pressed", String(on));
  }

  // 右上装饰液滴与白浪随模拟视口弹性微变形
  const stretch = (r - 0.5) * 18;
  heroBlobPath.setAttribute(
    "d",
    `M${(132 - stretch * 0.4).toFixed(1)} 16 C${(172 + stretch * 0.5).toFixed(1)} 14, ${(198 + stretch * 0.6).toFixed(1)} 38, ${(196 + stretch * 0.4).toFixed(1)} 76 C194 98, ${(212 + stretch * 0.5).toFixed(1)} 114, 192 132 C176 146, 178 186, 140 192 C98 198, ${(66 - stretch * 0.5).toFixed(1)} 174, ${(68 - stretch * 0.4).toFixed(1)} 140 C70 112, 98 98, 102 68 C106 38, 104 18, ${(132 - stretch * 0.4).toFixed(1)} 16 Z`
  );
  const waveAmp = 24 - r * 8;
  heroDecoWave.setAttribute(
    "d",
    `M8 ${112 + waveAmp * 0.35} C44 ${112 + waveAmp * 0.5}, 72 ${112 - waveAmp}, 118 ${112 - waveAmp} C164 ${112 - waveAmp}, 188 ${112 + waveAmp}, 236 ${112 + waveAmp} C272 ${112 + waveAmp}, 294 ${112 - waveAmp * 0.6}, 318 ${112 - waveAmp * 0.75}`
  );

  verdictLead.textContent = ev.verdict;
  verdictWhy.textContent = ev.why;
}

// 2D Canvas：绘制轨 2 内的海报标志性青色连续正弦流体波（带开场画入与实时张力响应）
function drawHeroWave(t, dt, { still }) {
  const rect = waveCanvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return;
  const dpr = pixelRatio(2);
  const cw = Math.max(1, Math.round(rect.width * dpr));
  const ch = Math.max(1, Math.round(rect.height * dpr));
  if (waveCanvas.width !== cw || waveCanvas.height !== ch) {
    waveCanvas.width = cw;
    waveCanvas.height = ch;
  }

  const ctx = waveCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(2, 167, 204, 0.16)";
  ctx.lineWidth = 1;
  const step = Math.max(24, w / 8);
  for (let x = step; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 4);
    ctx.lineTo(x, h - 4);
    ctx.stroke();
  }

  const revealProg = still ? 1 : clamp(t / 0.85, 0.22, 1);
  if (!still) heroState.wavePhase += dt * 1.4;
  const phase = still ? 0.6 : heroState.wavePhase;

  const r = vwToRatio(heroEvaluation.vw);
  const padX = Math.min(14, w * 0.08);
  const span = Math.max(10, (w - padX * 2) * revealProg);
  const midY = h * 0.62;
  const cycles = 2.6 - r * 0.9;
  const amp = clamp(h * (0.24 - r * 0.07), 4.5, h * 0.28);
  const tightWarn = !heroState.guarded && heroEvaluation.flexCenterPx < 220;

  ctx.beginPath();
  const samples = Math.max(28, Math.round(span / 4));
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = padX + u * span;
    const y = midY + Math.sin(u * Math.PI * 2 * cycles - phase) * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = tightWarn ? "#D63A12" : "#036966";
  ctx.lineWidth = 2.8;
  ctx.lineCap = "round";
  ctx.stroke();

  const y0 = midY + Math.sin(-phase) * amp;
  const y1 = midY + Math.sin(Math.PI * 2 * cycles - phase) * amp;
  ctx.fillStyle = tightWarn ? "#D63A12" : "#02A7CC";
  for (const [px, py] of [[padX, y0], [padX + span, y1]]) {
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const heroLoop = loop(benchEl, (t, dt, meta) => {
  drawHeroWave(t, dt, meta);
});

// 拖动右墙手柄改变模拟视口宽度（支持鼠标、触屏 PointerEvent 及 perf.mjs 的 touch 事件）
function setVwFromClientX(clientX, shouldSnap = false) {
  const ar = arenaEl.getBoundingClientRect();
  const minFrac = SHELL_MIN_PCT / 100;
  const usable = Math.max(120, ar.width - 10);
  const frac = clamp((clientX - ar.left - 8) / usable, minFrac, 1);
  const norm = (frac - minFrac) / (1 - minFrac);
  let vw = ratioToVw(norm);
  if (shouldSnap) vw = snapVw(vw).vw;
  if (vw !== heroState.vw) {
    heroState.vw = vw;
    renderHeroDOM();
    heroLoop.draw();
  }
}

let wallDragging = false;
wallHandle.addEventListener("pointerdown", (e) => {
  wallDragging = true;
  wallHandle.classList.add("is-drag");
  try { wallHandle.setPointerCapture?.(e.pointerId); } catch {}
  setVwFromClientX(e.clientX, false);
});
window.addEventListener("pointermove", (e) => {
  if (!wallDragging) return;
  setVwFromClientX(e.clientX, false);
});
const endWallDrag = (e) => {
  if (!wallDragging) return;
  wallDragging = false;
  wallHandle.classList.remove("is-drag");
  if (e && typeof e.clientX === "number") setVwFromClientX(e.clientX, true);
};
window.addEventListener("pointerup", endWallDrag);
window.addEventListener("pointercancel", endWallDrag);

// 兼容原生 TouchEvent（保证无头 CDP touchStart/touchMove 精准触发每一帧）
wallHandle.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  wallDragging = true;
  wallHandle.classList.add("is-drag");
  setVwFromClientX(e.touches[0].clientX, false);
}, { passive: true });
wallHandle.addEventListener("touchmove", (e) => {
  if (!wallDragging || !e.touches.length) return;
  setVwFromClientX(e.touches[0].clientX, false);
}, { passive: true });
wallHandle.addEventListener("touchend", () => {
  if (!wallDragging) return;
  wallDragging = false;
  wallHandle.classList.remove("is-drag");
  heroState.vw = snapVw(heroState.vw).vw;
  renderHeroDOM();
  heroLoop.draw();
});

// 右墙手柄键盘控制（←/→ 24px，Shift+←/→ 80px，R 复原）
wallHandle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 80 : 24;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    heroState.vw = clamp(heroState.vw - step, MIN_VW, MAX_VW);
    renderHeroDOM();
    heroLoop.draw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    heroState.vw = clamp(heroState.vw + step, MIN_VW, MAX_VW);
    renderHeroDOM();
    heroLoop.draw();
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    resetHero();
  }
});

// 轨 1 内部两条百分比栏缝手柄拖拽 + 键盘调节
function bindSeam(handle, which) {
  let active = false;
  const updateFromX = (clientX) => {
    const r = $("#pct-bar").getBoundingClientRect();
    const pct = clamp(Math.round(((clientX - r.left) / Math.max(80, r.width)) * 100), 12, 88);
    let [p1, , p3] = heroState.splits;
    if (which === 1) {
      p1 = clamp(pct, 12, 100 - p3 - 22);
    } else {
      p3 = clamp(100 - pct, 12, 100 - p1 - 22);
    }
    const p2 = 100 - p1 - p3;
    heroState.splits = [p1, p2, p3];
    renderHeroDOM();
    heroLoop.draw();
  };
  handle.addEventListener("pointerdown", (e) => {
    active = true;
    try { handle.setPointerCapture?.(e.pointerId); } catch {}
    updateFromX(e.clientX);
  });
  window.addEventListener("pointermove", (e) => { if (active) updateFromX(e.clientX); });
  const stop = () => { active = false; };
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
  handle.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 2 : -2;
    let [p1, , p3] = heroState.splits;
    if (which === 1) p1 = clamp(p1 + delta, 12, 100 - p3 - 22);
    else p3 = clamp(p3 - delta, 12, 100 - p1 - 22);
    heroState.splits = [p1, 100 - p1 - p3, p3];
    renderHeroDOM();
    heroLoop.draw();
  });
}
bindSeam(seam1, 1);
bindSeam(seam2, 2);

// 护栏开关、复原按钮、设备刻度与快捷比例
function resetHero() {
  heroState.vw = DEFAULT_VW;
  heroState.splits = [...DEFAULT_SPLITS];
  heroState.guarded = false;
  renderHeroDOM();
  heroLoop.draw();
}
guardBtn.addEventListener("click", () => {
  heroState.guarded = !heroState.guarded;
  renderHeroDOM();
  heroLoop.draw();
});
resetBtn.addEventListener("click", resetHero);
for (const btn of devBtns) {
  btn.addEventListener("click", () => {
    heroState.vw = Number(btn.dataset.vw);
    renderHeroDOM();
    heroLoop.draw();
  });
}
for (const pill of splitPills) {
  pill.addEventListener("click", () => {
    heroState.splits = pill.dataset.split.split(",").map(Number);
    renderHeroDOM();
    heroLoop.draw();
  });
}
window.addEventListener("resize", () => {
  renderHeroDOM();
  heroLoop.draw();
});

// =========================================================================
// 2. 01 节：Ethan Marcotte Target ÷ Context 实时换算器
// =========================================================================
const fCtx = $("#f-ctx"), fSide = $("#f-side"), fGut = $("#f-gut");
const fCtxOut = $("#f-ctx-out"), fSideOut = $("#f-side-out"), fGutOut = $("#f-gut-out"), fTestOut = $("#f-test-out");
const fEq = $("#f-eq"), fCss = $("#f-css"), fExplain = $("#f-explain");
const fvL = $("#fv-l"), fvM = $("#fv-m"), fvR = $("#fv-r"), fvG1 = $("#fv-g1"), fvG2 = $("#fv-g2");
const fvLPx = $("#fv-l-px"), fvMPx = $("#fv-m-px"), fvRPx = $("#fv-r-px");
const ctxPresets = $$("[data-ctx]");
const fTestBtns = $$("[data-ftest]");
let formulaTestW = 900;

function renderFormula() {
  const ctxPx = Number(fCtx.value);
  const maxSide = Math.floor(ctxPx * 0.36);
  fSide.max = String(maxSide);
  if (Number(fSide.value) > maxSide) fSide.value = String(maxSide);

  const res = calcFluidGrid(ctxPx, Number(fSide.value), Number(fGut.value));
  const testW = formulaTestW;

  fCtxOut.textContent = `${res.contextPx}px`;
  fSideOut.textContent = `${res.sidePx}px`;
  fGutOut.textContent = `${res.gutterPx}px`;
  fTestOut.textContent = `${testW}px`;

  fEq.textContent = `${res.sidePx} ÷ ${res.contextPx} = ${res.sidePct.toFixed(2)}%`;

  const tSide = Math.round((testW * res.sidePct) / 100);
  const tMid = Math.round((testW * res.centerPct) / 100);
  fvL.style.width = `${res.sidePct}%`;
  fvM.style.width = `${res.centerPct}%`;
  fvR.style.width = `${res.sidePct}%`;
  fvG1.style.width = `${res.gutterPct}%`;
  fvG2.style.width = `${res.gutterPct}%`;
  fvL.querySelector("b").textContent = `${res.sidePct.toFixed(1)}%`;
  fvM.querySelector("b").textContent = `${res.centerPct.toFixed(1)}%`;
  fvR.querySelector("b").textContent = `${res.sidePct.toFixed(1)}%`;
  fvLPx.textContent = `${tSide}px`;
  fvMPx.textContent = `${tMid}px`;
  fvRPx.textContent = `${tSide}px`;

  fCss.textContent =
    `.sidebar { width: ${res.sidePct.toFixed(2)}%; }  /* ${res.sidePx} ÷ ${res.contextPx} */\n` +
    `.main    { width: ${res.centerPct.toFixed(2)}%; }  /* ${res.centerPx} ÷ ${res.contextPx} */\n` +
    `.gutter  { gap:   ${res.gutterPct.toFixed(2)}%; }  /* ${res.gutterPx} ÷ ${res.contextPx} */`;

  const ratio = (testW / res.contextPx).toFixed(2);
  fExplain.textContent =
    `原稿 ${res.contextPx}px 放到 ${testW}px 实测窗口里时，所有栏和栏距同步按 ${ratio}× 伸缩（侧栏 ${tSide}px，中栏 ${tMid}px），总宽度仍严丝合缝贴在 100%。`;

  for (const b of ctxPresets) {
    const on = Number(b.dataset.ctx) === res.contextPx;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of fTestBtns) {
    const on = Number(b.dataset.ftest) === testW;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  }
}
for (const inp of [fCtx, fSide, fGut]) inp.addEventListener("input", renderFormula);
for (const b of ctxPresets) {
  b.addEventListener("click", () => {
    fCtx.value = b.dataset.ctx;
    renderFormula();
  });
}
for (const b of fTestBtns) {
  b.addEventListener("click", () => {
    formulaTestW = Number(b.dataset.ftest);
    renderFormula();
  });
}

// =========================================================================
// 3. 02 节：四条宽度的脾气同步赛跑台（五档设备按钮 + 自动扫屏）
// =========================================================================
const raceVwOut = $("#race-vw-val");
const racePlayBtn = $("#race-play-btn");
const racePills = $$("[data-rvw]");
const winFixed = $("#win-fixed"), innerFixed = $("#inner-fixed"), tagFixed = $("#tag-fixed"), noteFixed = $("#note-fixed");
const winFluid = $("#win-fluid"), tagFluid = $("#tag-fluid"), noteFluid = $("#note-fluid");
const winAdaptive = $("#win-adaptive"), innerAdaptive = $("#inner-adaptive"), tagAdaptive = $("#tag-adaptive"), noteAdaptive = $("#note-adaptive");
const winResp = $("#win-responsive"), innerResp = $("#inner-responsive"), tagResp = $("#tag-responsive"), noteResp = $("#note-responsive");

let raceVw = 768;
let racePlaying = false;
let raceRaf = 0;
let raceDir = 1;
let raceLast = 0;
let raceFloat = raceVw;

function stopRacePlay() {
  if (!racePlaying) return;
  racePlaying = false;
  if (raceRaf) cancelAnimationFrame(raceRaf);
  raceRaf = 0;
  racePlayBtn.setAttribute("aria-pressed", "false");
  racePlayBtn.textContent = "▶ 自动扫屏";
}

function tickRace(now) {
  if (!racePlaying) return;
  const dt = raceLast ? Math.min((now - raceLast) / 1000, 0.08) : 0;
  raceLast = now;
  raceFloat += raceDir * dt * 260;
  if (raceFloat >= 1440) { raceFloat = 1440; raceDir = -1; }
  else if (raceFloat <= 320) { raceFloat = 320; raceDir = 1; }
  raceVw = Math.round(raceFloat / 4) * 4;
  renderRace();
  raceRaf = requestAnimationFrame(tickRace);
}

racePlayBtn.addEventListener("click", () => {
  if (racePlaying) {
    stopRacePlay();
    return;
  }
  racePlaying = true;
  raceLast = 0;
  raceFloat = raceVw;
  if (raceFloat >= 1420) raceDir = -1;
  else if (raceFloat <= 340) raceDir = 1;
  racePlayBtn.setAttribute("aria-pressed", "true");
  racePlayBtn.textContent = "■ 暂停扫屏";
  raceRaf = requestAnimationFrame(tickRace);
});
document.addEventListener("visibilitychange", () => { if (document.hidden) stopRacePlay(); });

function renderRace() {
  const ev = evaluateFourStrategies(raceVw);
  raceVwOut.textContent = `${ev.vw}PX`;

  const winPct = ((ev.vw / 1440) * 100).toFixed(1) + "%";
  for (const w of [winFixed, winFluid, winAdaptive, winResp]) w.style.width = winPct;

  const fixedRatio = (ev.fixed.width / ev.vw) * 100;
  innerFixed.style.width = `${fixedRatio.toFixed(1)}%`;
  winFixed.classList.toggle("has-overflow", ev.fixed.overflow > 0);
  tagFixed.textContent = ev.fixed.overflow > 0 ? `溢出 ${ev.fixed.overflow}px` : ev.fixed.slack > 0 ? `空边 ${ev.fixed.slack}px` : "贴合 960px";
  tagFixed.classList.toggle("is-warn", ev.fixed.overflow > 0 || ev.fixed.slack > 240);
  noteFixed.textContent = ev.fixed.note;

  tagFluid.textContent = `${ev.fluid.side} / ${ev.fluid.mid} / ${ev.fluid.side}px`;
  tagFluid.classList.toggle("is-warn", ev.fluid.side < 130 || ev.fluid.mid > 640);
  noteFluid.textContent = ev.fluid.note;

  const adaptRatio = Math.min(100, (ev.adaptive.tier / ev.vw) * 100);
  innerAdaptive.style.width = `${adaptRatio.toFixed(1)}%`;
  tagAdaptive.textContent = `停在 ${ev.adaptive.tier}px 档`;
  tagAdaptive.classList.toggle("is-warn", ev.adaptive.gap > 140);
  noteAdaptive.textContent = ev.adaptive.note;

  innerResp.dataset.cols = String(ev.responsive.cols);
  tagResp.textContent = `${ev.responsive.cols} 栏流体`;
  noteResp.textContent = ev.responsive.note;

  for (const p of racePills) {
    const on = Math.abs(Number(p.dataset.rvw) - ev.vw) <= 12;
    p.classList.toggle("is-on", on);
    p.setAttribute("aria-pressed", String(on));
  }
}
for (const p of racePills) {
  p.addEventListener("click", () => {
    stopRacePlay();
    raceVw = Number(p.dataset.rvw);
    renderRace();
  });
}

// =========================================================================
// 4. 04 节：clamp(min, val, max)「平—斜—平」交互函数曲线图
// =========================================================================
const PLOT = { l: 64, r: 770, t: 38, b: 292, w: 706, h: 254 };
const SVG_NS = "http://www.w3.org/2000/svg";

const clampState = {
  presetKey: "prose",
  minPx: CLAMP_PRESETS.prose.defaultMin,
  maxPx: CLAMP_PRESETS.prose.defaultMax,
  probeVw: null,
};

const clampSvg = $("#clamp-svg");
const clPresetBtns = $$("[data-cpreset]");
const clResetBtn = $("#cl-reset-btn");
const clCssEl = $("#cl-css");
const clGridEl = $("#cl-grid");
const clWcagRef = $("#cl-wcag-ref");
const clWcagLine = $("#cl-wcag-line");
const clWcagLbl = $("#cl-wcag-lbl");

const czMin = $("#cz-min"), czSlope = $("#cz-slope"), czMax = $("#cz-max");
const czLblMin = $("#cz-lbl-min"), czLblSlope = $("#cz-lbl-slope"), czLblMax = $("#cz-lbl-max");
const clRawRay = $("#cl-raw-ray"), clRawLbl = $("#cl-raw-lbl");
const cdX1 = $("#cd-x1"), cdY1 = $("#cd-y1"), cdX2 = $("#cd-x2"), cdY2 = $("#cd-y2");
const clSegMin = $("#cl-seg-min"), clSegSlope = $("#cl-seg-slope"), clSegMax = $("#cl-seg-max");

const cbX1Bg = $("#cb-x1-bg"), cbX1Txt = $("#cb-x1-txt");
const cbX2Bg = $("#cb-x2-bg"), cbX2Txt = $("#cb-x2-txt");
const cbY1Bg = $("#cb-y1-bg"), cbY1Txt = $("#cb-y1-txt");
const cbY2Bg = $("#cb-y2-bg"), cbY2Txt = $("#cb-y2-txt");

const knotMin = $("#clamp-knot-min"), knotMax = $("#clamp-knot-max");
const ckMinTag = $("#ck-min-tag"), ckMaxTag = $("#ck-max-tag");
const clProbeGroup = $("#cl-probe"), cpLine = $("#cp-line"), cpDot = $("#cp-dot");

const clX1Out = $("#cl-x1-out"), clX1Sub = $("#cl-x1-sub");
const clSpanOut = $("#cl-span-out"), clProbeOut = $("#cl-probe-out");
const clX2Out = $("#cl-x2-out"), clX2Sub = $("#cl-x2-sub");
const clStatusEl = $("#cl-status"), clDetailEl = $("#cl-detail");

const vwToPlotX = (vw) => PLOT.l + ((vw - CLAMP_MIN_VW) / (CLAMP_MAX_VW - CLAMP_MIN_VW)) * PLOT.w;
const pxToPlotY = (px, yMax) => PLOT.t + (1 - px / yMax) * PLOT.h;

let renderedGridKey = "";
let yTickItems = [];
let xTickItems = [];
function ensureClampGrid(preset) {
  if (renderedGridKey === preset.key) return;
  renderedGridKey = preset.key;
  clGridEl.innerHTML = "";
  yTickItems = [];
  xTickItems = [];
  const mk = (tag, attrs, text) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (text != null) el.textContent = text;
    return el;
  };
  // 水平网格与 Y 轴刻度
  for (const yt of preset.yTicks) {
    const y = pxToPlotY(yt, preset.yMax);
    clGridEl.appendChild(mk("line", { x1: PLOT.l, y1: y.toFixed(1), x2: PLOT.r, y2: y.toFixed(1), stroke: "rgba(244,247,246,0.12)", "stroke-width": 1 }));
    const lbl = mk("text", { x: PLOT.l - 8, y: (y + 4).toFixed(1), "text-anchor": "end", fill: "rgba(244,247,246,0.72)", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, String(yt));
    clGridEl.appendChild(lbl);
    yTickItems.push({ y, el: lbl });
  }
  // 垂直网格与 X 轴刻度
  for (const xt of [320, 640, 1024, 1440, 1920]) {
    const x = vwToPlotX(xt);
    clGridEl.appendChild(mk("line", { x1: x.toFixed(1), y1: PLOT.t, x2: x.toFixed(1), y2: PLOT.b, stroke: "rgba(244,247,246,0.12)", "stroke-width": 1 }));
    const lbl = mk("text", { x: x.toFixed(1), y: PLOT.b + 16, "text-anchor": "middle", fill: "rgba(244,247,246,0.72)", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, String(xt));
    clGridEl.appendChild(lbl);
    xTickItems.push({ x, el: lbl });
  }
  // 坐标轴主框线
  clGridEl.appendChild(mk("line", { x1: PLOT.l, y1: PLOT.t, x2: PLOT.l, y2: PLOT.b, stroke: "rgba(244,247,246,0.45)", "stroke-width": 1.5 }));
  clGridEl.appendChild(mk("line", { x1: PLOT.l, y1: PLOT.b, x2: PLOT.r, y2: PLOT.b, stroke: "rgba(244,247,246,0.45)", "stroke-width": 1.5 }));
}

function setKnotPos(knotEl, cx, cy) {
  for (const c of knotEl.querySelectorAll("circle")) {
    c.setAttribute("cx", cx.toFixed(1));
    c.setAttribute("cy", cy.toFixed(1));
  }
}

function placeTag(tagGroup, boxX, boxY, text) {
  const rect = tagGroup.querySelector("rect");
  const txt = tagGroup.querySelector("text");
  const w = 88;
  const x = clamp(boxX, PLOT.l + 4, PLOT.r - w - 4);
  const y = clamp(boxY, PLOT.t + 22, PLOT.b - 26);
  rect.setAttribute("x", x.toFixed(1));
  rect.setAttribute("y", y.toFixed(1));
  rect.setAttribute("width", String(w));
  txt.setAttribute("x", (x + w / 2).toFixed(1));
  txt.setAttribute("y", (y + 15).toFixed(1));
  txt.textContent = text;
}

function renderClampCurve() {
  const ev = evaluateClampCurve(clampState);
  clampState.minPx = ev.minPx;
  clampState.maxPx = ev.maxPx;
  const { preset, minPx, maxPx, slope, slopePct, x1, x2 } = ev;
  ensureClampGrid(preset);

  const px1 = vwToPlotX(clamp(x1, CLAMP_MIN_VW, CLAMP_MAX_VW));
  const px2 = vwToPlotX(clamp(x2, CLAMP_MIN_VW, CLAMP_MAX_VW));
  const py1 = pxToPlotY(minPx, preset.yMax);
  const py2 = pxToPlotY(maxPx, preset.yMax);

  // 三分区带与防撞标签
  const wMin = Math.max(0, px1 - PLOT.l);
  const wSlope = Math.max(0, px2 - px1);
  const wMax = Math.max(0, PLOT.r - px2);
  czMin.setAttribute("x", String(PLOT.l));
  czMin.setAttribute("width", wMin.toFixed(1));
  czSlope.setAttribute("x", px1.toFixed(1));
  czSlope.setAttribute("width", wSlope.toFixed(1));
  czMax.setAttribute("x", px2.toFixed(1));
  czMax.setAttribute("width", wMax.toFixed(1));

  const setZoneLbl = (el, startX, spanW, full, short) => {
    if (spanW < 42) { el.setAttribute("visibility", "hidden"); return; }
    el.setAttribute("visibility", "visible");
    el.setAttribute("x", (startX + spanW / 2).toFixed(1));
    el.textContent = spanW >= 122 ? full : short;
  };
  setZoneLbl(czLblMin, PLOT.l, wMin, "左平段 · 停止缩小", "左平");
  setZoneLbl(czLblSlope, px1, wSlope, "流体斜坡 · 跟随窗口", "斜坡");
  setZoneLbl(czLblMax, px2, wMax, "右平段 · 停止拉长", "右平");

  // WCAG 40 字参考线（仅正文主栏预设显示）
  if (preset.key === "prose") {
    clWcagRef.setAttribute("visibility", "visible");
    const wy = pxToPlotY(600, preset.yMax);
    clWcagLine.setAttribute("y1", wy.toFixed(1));
    clWcagLine.setAttribute("y2", wy.toFixed(1));
    clWcagLbl.setAttribute("y", (wy - 6).toFixed(1));
  } else {
    clWcagRef.setAttribute("visibility", "hidden");
  }

  // 无护栏纯流体虚线射线（裁剪在坐标系矩形内，图例放在顶栏右上角避免压字）
  const rayStartY = CLAMP_MIN_VW * slope;
  const rayEndVw = Math.min(CLAMP_MAX_VW, preset.yMax / slope);
  const rayEndY = Math.min(preset.yMax, CLAMP_MAX_VW * slope);
  const rx1 = vwToPlotX(CLAMP_MIN_VW), ry1 = pxToPlotY(rayStartY, preset.yMax);
  const rx2 = vwToPlotX(rayEndVw), ry2 = pxToPlotY(rayEndY, preset.yMax);
  clRawRay.setAttribute("x1", rx1.toFixed(1));
  clRawRay.setAttribute("y1", ry1.toFixed(1));
  clRawRay.setAttribute("x2", rx2.toFixed(1));
  clRawRay.setAttribute("y2", ry2.toFixed(1));
  clRawLbl.textContent = `无护栏 ${slopePct}vw`;

  // 平—斜—平三段主折线
  clSegMin.setAttribute("x1", String(PLOT.l));
  clSegMin.setAttribute("y1", py1.toFixed(1));
  clSegMin.setAttribute("x2", px1.toFixed(1));
  clSegMin.setAttribute("y2", py1.toFixed(1));

  clSegSlope.setAttribute("x1", px1.toFixed(1));
  clSegSlope.setAttribute("y1", py1.toFixed(1));
  clSegSlope.setAttribute("x2", px2.toFixed(1));
  clSegSlope.setAttribute("y2", py2.toFixed(1));

  clSegMax.setAttribute("x1", px2.toFixed(1));
  clSegMax.setAttribute("y1", py2.toFixed(1));
  clSegMax.setAttribute("x2", String(PLOT.r));
  clSegMax.setAttribute("y2", py2.toFixed(1));

  // 拐点垂线与水平引线
  cdX1.setAttribute("x1", px1.toFixed(1)); cdX1.setAttribute("y1", py1.toFixed(1));
  cdX1.setAttribute("x2", px1.toFixed(1)); cdX1.setAttribute("y2", String(PLOT.b));
  cdY1.setAttribute("x1", String(PLOT.l)); cdY1.setAttribute("y1", py1.toFixed(1));
  cdY1.setAttribute("x2", px1.toFixed(1)); cdY1.setAttribute("y2", py1.toFixed(1));

  cdX2.setAttribute("x1", px2.toFixed(1)); cdX2.setAttribute("y1", py2.toFixed(1));
  cdX2.setAttribute("x2", px2.toFixed(1)); cdX2.setAttribute("y2", String(PLOT.b));
  cdY2.setAttribute("x1", String(PLOT.l)); cdY2.setAttribute("y1", py2.toFixed(1));
  cdY2.setAttribute("x2", px2.toFixed(1)); cdY2.setAttribute("y2", py2.toFixed(1));

  // 坐标轴胶囊读数（靠近时轻微错开防重叠）
  let bx1 = px1, bx2 = px2;
  if (bx2 - bx1 < 64) {
    const mid = (bx1 + bx2) / 2;
    bx1 = Math.max(PLOT.l + 30, mid - 33);
    bx2 = Math.min(PLOT.r - 30, mid + 33);
  }
  cbX1Bg.setAttribute("x", (bx1 - 30).toFixed(1)); cbX1Bg.setAttribute("width", "60");
  cbX1Txt.setAttribute("x", bx1.toFixed(1)); cbX1Txt.textContent = `${x1}px`;
  cbX2Bg.setAttribute("x", (bx2 - 30).toFixed(1)); cbX2Bg.setAttribute("width", "60");
  cbX2Txt.setAttribute("x", bx2.toFixed(1)); cbX2Txt.textContent = `${x2}px`;

  let by1 = py1, by2 = py2;
  if (by1 - by2 < 23) {
    const mid = (by1 + by2) / 2;
    by2 = Math.max(PLOT.t + 10, mid - 12);
    by1 = Math.min(PLOT.b - 10, mid + 12);
  }
  cbY1Bg.setAttribute("y", (by1 - 10).toFixed(1));
  cbY1Txt.setAttribute("y", (by1 + 4).toFixed(1)); cbY1Txt.textContent = `${minPx}px`;
  cbY2Bg.setAttribute("y", (by2 - 10).toFixed(1));
  cbY2Txt.setAttribute("y", (by2 + 4).toFixed(1)); cbY2Txt.textContent = `${maxPx}px`;

  // 与高亮胶囊距离过近的静态刻度自动让位，避免文字探头叠压
  for (const t of yTickItems) {
    const clash = Math.abs(t.y - by1) < 18 || Math.abs(t.y - by2) < 18;
    t.el.setAttribute("visibility", clash ? "hidden" : "visible");
  }
  for (const t of xTickItems) {
    const clash = Math.abs(t.x - bx1) < 38 || Math.abs(t.x - bx2) < 38;
    t.el.setAttribute("visibility", clash ? "hidden" : "visible");
  }

  // 两个可拖动拐点圆环 + 浮动标签
  setKnotPos(knotMin, px1, py1);
  setKnotPos(knotMax, px2, py2);
  placeTag(ckMinTag, px1 + 14, py1 + 10, `下限 ${minPx}px`);
  placeTag(ckMaxTag, px2 - 102, py2 - 32, `上限 ${maxPx}px`);

  knotMin.setAttribute("aria-valuemin", String(preset.minRange[0]));
  knotMin.setAttribute("aria-valuemax", String(Math.min(preset.minRange[1], maxPx - 20)));
  knotMin.setAttribute("aria-valuenow", String(minPx));
  knotMin.setAttribute("aria-valuetext", `下限 ${minPx} 像素，对应窗宽拐点 ${x1} 像素`);

  knotMax.setAttribute("aria-valuemin", String(Math.max(preset.maxRange[0], minPx + 20)));
  knotMax.setAttribute("aria-valuemax", String(preset.maxRange[1]));
  knotMax.setAttribute("aria-valuenow", String(maxPx));
  knotMax.setAttribute("aria-valuetext", `上限 ${maxPx} 像素，对应窗宽拐点 ${x2} 像素`);

  // 悬停/点击曲线探针
  if (ev.probe) {
    const ppx = vwToPlotX(ev.probe.vw);
    const ppy = pxToPlotY(ev.probe.val, preset.yMax);
    clProbeGroup.setAttribute("visibility", "visible");
    cpLine.setAttribute("x1", ppx.toFixed(1));
    cpLine.setAttribute("x2", ppx.toFixed(1));
    cpDot.setAttribute("cx", ppx.toFixed(1));
    cpDot.setAttribute("cy", ppy.toFixed(1));
    clProbeOut.textContent = `窗宽 ${ev.probe.vw}px → ${ev.probe.val}px（${ev.probe.zone}）`;
  } else {
    clProbeGroup.setAttribute("visibility", "hidden");
    clProbeOut.textContent = `每增 100px 窗宽，栏宽增 ${slopePct}px`;
  }

  // 文字读数与 CSS
  clCssEl.textContent = ev.css;
  clX1Out.textContent = `vw = ${x1}px → ${minPx}px`;
  clX1Sub.textContent = `${minPx} ÷ ${slopePct}% = ${x1}px`;
  clSpanOut.textContent = `${x1} – ${x2}px（宽 ${ev.fluidSpan}px）`;
  clX2Out.textContent = `vw = ${x2}px → ${maxPx}px`;
  clX2Sub.textContent = `${maxPx} ÷ ${slopePct}% = ${x2}px`;
  clStatusEl.textContent = ev.status;
  clStatusEl.classList.toggle("is-warn", ev.warn);
  clDetailEl.textContent = ev.detail;

  for (const b of clPresetBtns) {
    const on = b.dataset.cpreset === preset.key;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  }
}

function clientToSvg(clientX, clientY) {
  const r = clampSvg.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / Math.max(1, r.width)) * 800,
    y: ((clientY - r.top) / Math.max(1, r.height)) * 340,
  };
}

// 将指针点正交投影到斜率射线上，横拖纵拖都顺手
function projectOntoSlopePx(clientX, clientY) {
  const preset = CLAMP_PRESETS[clampState.presetKey];
  const slope = preset.slopePct / 100;
  const pt = clientToSvg(clientX, clientY);
  const ax = vwToPlotX(CLAMP_MIN_VW);
  const ay = pxToPlotY(CLAMP_MIN_VW * slope, preset.yMax);
  const bx = vwToPlotX(CLAMP_MAX_VW);
  const by = pxToPlotY(CLAMP_MAX_VW * slope, preset.yMax);
  const dx = bx - ax;
  const dy = by - ay;
  const t = ((pt.x - ax) * dx + (pt.y - ay) * dy) / (dx * dx + dy * dy);
  const vw = CLAMP_MIN_VW + t * (CLAMP_MAX_VW - CLAMP_MIN_VW);
  return vw * slope;
}

let activeKnot = null;
function bindClampKnot(knotEl, which) {
  const applyPx = (rawPx) => {
    const preset = CLAMP_PRESETS[clampState.presetKey];
    const snapped = Math.round(rawPx / 5) * 5;
    if (which === "min") {
      clampState.minPx = clamp(snapped, preset.minRange[0], Math.min(preset.minRange[1], clampState.maxPx - 20));
    } else {
      clampState.maxPx = clamp(snapped, Math.max(preset.maxRange[0], clampState.minPx + 20), preset.maxRange[1]);
    }
    clampState.probeVw = null;
    renderClampCurve();
  };

  knotEl.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    activeKnot = which;
    knotEl.classList.add("is-drag");
    try { knotEl.setPointerCapture?.(e.pointerId); } catch {}
    applyPx(projectOntoSlopePx(e.clientX, e.clientY));
  });
  window.addEventListener("pointermove", (e) => {
    if (activeKnot !== which) return;
    applyPx(projectOntoSlopePx(e.clientX, e.clientY));
  });
  const stop = () => {
    if (activeKnot !== which) return;
    activeKnot = null;
    knotEl.classList.remove("is-drag");
  };
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);

  knotEl.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 30 : 10;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      applyPx((which === "min" ? clampState.minPx : clampState.maxPx) + step);
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      applyPx((which === "min" ? clampState.minPx : clampState.maxPx) - step);
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      const p = CLAMP_PRESETS[clampState.presetKey];
      clampState.minPx = p.defaultMin;
      clampState.maxPx = p.defaultMax;
      renderClampCurve();
    }
  });
}
bindClampKnot(knotMin, "min");
bindClampKnot(knotMax, "max");

// 指针滑过或轻点曲线图查任意窗宽读数
function updateProbeFromClient(clientX) {
  const pt = clientToSvg(clientX, 0);
  if (pt.x < PLOT.l || pt.x > PLOT.r) return;
  const vw = CLAMP_MIN_VW + ((pt.x - PLOT.l) / PLOT.w) * (CLAMP_MAX_VW - CLAMP_MIN_VW);
  clampState.probeVw = Math.round(vw / 10) * 10;
  renderClampCurve();
}
clampSvg.addEventListener("pointermove", (e) => {
  if (activeKnot) return;
  updateProbeFromClient(e.clientX);
});
clampSvg.addEventListener("pointerdown", (e) => {
  if (activeKnot || e.target.closest(".clamp-knot")) return;
  updateProbeFromClient(e.clientX);
});
clampSvg.addEventListener("pointerleave", () => {
  if (activeKnot) return;
  if (clampState.probeVw !== null) {
    clampState.probeVw = null;
    renderClampCurve();
  }
});

for (const b of clPresetBtns) {
  b.addEventListener("click", () => {
    const key = b.dataset.cpreset;
    const p = CLAMP_PRESETS[key];
    clampState.presetKey = key;
    clampState.minPx = p.defaultMin;
    clampState.maxPx = p.defaultMax;
    clampState.probeVw = null;
    renderClampCurve();
  });
}
clResetBtn.addEventListener("click", () => {
  const p = CLAMP_PRESETS[clampState.presetKey];
  clampState.minPx = p.defaultMin;
  clampState.maxPx = p.defaultMax;
  clampState.probeVw = null;
  renderClampCurve();
});

// =========================================================================
// 5. 05 节：反面教材急救箱
// =========================================================================
const RESCUE_CASES = {
  noodle: {
    badCss: `.article { width: 100%; } /* 事故：宽屏每行飙到 70+ 字 */`,
    goodCss: `.article { width: min(100%, 38em); margin-inline: auto; }`,
    badNote: "事故：纯流体直接撑满整扇宽屏，视线从行尾跳回下一行开头很容易串行，读完两段就想关页面。",
    goodNote: "修复生效：加上 min(100%, 38em) 后，小屏仍旧 100% 流畅贴边，大屏自动在约 36–38 字处封顶。",
    render(fixed) {
      return `<div class="rb-noodle${fixed ? " is-fixed" : ""}">流体布局最容易犯的懒，就是给长文章直接写一句 width: 100%。窗口窄的时候一切正常，一旦放到 1440px 或 2560px 屏幕上，一行文字会被拉成横贯屏幕的长龙，读者每读完一行都要大幅度转动眼球找下一行开头。</div>`;
    },
  },
  crush: {
    badCss: `.sidebar { width: 20%; } /* 事故：340px 窗口里侧栏只剩 68px */`,
    goodCss: `.layout { display: flex; flex-wrap: wrap; } .sidebar { flex: 1 1 180px; }`,
    badNote: "事故：20% 在桌面是 240px，落到 340px 窄窗只剩 68px——导航字被挤成竖着一串，根本点不中。",
    goodNote: "修复生效：给侧栏设 180px 基准并允许换行（flex-wrap），窄屏自动横排到顶部，按钮完整好点。",
    render(fixed) {
      return `<div class="rb-crush${fixed ? " is-fixed" : ""}"><div class="rb-crush-side"><span>订单管理</span> <span>数据概览</span> <span>系统设置</span></div><div class="rb-crush-main">主内容区：窄屏下侧栏如果死守 20%，文字就会像侧栏那样被挤得支离破碎。</div></div>`;
    },
  },
  card: {
    badCss: `.card { width: 100%; } /* 事故：单列通栏把简短卡片拉成细长扁砖 */`,
    goodCss: `.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }`,
    badNote: "事故：卡片只有标题和两行简介，却用 100% 横跨全宽，内容全挤在前端，后半截空成荒漠。",
    goodNote: "修复生效：用 auto-fit + minmax(170px, 1fr)，让卡片既能按比例流体微伸，又在够宽时自动多排几列。",
    render(fixed) {
      return `<div class="rb-cards${fixed ? " is-fixed" : ""}"><div class="rb-card-item"><span class="rb-chip"></span><div><b>流体网格公式</b><div>target ÷ context = result</div></div></div><div class="rb-card-item"><span class="rb-chip"></span><div><b>弹性护栏函数</b><div>clamp(下限, 流体, 上限)</div></div></div><div class="rb-card-item"><span class="rb-chip"></span><div><b>行宽舒适标尺</b><div>WCAG 1.4.8（AAA）建议 ≤ 40 字</div></div></div></div>`;
    },
  },
};

let rescueCase = "noodle";
let rescueFixed = false;
const rescueBox = $("#rescue-box");
const rbDemo = $("#rb-demo"), rbCss = $("#rb-css"), rbFixBtn = $("#rb-fix-btn"), rbNote = $("#rb-note");
const rbTabs = $$("[data-rcase]");

function renderRescue() {
  const c = RESCUE_CASES[rescueCase];
  rescueBox.dataset.case = rescueCase;
  rescueBox.dataset.fixed = rescueFixed ? "1" : "0";
  rbDemo.innerHTML = c.render(rescueFixed);
  rbCss.textContent = rescueFixed ? c.goodCss : c.badCss;
  rbNote.textContent = rescueFixed ? c.goodNote : c.badNote;
  rbFixBtn.setAttribute("aria-pressed", String(rescueFixed));
  rbFixBtn.textContent = rescueFixed ? "还原事故写法" : "看修复写法 →";
  for (const t of rbTabs) {
    const on = t.dataset.rcase === rescueCase;
    t.classList.toggle("is-on", on);
    t.setAttribute("aria-pressed", String(on));
  }
}
for (const t of rbTabs) {
  t.addEventListener("click", () => {
    rescueCase = t.dataset.rcase;
    rescueFixed = false;
    renderRescue();
  });
}
rbFixBtn.addEventListener("click", () => {
  rescueFixed = !rescueFixed;
  renderRescue();
});

// =========================================================================
// 6. 06 节：流体图片与比例锁实验
// =========================================================================
let mediaMode = "stretch";
const mediaLab = $("#media-lab");
const mlBtns = $$("[data-mmode]");
const mlSlider = $("#ml-slider"), mlOut = $("#ml-w-out");
const mlFrame = $("#ml-frame"), mlSvg = $("#ml-svg"), mlCss = $("#ml-css"), mlText = $("#ml-text");

function renderMediaLab() {
  const w = Number(mlSlider.value);
  mlOut.textContent = `${w}px`;
  mlFrame.style.width = `${((w / 760) * 100).toFixed(1)}%`;
  mediaLab.dataset.mmode = mediaMode;

  if (mediaMode === "stretch") {
    mlSvg.setAttribute("preserveAspectRatio", "none");
    mlFrame.style.aspectRatio = `${w} / ${FIXED_MEDIA_H}`;
    const ar = (w / FIXED_MEDIA_H).toFixed(1);
    const shapeDesc = w >= 265 ? "椭圆和扁矩形" : "竖椭圆和窄矩形";
    mlCss.textContent = `img { width: 100%; height: ${FIXED_MEDIA_H}px; }`;
    mlText.textContent = `框宽 ${w}px 而高度锁死 ${FIXED_MEDIA_H}px（宽高比 ${ar}:1），原图 16:9，里面的正圆和正方形被拉成${shapeDesc}——流体只该伸缩容器，绝不该扭曲图形比例。`;
  } else if (mediaMode === "auto") {
    mlSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    mlFrame.style.aspectRatio = "16 / 9";
    const h = Math.round((w * 9) / 16);
    mlCss.textContent = `img { max-width: 100%; height: auto; }`;
    mlText.textContent = `宽 ${w}px 时高度自动算成 ${h}px，圆还是正圆、方还是正方；适合插画、照片完整展示，但窗口极宽时图片会占很高。`;
  } else {
    mlSvg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    mlFrame.style.aspectRatio = `${w} / 200`;
    mlCss.textContent = `img { width: 100%; height: 200px; object-fit: cover; }`;
    mlText.textContent = `框宽 ${w}px、高度稳锁 200px，正圆和方框保持 1:1 不变形，超出框沿的边角平滑裁切——横幅头图与等高卡片封面最稳的做法。`;
  }

  for (const b of mlBtns) {
    const on = b.dataset.mmode === mediaMode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  }
}
mlSlider.addEventListener("input", renderMediaLab);
for (const b of mlBtns) {
  b.addEventListener("click", () => {
    mediaMode = b.dataset.mmode;
    renderMediaLab();
  });
}

// =========================================================================
// 7. 07 节：小练习
// =========================================================================
const quizBtns = $$(".quiz-opt");
const qvBox = $("#quiz-verdict"), qvTitle = $("#qv-title"), qvBody = $("#qv-body"), qvTri = $("#qv-tri");
const qv680 = $("#qv-680"), qv1024 = $("#qv-1024"), qv1520 = $("#qv-1520");

for (const btn of quizBtns) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.opt;
    const item = evaluateQuizOption(key);
    for (const b of quizBtns) {
      const k = b.dataset.opt;
      b.setAttribute("aria-pressed", String(k === key));
      b.classList.toggle("is-right", k === "C");
      b.classList.toggle("is-wrong", k === key && !item.correct);
    }
    qvBox.dataset.state = item.correct ? "right" : "wrong";
    qvTitle.textContent = item.title;
    qvBody.textContent = item.body;
    qv680.textContent = item.widths.s680;
    qv1024.textContent = item.widths.s1024;
    qv1520.textContent = item.widths.s1520;
    qvTri.hidden = false;
  });
}

// =========================================================================
// 8. 原海报放大查看器（支持缩放、鼠标拖动平移、Esc 关闭，只复用一次 poster.src）
// =========================================================================
const viewer = $("#viewer");
const posterImg = $("#poster");
const viewerImg = $("#viewer-img");
const viewerScroll = $("#viewer-scroll");
const zoomVal = $("#zoom-val");
let zoom = 1;

function applyZoom(next) {
  zoom = clamp(+next.toFixed(2), 0.6, 2.6);
  zoomVal.textContent = `${Math.round(zoom * 100)}%`;
  viewerImg.style.width = `${Math.round(zoom * 100)}%`;
  viewerImg.style.maxWidth = zoom > 1 ? "none" : "100%";
}

$("#poster-btn").addEventListener("click", () => {
  if (!viewerImg.src) viewerImg.src = posterImg.src;
  applyZoom(1);
  viewer.showModal();
  viewerScroll.focus();
});
$("#viewer-close").addEventListener("click", () => viewer.close());
$("#zoom-in").addEventListener("click", () => applyZoom(zoom + 0.25));
$("#zoom-out").addEventListener("click", () => applyZoom(zoom - 0.25));
$("#zoom-reset").addEventListener("click", () => applyZoom(1));
viewer.addEventListener("click", (e) => {
  if (e.target === viewer) viewer.close();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && viewer.open) {
    e.preventDefault();
    viewer.close();
  }
});

let panning = false, panX = 0, panY = 0, sL = 0, sT = 0;
viewerScroll.addEventListener("pointerdown", (e) => {
  panning = true;
  panX = e.clientX;
  panY = e.clientY;
  sL = viewerScroll.scrollLeft;
  sT = viewerScroll.scrollTop;
  viewerScroll.classList.add("is-pan");
  try { viewerScroll.setPointerCapture?.(e.pointerId); } catch {}
});
window.addEventListener("pointermove", (e) => {
  if (!panning) return;
  viewerScroll.scrollLeft = sL - (e.clientX - panX);
  viewerScroll.scrollTop = sT - (e.clientY - panY);
});
const endPan = () => {
  panning = false;
  viewerScroll.classList.remove("is-pan");
};
window.addEventListener("pointerup", endPan);
window.addEventListener("pointercancel", endPan);

// =========================================================================
// 9. 轻柔和滚动显现 + 首次同步渲染 + 字体就绪后复测轨 3
// =========================================================================
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const reveals = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-wait");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
  );
  for (const el of reveals) {
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.95) {
      el.classList.add("is-wait");
      io.observe(el);
    }
  }
}

// 初始化全部工作台
renderHeroDOM();
heroLoop.draw();
renderFormula();
renderRace();
renderClampCurve();
renderRescue();
renderMediaLab();

// 字体加载完毕后再按真实字形宽度重测一次轨 3 行字数
if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    renderHeroDOM();
    heroLoop.draw();
  });
}
