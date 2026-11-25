import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_HERO_STATE,
  PRESET_STATES,
  SNAG_CARDS_DEFAULT,
  TIMELINE_NODES,
  TRIAGE_CASES,
  QUIZ_OPTIONS,
  clampWidth,
  evaluateHero,
} from "./model.js";

/* =====================================================================
 * 0. 开场主角：活体浮块排字台（原生 CSS float + 2D Canvas 实测标尺）
 * ===================================================================== */
const heroSection = document.getElementById("hero");
const tankFrame = document.getElementById("tank-frame");
const tankCanvas = document.getElementById("tank-canvas");
const floatParent = document.getElementById("float-parent");
const parentTag = document.getElementById("parent-tag");
const floatCube = document.getElementById("float-cube");
const cubeDirChip = document.getElementById("cube-dir-chip");
const cubeWidthChip = document.getElementById("cube-width-chip");
const cubePxChip = document.getElementById("cube-px-chip");
const wrapProse = document.getElementById("wrap-prose");
const nextChapter = document.getElementById("next-chapter");
const nextClearChip = document.getElementById("next-clear-chip");
const nextChapterText = document.getElementById("next-chapter-text");
const outsideFooter = document.getElementById("outside-footer");
const outsideFooterNote = document.getElementById("outside-footer-note");

const checklistEl = document.getElementById("hero-checklist");
const scoreTag = document.getElementById("hero-score-tag");
const scoreSub = document.getElementById("hero-score-sub");
const isoCubeGroup = document.getElementById("iso-cube-group");

const diagBox = document.getElementById("hero-diag-box");
const diagBadge = document.getElementById("diag-badge");
const diagMetrics = document.getElementById("diag-metrics");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const cssLivePre = document.getElementById("css-live-pre");
const cssPassCount = document.getElementById("css-pass-count");

const valDir = document.getElementById("val-dir");
const valMargin = document.getElementById("val-margin");
const valContain = document.getElementById("val-contain");
const valClear = document.getElementById("val-clear");

const state = { ...INITIAL_HERO_STATE };
let pendingDragWidth = null;
let dragPulse = 0;
let lastMeasure = null;
let lastEval = null;
let cachedTextNode = null;

function applyHeroDomStyles() {
  const isLeft = state.floatDir === "left";
  const isRight = state.floatDir === "right";
  const isNone = state.floatDir === "none";

  heroSection.classList.toggle("is-floated-right", isRight);
  heroSection.classList.toggle("is-floated-none", isNone);

  floatCube.style.float = state.floatDir;
  floatCube.style.width = `${state.widthPct}%`;
  floatCube.style.margin = isLeft
    ? `0 ${state.marginPx}px 12px 0`
    : isRight
      ? `0 0 12px ${state.marginPx}px`
      : `0 0 12px 0`;
  floatCube.setAttribute("aria-valuenow", String(state.widthPct));

  cubeDirChip.textContent = `float: ${state.floatDir}`;
  cubeWidthChip.textContent = `↔ ${state.widthPct}%`;

  floatParent.classList.remove("mode-clearfix", "mode-flow-root");
  if (state.contain === "clearfix") floatParent.classList.add("mode-clearfix");
  if (state.contain === "flow-root") floatParent.classList.add("mode-flow-root");

  parentTag.textContent =
    state.contain === "flow-root"
      ? ".article-box · flow-root"
      : state.contain === "clearfix"
        ? ".article-box · ::after clearfix"
        : ".article-box · 未清除";

  nextChapter.style.clear = state.clearMode;
  nextClearChip.textContent = `clear: ${state.clearMode}`;

  // 同步刊头迷你等轴测雕塑徽位置
  if (isoCubeGroup) {
    const tx = isLeft ? -14 : isRight ? 0 : -7;
    const ty = isNone ? 5 : 0;
    isoCubeGroup.setAttribute("transform", `translate(${tx}, ${ty})`);
  }

  // 同步按钮 aria-pressed 状态
  document.querySelectorAll("[data-dir]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.dir === state.floatDir));
  });
  document.querySelectorAll("[data-margin]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.margin) === state.marginPx));
  });
  document.querySelectorAll("[data-contain]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.contain === state.contain));
  });
  document.querySelectorAll("[data-clear]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.clear === state.clearMode));
  });

  valDir.textContent = state.floatDir;
  valMargin.textContent = `${state.marginPx}px`;
  valContain.textContent = state.contain === "none" ? "未清除" : state.contain;
  valClear.textContent = state.clearMode;
}

/**
 * 一次性集中读取真实 DOM 布局几何坐标（零 layout thrashing）。
 */
function measureHeroDom() {
  const frameRect = tankFrame.getBoundingClientRect();
  const parentRect = floatParent.getBoundingClientRect();
  const cubeRect = floatCube.getBoundingClientRect();
  const nextRect = nextChapter.getBoundingClientRect();
  const footerRect = outsideFooter.getBoundingClientRect();

  // 用原生 Range.getClientRects() 实测正文每一行的真实行盒宽度与位置
  if (!cachedTextNode || !cachedTextNode.isConnected) {
    cachedTextNode = [...wrapProse.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim().length > 0) || null;
  }

  const lineRects = [];
  if (cachedTextNode) {
    const range = document.createRange();
    range.selectNodeContents(cachedTextNode);
    const raw = [...range.getClientRects()].filter((r) => r.width > 4 && r.height > 4);
    // 按行垂直聚类（容差 4px）
    for (const r of raw) {
      const prev = lineRects[lineRects.length - 1];
      if (prev && Math.abs(prev.top - r.top) < 5) {
        const left = Math.min(prev.left, r.left);
        const right = Math.max(prev.right, r.right);
        prev.left = left;
        prev.right = right;
        prev.width = right - left;
      } else {
        lineRects.push({
          left: r.left - frameRect.left,
          right: r.right - frameRect.left,
          top: r.top - frameRect.top,
          bottom: r.bottom - frameRect.top,
          width: r.width,
          height: r.height,
        });
      }
    }
  }

  const cubeTopRel = cubeRect.top - frameRect.top;
  const cubeBotRel = cubeRect.bottom - frameRect.top;
  const cubeLeftRel = cubeRect.left - frameRect.left;
  const cubeRightRel = cubeRect.right - frameRect.left;

  // 找出真正位于浮块垂直区间旁侧的环绕行
  const alongsideLines = lineRects.filter(
    (l) => l.bottom > cubeTopRel + 4 && l.top < cubeBotRel - 4
  );

  const fontSize = parseFloat(getComputedStyle(wrapProse).fontSize) || 14.5;
  // 排除最后一行可能自然不满行的尾行，取旁侧受压行的中位/最短有效行宽
  const measuredAlongside = alongsideLines.length > 1 ? alongsideLines.slice(0, -1) : alongsideLines;
  const minLineW = measuredAlongside.length
    ? Math.min(...measuredAlongside.map((l) => l.width))
    : lineRects.length
      ? lineRects[0].width
      : 0;
  const minLineChars = Math.max(1, Math.round(minLineW / fontSize));

  // 父容器塌陷量：浮块下沿超出父框内部底沿的像素
  const parentInnerBot = parentRect.bottom - 2;
  const collapsePx = Math.max(0, Math.round(cubeRect.bottom - parentInnerBot));

  // 下一节标题条是否钻进了浮块旁侧（顶边高于浮块底边 - 4px）
  const nextIntruding =
    state.floatDir !== "none" && nextRect.top < cubeRect.bottom - 4;

  // 浮块是否真的撞到了父框外部的后续区块
  const hittingOutside = collapsePx > 4 && cubeRect.bottom > footerRect.top + 2;

  return {
    frameW: frameRect.width,
    frameH: frameRect.height,
    tankW: parentRect.width - 32,
    floatW: Math.round(cubeRect.width),
    floatH: Math.round(cubeRect.height),
    parentH: parentRect.height,
    parentTopRel: parentRect.top - frameRect.top,
    parentBotRel: parentRect.bottom - frameRect.top,
    parentRightRel: parentRect.right - frameRect.left,
    cubeTopRel,
    cubeBotRel,
    cubeLeftRel,
    cubeRightRel,
    collapsePx,
    wrapLines: alongsideLines.length,
    lineRects,
    alongsideLines,
    minLineW,
    minLineChars,
    nextIntruding,
    hittingOutside,
  };
}

const CHECK_SVGS = {
  left: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10H5M9 6l-4 4 4 4"/></svg>`,
  right: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h10M11 6l4 4-4 4"/></svg>`,
  none: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="6" width="12" height="8" rx="1.5"/></svg>`,
  wrap: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3.5 7.5c2-2 4.5-2 6.5 0s4.5 2 6.5 0M3.5 12.5c2-2 4.5-2 6.5 0s4.5 2 6.5 0"/></svg>`,
  box: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2.5"><rect x="4" y="4" width="12" height="12" rx="1.5"/></svg>`,
  clear: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M6 6l8 8M14 6l-8 8"/></svg>`,
  restore: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10.5l3.5 3.5L15.5 6.5"/></svg>`,
};

function renderHeroDiagnostics(m, ev) {
  cubePxChip.textContent = `${m.floatW}×${m.floatH}px`;

  floatParent.classList.toggle("is-collapsed", ev.collapsed);
  nextChapter.classList.toggle("is-intruding", m.nextIntruding);
  outsideFooter.classList.toggle("is-hit", m.hittingOutside);

  nextChapterText.textContent = m.nextIntruding
    ? ev.clearMismatch
      ? `下节标题：clear: ${state.clearMode} 清不掉${state.floatDir === "left" ? "左" : "右"}浮，仍在串台！`
      : "下节标题：未清浮，挤进浮块旁边串台！"
    : "下节标题：已干净换行，落到浮块正下方。";

  outsideFooterNote.textContent = m.hittingOutside
    ? `警报：朱红浮块已穿透父框 ${m.collapsePx}px 并压到此处！`
    : ev.collapsed
      ? `父框已塌陷 ${m.collapsePx}px，随时撞击外部区块`
      : "父框完整包裹浮块，外部区块安稳无重叠";

  // 顶标达标胶囊
  scoreTag.textContent = `${ev.passCount} / ${ev.total} ${ev.passCount === 5 ? "达标" : "待调"}`;
  scoreTag.classList.toggle("is-ok", ev.severity === "ok");
  scoreTag.classList.toggle("is-warn", ev.severity === "warn");
  scoreSub.textContent = ev.passCount === 5 ? "图文包裹与父框高度均达标" : ev.badge;

  // 原海报左侧 5 枚深海军蓝 SVG 圆徽清单
  checklistEl.innerHTML = ev.checks
    .map(
      (c) => `
      <div class="check-item ${c.ok ? "is-ok" : "is-fail"}">
        <span class="check-circle" aria-hidden="true">${CHECK_SVGS[c.iconKey] || CHECK_SVGS.left}</span>
        <div class="check-meta">
          <div class="check-head">
            <span class="check-title">${c.title}</span>
            <span class="check-prop">${c.posterLabel}</span>
          </div>
          <div class="check-status">${c.status}</div>
        </div>
      </div>`
    )
    .join("");

  // 白话诊单 + 实时 CSS
  diagBox.classList.remove("is-error", "is-warn");
  if (ev.severity === "error") diagBox.classList.add("is-error");
  if (ev.severity === "warn") diagBox.classList.add("is-warn");

  diagBadge.textContent = ev.badge;
  diagMetrics.textContent = `父框 ${Math.round(m.parentH)}px · 塌陷 ${m.collapsePx}px · 环绕 ${state.floatDir === "none" ? "0" : m.minLineChars} 字/行`;
  diagTitle.textContent = ev.headline;
  diagBody.textContent = ev.body;
  diagHint.textContent = ev.hint;

  cssPassCount.textContent = `${ev.passCount} / ${ev.total}`;
  cssLivePre.textContent = ev.cssCode;
}

/**
 * 绘制 2D Canvas 实测标尺层：
 * 1. 每条环绕行盒的浅蓝虚线框（过窄标朱红）；
 * 2. 浮块外沿 margin 呼吸气垫区（斜纹填充）；
 * 3. 右侧原海报同款「高度塌陷（朱红双箭头）」vs「高度正常（钴蓝双箭头）」实时标尺。
 */
function drawTankOverlay(t, still) {
  const m = lastMeasure;
  const ev = lastEval;
  if (!m || !ev) return;

  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(m.frameW));
  const h = Math.max(1, Math.round(m.frameH));
  if (tankCanvas.width !== Math.round(w * dpr) || tankCanvas.height !== Math.round(h * dpr)) {
    tankCanvas.width = Math.round(w * dpr);
    tankCanvas.height = Math.round(h * dpr);
  }

  const ctx = tankCanvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (!state.showGuides) {
    ctx.restore();
    return;
  }

  const intro = still ? 1 : Math.min(1, Math.max(0.25, t / 0.85));
  const dashOffset = still ? 0 : -(t * 18) % 14;

  // 1. 绘制 margin 呼吸气垫区（只在有浮动且 margin > 0 时画）
  if (state.floatDir !== "none" && state.marginPx > 0) {
    const mx = state.floatDir === "left" ? m.cubeRightRel : m.cubeLeftRel - state.marginPx;
    const my = m.cubeTopRel;
    const mw = state.marginPx;
    const mh = m.cubeBotRel - m.cubeTopRel;

    ctx.fillStyle = state.marginPx > 28 ? "rgba(169, 71, 0, 0.14)" : "rgba(59, 118, 219, 0.14)";
    ctx.fillRect(mx, my, mw, mh);

    ctx.strokeStyle = state.marginPx > 28 ? "#a94700" : "#3b76db";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(mx + 0.5, my + 0.5, Math.max(0, mw - 1), Math.max(0, mh - 1));
    ctx.setLineDash([]);
  }

  // 2. 绘制每一条受浮块压缩的文字行盒轮廓
  const narrowFail = ev.checks[1] && !ev.checks[1].ok && state.floatDir !== "none";
  ctx.lineWidth = 1.25;
  ctx.setLineDash([4, 3]);
  ctx.lineDashOffset = dashOffset;
  ctx.strokeStyle = narrowFail ? "rgba(203, 41, 8, 0.78)" : "rgba(20, 80, 176, 0.52)";

  for (const line of m.alongsideLines) {
    const lw = line.width * intro;
    ctx.strokeRect(line.left - 2, line.top, lw + 4, line.height);
  }
  ctx.setLineDash([]);

  // 3. 右侧原海报标志性「高度塌陷 / 高度正常」双箭头实时标尺
  const compactRuler = w < 440;
  const rx = Math.min(w - (compactRuler ? 48 : 66), m.parentRightRel + (compactRuler ? 12 : 16));
  const topY = m.parentTopRel + 4;
  const targetBotY = ev.collapsed ? m.cubeBotRel : m.parentBotRel - 4;
  const botY = topY + (targetBotY - topY) * intro;

  // 若塌陷，先画一条水平红虚线标出父框底边实际断裂处
  if (ev.collapsed) {
    ctx.strokeStyle = "#cb2908";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(m.parentRightRel + 2, m.parentBotRel);
    ctx.lineTo(rx + 16, m.parentBotRel);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const arrowColor = ev.collapsed ? "#cb2908" : "#2265d1";
  ctx.strokeStyle = arrowColor;
  ctx.fillStyle = arrowColor;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(rx, topY + 5);
  ctx.lineTo(rx, Math.max(topY + 12, botY - 5));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rx, topY);
  ctx.lineTo(rx - 4.5, topY + 7);
  ctx.lineTo(rx + 4.5, topY + 7);
  ctx.closePath();
  ctx.fill();

  const safeBot = Math.max(topY + 16, botY);
  ctx.beginPath();
  ctx.moveTo(rx, safeBot);
  ctx.lineTo(rx - 4.5, safeBot - 7);
  ctx.lineTo(rx + 4.5, safeBot - 7);
  ctx.closePath();
  ctx.fill();

  // 标尺旁清晰文字读数（宽窄屏都保证完整展示）
  const midY = (topY + safeBot) / 2;
  ctx.font = compactRuler ? "700 10.5px 'Noto Sans SC', sans-serif" : "700 11.5px 'Noto Sans SC', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const label1 = ev.collapsed ? (compactRuler ? "塌陷" : "高度塌陷") : (compactRuler ? "正常" : "高度正常");
  const label2 = ev.collapsed ? `-${m.collapsePx}px` : `${Math.round(m.parentH)}px`;
  const tx = rx + 6;
  if (tx + 28 <= w) {
    ctx.fillText(label1, tx, midY - 7);
    ctx.font = compactRuler ? "600 10.5px 'IBM Plex Mono', monospace" : "600 11px 'IBM Plex Mono', monospace";
    ctx.fillText(label2, tx, midY + 7);
  }

  // 拖动反馈微高亮描边
  if (dragPulse > 0.01) {
    ctx.strokeStyle = `rgba(253, 73, 31, ${(dragPulse * 0.55).toFixed(2)})`;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(m.cubeLeftRel - 3, m.cubeTopRel - 3, m.floatW + 6, m.floatH + 6);
  }

  ctx.restore();
}

function syncHeroNow() {
  applyHeroDomStyles();
  lastMeasure = measureHeroDom();
  lastEval = evaluateHero(state, lastMeasure);
  renderHeroDiagnostics(lastMeasure, lastEval);
}

// 用 lib/stage.js 的 loop() 统一管理重绘（离开视口/后台自动停帧、支持 reducedMotion）
const heroLoop = loop(tankFrame, (t, dt, { still }) => {
  if (pendingDragWidth !== null) {
    state.widthPct = clampWidth(pendingDragWidth);
    pendingDragWidth = null;
    dragPulse = 1;
    syncHeroNow();
  } else if (!lastMeasure) {
    syncHeroNow();
  }
  if (dragPulse > 0) {
    dragPulse = still ? 0 : Math.max(0, dragPulse - dt * 2.6);
  }
  drawTankOverlay(t, still);
});

// 立即同步首帧数据，防止 0.9s 截图前有空字
syncHeroNow();
heroLoop.draw();

// 直接拖动朱红 FLOAT 浮块（支持鼠标、触控笔、手指及 CDP touch 事件）
let dragInfo = null;

function beginDrag(clientX) {
  const parentW = Math.max(160, floatParent.getBoundingClientRect().width - 32);
  dragInfo = {
    startX: clientX,
    startPct: state.widthPct,
    parentW,
    sign: state.floatDir === "right" ? -1 : 1,
  };
  floatCube.classList.add("is-dragging");
  dragPulse = 1;
}

function moveDrag(clientX) {
  if (!dragInfo) return;
  const dx = clientX - dragInfo.startX;
  const deltaPct = (dx / dragInfo.parentW) * 100 * dragInfo.sign;
  pendingDragWidth = clampWidth(dragInfo.startPct + deltaPct);
  if (reducedMotion.matches) {
    state.widthPct = pendingDragWidth;
    pendingDragWidth = null;
    syncHeroNow();
    heroLoop.draw();
  }
}

function endDrag() {
  dragInfo = null;
  floatCube.classList.remove("is-dragging");
}

floatCube.addEventListener("pointerdown", (e) => {
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  try { floatCube.setPointerCapture(e.pointerId); } catch {}
  beginDrag(e.clientX);
});

floatCube.addEventListener("pointermove", (e) => {
  if (!dragInfo) return;
  e.preventDefault();
  moveDrag(e.clientX);
});

floatCube.addEventListener("pointerup", endDrag);
floatCube.addEventListener("pointercancel", endDrag);

// 兼容原生 touch 事件（确保 perf.mjs 发出的 touchStart/touchMove 100% 流畅驱动）
floatCube.addEventListener("touchstart", (e) => {
  if (dragInfo || !e.touches.length) return;
  e.preventDefault();
  beginDrag(e.touches[0].clientX);
}, { passive: false });

floatCube.addEventListener("touchmove", (e) => {
  if (!dragInfo || !e.touches.length) return;
  e.preventDefault();
  moveDrag(e.touches[0].clientX);
}, { passive: false });

floatCube.addEventListener("touchend", endDrag);
floatCube.addEventListener("touchcancel", endDrag);

// 键盘方向键微调浮块宽度
floatCube.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.widthPct = clampWidth(state.widthPct - 4);
    syncHeroNow();
    heroLoop.draw();
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.widthPct = clampWidth(state.widthPct + 4);
    syncHeroNow();
    heroLoop.draw();
  }
});

// 绑定四组原生按钮
document.querySelectorAll("[data-dir]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.floatDir = btn.dataset.dir;
    syncHeroNow();
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-margin]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.marginPx = Number(btn.dataset.margin);
    syncHeroNow();
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-contain]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.contain = btn.dataset.contain;
    syncHeroNow();
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-clear]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.clearMode = btn.dataset.clear;
    syncHeroNow();
    heroLoop.draw();
  });
});

const btnGuides = document.getElementById("btn-guides");
btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  btnGuides.textContent = state.showGuides ? "标尺透视：开" : "标尺透视：关";
  heroLoop.draw();
});

document.getElementById("btn-preset-mismatch").addEventListener("click", () => {
  Object.assign(state, PRESET_STATES.rightMismatch);
  syncHeroNow();
  heroLoop.draw();
});

document.getElementById("btn-preset-broken").addEventListener("click", () => {
  Object.assign(state, PRESET_STATES.broken);
  syncHeroNow();
  heroLoop.draw();
});

new ResizeObserver(() => {
  syncHeroNow();
  heroLoop.draw();
}).observe(tankFrame);

/* =====================================================================
 * 1. 01 节：2.5D X 光层叠解剖台（块盒 vs 浮块 vs 行盒）
 * ===================================================================== */
const xrayCanvas = document.getElementById("xray-canvas");
const xrayReadout = document.getElementById("xray-readout");
const xrayState = {
  isoTarget: 1,
  isoCur: 1,
  showBlock: true,
  showFloat: true,
  showLines: true,
};

function updateXrayReadout() {
  const { showBlock, showFloat, showLines } = xrayState;
  if (showBlock && !showFloat && !showLines) {
    xrayReadout.textContent = "只看第 1 层块盒：后续段落的淡蓝背景与虚线边框占满整整 100% 宽度，它压根看不见浮动元素的存在。";
  } else if (showBlock && showFloat && !showLines) {
    xrayReadout.textContent = "叠上第 2 层朱红浮块：浮块直接叠压在普通块盒左上角，二者互不推开——这就是为什么「浮块对块盒隐身」。";
  } else if (!showBlock && showFloat && showLines) {
    xrayReadout.textContent = "只看浮块与第 3 层行盒：前 4 条文字行盒被朱红浮块的 margin 边界硬生生缩短，第 5 条跨过浮块底边后立即拉回整行！";
  } else if (!showBlock && !showFloat && !showLines) {
    xrayReadout.textContent = "三层均已隐藏，请至少打开一层观察块盒、浮块与行盒的嵌套关系。";
  } else {
    xrayReadout.textContent = "三层同显：最底层块盒完整穿过浮块背后，顶层文字行盒却贴着浮块外边距自动折行——这就是 CSS 2.1 第 9.5 节「半脱离文档流」的本质。";
  }
}

function drawXray(dt, still) {
  const step = still ? 1 : Math.min(1, dt * 7);
  xrayState.isoCur += (xrayState.isoTarget - xrayState.isoCur) * step;
  const iso = xrayState.isoCur;

  const dpr = pixelRatio(2);
  const cw = xrayCanvas.clientWidth || 720;
  const ch = Math.round(cw * 0.54);
  if (xrayCanvas.width !== Math.round(cw * dpr) || xrayCanvas.height !== Math.round(ch * dpr)) {
    xrayCanvas.width = Math.round(cw * dpr);
    xrayCanvas.height = Math.round(ch * dpr);
  }

  const ctx = xrayCanvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cw, ch);

  // 坐标映射：iso=0 为标准平面，iso=1 为 2.5D 等轴测层叠视角
  const baseW = cw * 0.62;
  const baseH = ch * 0.56;
  const cx = cw * 0.5;
  const cy = ch * 0.54;

  function project(ux, uy, layerZ) {
    // ux, uy in [0, 1]
    const fx = cx + (ux - 0.5) * baseW;
    const fy = cy + (uy - 0.5) * baseH;

    const ix = cx + (ux - uy) * (baseW * 0.52);
    const iy = cy + (ux + uy - 1) * (baseH * 0.34) - layerZ * (ch * 0.19);

    return [fx + (ix - fx) * iso, fy + (iy - fy) * iso];
  }

  function quad(x0, y0, x1, y1, z) {
    const p1 = project(x0, y0, z);
    const p2 = project(x1, y0, z);
    const p3 = project(x1, y1, z);
    const p4 = project(x0, y1, z);
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.lineTo(p4[0], p4[1]);
    ctx.closePath();
    return [p1, p2, p3, p4];
  }

  const compact = cw < 420;
  // 层 1：普通块盒（z = -0.65）
  if (xrayState.showBlock) {
    quad(0, 0, 1, 1, -0.65);
    ctx.fillStyle = "rgba(195, 225, 251, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "#01245a";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const lbl = project(0.06, 0.94, -0.65);
    ctx.fillStyle = "#01245a";
    ctx.font = compact ? "700 11px 'Noto Sans SC', sans-serif" : "700 12px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("① 块盒 100% 宽度直穿浮块底下", Math.max(10, lbl[0] - (compact ? 18 : 0)), Math.min(ch - 10, lbl[1] + (compact ? 10 : 0)));
  }

  // 层 2：朱红浮块 + margin 排斥盒（z = 0）
  if (xrayState.showFloat) {
    quad(0.03, 0.05, 0.44, 0.67, 0);
    ctx.fillStyle = "rgba(253, 73, 31, 0.14)";
    ctx.fill();
    ctx.strokeStyle = "#cb2908";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    const q = quad(0.03, 0.05, 0.37, 0.59, 0);
    ctx.fillStyle = "#fd491f";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const midX = (q[0][0] + q[2][0]) / 2;
    const midY = (q[0][1] + q[2][1]) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.font = compact ? "700 13px 'Outfit', sans-serif" : "700 16px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FLOAT", midX, midY);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // 层 3：文字行盒（z = 0.65），前 4 行缩短绕开，后 2 行恢复 100% 宽度
  if (xrayState.showLines) {
    const lines = [
      { x0: 0.46, y0: 0.08, x1: 0.96, y1: 0.16 },
      { x0: 0.46, y0: 0.22, x1: 0.96, y1: 0.30 },
      { x0: 0.46, y0: 0.36, x1: 0.96, y1: 0.44 },
      { x0: 0.46, y0: 0.50, x1: 0.94, y1: 0.58 },
      { x0: 0.04, y0: 0.70, x1: 0.96, y1: 0.78 },
      { x0: 0.04, y0: 0.84, x1: 0.78, y1: 0.92 },
    ];

    lines.forEach((ln, idx) => {
      quad(ln.x0, ln.y0, ln.x1, ln.y1, 0.65);
      ctx.fillStyle = idx < 4 ? "rgba(1, 36, 90, 0.88)" : "rgba(20, 80, 176, 0.78)";
      ctx.fill();
    });

    const lbl3 = project(0.55, 0.02, 0.65);
    ctx.fillStyle = "#01245a";
    ctx.font = compact ? "700 11px 'Noto Sans SC', sans-serif" : "700 12px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(compact ? "③ 行盒遇浮块缩短，过底恢复全宽" : "③ 行盒遇浮块自动缩短，过底边恢复全宽", cw - 12, Math.max(18, lbl3[1] - 4));
    ctx.textAlign = "left";
  }

  ctx.restore();
}

const xrayLoop = loop(xrayCanvas, (_t, dt, { still }) => {
  drawXray(dt, still);
});

const btnIso = document.getElementById("xray-mode-iso");
const btnFlat = document.getElementById("xray-mode-flat");
btnIso.addEventListener("click", () => {
  xrayState.isoTarget = 1;
  btnIso.setAttribute("aria-pressed", "true");
  btnFlat.setAttribute("aria-pressed", "false");
  xrayLoop.draw();
});
btnFlat.addEventListener("click", () => {
  xrayState.isoTarget = 0;
  btnIso.setAttribute("aria-pressed", "false");
  btnFlat.setAttribute("aria-pressed", "true");
  xrayLoop.draw();
});

[
  ["toggle-layer-block", "showBlock"],
  ["toggle-layer-float", "showFloat"],
  ["toggle-layer-lines", "showLines"],
].forEach(([id, key]) => {
  const btn = document.getElementById(id);
  btn.addEventListener("click", () => {
    xrayState[key] = !xrayState[key];
    btn.setAttribute("aria-pressed", String(xrayState[key]));
    btn.querySelector(".layer-state").textContent = xrayState[key] ? "显示" : "隐藏";
    updateXrayReadout();
    xrayLoop.draw();
  });
});
updateXrayReadout();
xrayLoop.draw();

/* =====================================================================
 * 2. 02 节：多浮块卡钩（Float Snag）互动实验室
 * ===================================================================== */
const snagBoard = document.getElementById("snag-board");
const snagStatus = document.getElementById("snag-status");
const snagModeFloat = document.getElementById("snag-mode-float");
const snagModeGrid = document.getElementById("snag-mode-grid");
let snagMode = "float";
let snagCards = SNAG_CARDS_DEFAULT.map((c) => ({ ...c }));

function renderSnagBoard() {
  snagBoard.classList.toggle("mode-float", snagMode === "float");
  snagBoard.classList.toggle("mode-grid", snagMode === "grid");

  snagBoard.innerHTML = snagCards
    .map(
      (c, idx) => `
      <div class="snag-card" data-snag-idx="${idx}">
        <div class="snag-card__top">
          <span class="snag-card__tag">${c.tag}</span>
          <span class="snag-card__title">${c.title}</span>
        </div>
        <p class="snag-card__text">${c.lines > 1 ? `${c.baseText}${c.extraText}` : c.baseText}</p>
        <button type="button" class="btn snag-toggle-btn" data-toggle-lines="${idx}">
          ${c.lines > 1 ? "- 收回多余文字" : "+ 加长文字撑高"}
        </button>
      </div>`
    )
    .join("");

  snagBoard.querySelectorAll("[data-toggle-lines]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.toggleLines);
      snagCards[idx].lines = snagCards[idx].lines > 1 ? 1 : 2;
      renderSnagBoard();
    });
  });

  // 真实检测是否发生了 Float Snag（第二排第一张卡片 left 明显大于第一张卡片 left）
  requestAnimationFrame(() => {
    const els = [...snagBoard.querySelectorAll(".snag-card")];
    if (els.length < 4) return;
    const baseLeft = els[0].getBoundingClientRect().left;
    let snaggedIdx = -1;
    els.forEach((el) => el.classList.remove("is-snagged"));

    if (snagMode === "float") {
      // 检查折行后本该贴最左的卡片有没有被卡在半路
      for (let i = 1; i < els.length; i++) {
        const prev = els[i - 1].getBoundingClientRect();
        const cur = els[i].getBoundingClientRect();
        if (cur.top > prev.top + 20 && cur.left > baseLeft + 24) {
          snaggedIdx = i;
          els[i].classList.add("is-snagged");
          break;
        }
      }
    }

    if (snagMode === "grid") {
      snagStatus.textContent = "已切到 CSS Grid：哪怕卡片高度悬殊，行基线自动拉齐，零卡钩！";
      snagStatus.classList.add("is-clean");
    } else if (snaggedIdx >= 0) {
      snagStatus.textContent = `实测卡钩：第 ${snagCards[snaggedIdx].tag} 张被上方高卡底边勾住，左侧空出大块缺口！`;
      snagStatus.classList.remove("is-clean");
    } else {
      snagStatus.textContent = "目前各卡高度接近，暂未卡钩——点击任意卡片「+ 加长文字撑高」立现错位！";
      snagStatus.classList.add("is-clean");
    }
  });
}

snagModeFloat.addEventListener("click", () => {
  snagMode = "float";
  snagModeFloat.setAttribute("aria-pressed", "true");
  snagModeGrid.setAttribute("aria-pressed", "false");
  renderSnagBoard();
});

snagModeGrid.addEventListener("click", () => {
  snagMode = "grid";
  snagModeFloat.setAttribute("aria-pressed", "false");
  snagModeGrid.setAttribute("aria-pressed", "true");
  renderSnagBoard();
});

document.getElementById("snag-reset").addEventListener("click", () => {
  snagCards = SNAG_CARDS_DEFAULT.map((c) => ({ ...c }));
  snagMode = "float";
  snagModeFloat.setAttribute("aria-pressed", "true");
  snagModeGrid.setAttribute("aria-pressed", "false");
  renderSnagBoard();
});

renderSnagBoard();

/* =====================================================================
 * 3. 03 节：深夜海军蓝暗版 · 四种清浮术真实 DOM 实测
 * ===================================================================== */
const clearDemoParent = document.getElementById("clear-demo-parent");
const clearRuler = document.getElementById("clear-ruler");
const clearRulerTag = document.getElementById("clear-ruler-tag");
const clearRulerNum = document.getElementById("clear-ruler-num");
const clearRulerSub = document.getElementById("clear-ruler-sub");
const clearExpTitle = document.getElementById("clear-exp-title");
const clearExpBody = document.getElementById("clear-exp-body");
const verdictHeight = document.getElementById("verdict-height");
const verdictHeightV = document.getElementById("verdict-height-v");
const verdictBadge = document.getElementById("verdict-badge");
const verdictBadgeV = document.getElementById("verdict-badge-v");
const clearExpCode = document.getElementById("clear-exp-code");

const CLEAR_TECH_INFO = {
  none: {
    title: "未清除浮动：父框计算高度时忽略浮块",
    body: "三枚朱红块脱离普通块流，父框只能靠那一行文字勉强撑起几十像素；朱红块大半截刺出虚线边框，压进了下方兄弟容器里。",
    badgeOk: true,
    badgeText: "完好可见（但父框塌了）",
    code: `.box {\n  /* 未设任何清浮机制 */\n  /* 父容器高度塌陷，虚线框包不住浮块 */\n}`,
  },
  overflow: {
    title: "overflow: hidden：包住了浮块，却误裁探出角标",
    body: "早期前端常用 overflow: hidden 顺手触发 BFC 来防塌陷。请立刻抬头看右上角——那枚探出父框 12px 的「NEW +12px」角标被硬生生切掉了一半！弹窗菜单与投影也会同遭腰斩。",
    badgeOk: false,
    badgeText: "惨遭裁切（被隐藏掉一半）",
    code: `.box {\n  overflow: hidden; /* 触发 BFC，但会裁掉所有超出边框的角标与阴影 */\n}`,
  },
  clearfix: {
    title: "::after Micro Clearfix：老牌无裁剪清浮法",
    body: "Nicolas Gallagher 2011 年推广的伪元素方案：在父框末尾塞入一个隐形块并声明 clear: both，把父框底边拉到浮块之下，也不裁角标。唯一缺点是写法啰嗦、占用 ::after 伪元素。",
    badgeOk: true,
    badgeText: "完好无损",
    code: `.box::after {\n  content: "";\n  display: block;\n  clear: both;\n}`,
  },
  "flow-root": {
    title: "display: flow-root：现代一线清浮标准",
    body: "CSS Display Level 3 专为此事打造的语义属性：一行代码建立独立块格式化上下文（BFC），父框稳稳包住三枚浮块，同时不占伪元素、绝不裁剪右上角探出的 NEW 角标。",
    badgeOk: true,
    badgeText: "完好无损 · 推荐首选",
    code: `.box {\n  display: flow-root; /* 现代标准：一行防塌陷，零裁剪副作用 */\n}`,
  },
};

function applyClearTech(tech) {
  clearDemoParent.classList.remove("tech-overflow", "tech-clearfix", "tech-flow-root");
  if (tech === "overflow") clearDemoParent.classList.add("tech-overflow");
  if (tech === "clearfix") clearDemoParent.classList.add("tech-clearfix");
  if (tech === "flow-root") clearDemoParent.classList.add("tech-flow-root");

  document.querySelectorAll("[data-clear-tech]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.clearTech === tech));
  });

  const info = CLEAR_TECH_INFO[tech];
  clearExpTitle.textContent = info.title;
  clearExpBody.textContent = info.body;
  clearExpCode.textContent = info.code;

  verdictBadge.classList.toggle("is-bad", !info.badgeOk);
  verdictBadgeV.textContent = info.badgeText;

  requestAnimationFrame(() => {
    const pRect = clearDemoParent.getBoundingClientRect();
    const sq = clearDemoParent.querySelector(".clear-sq");
    const sqRect = sq.getBoundingClientRect();
    const collapse = Math.max(0, Math.round(sqRect.bottom - (pRect.bottom - 2)));
    const isCollapsed = collapse > 3;

    clearDemoParent.classList.toggle("is-collapsed", isCollapsed);
    clearRuler.classList.toggle("is-collapsed", isCollapsed);
    clearRulerTag.textContent = isCollapsed ? "高度塌陷" : "高度正常";
    clearRulerNum.textContent = `${Math.round(pRect.height)}`;
    clearRulerSub.textContent = isCollapsed
      ? `浮块探出父框 ${collapse}px`
      : "父框完整包裹浮块";

    verdictHeight.classList.toggle("is-bad", isCollapsed);
    verdictHeightV.textContent = isCollapsed
      ? `${Math.round(pRect.height)}px（塌陷 -${collapse}px）`
      : `${Math.round(pRect.height)}px（完整包裹）`;
  });
}

document.querySelectorAll("[data-clear-tech]").forEach((btn) => {
  btn.addEventListener("click", () => applyClearTech(btn.dataset.clearTech));
});
applyClearTech("none");

/* =====================================================================
 * 4. 04 节：shape-outside 轮廓雕刻器
 * ===================================================================== */
const shapeFloater = document.getElementById("shape-floater");
const shapeNameVal = document.getElementById("shape-name-val");
const shapeMarginRange = document.getElementById("shape-margin-range");
const shapeMarginVal = document.getElementById("shape-margin-val");
const shapeNote = document.getElementById("shape-note");
const shapeCode = document.getElementById("shape-code");

const SHAPE_INFO = {
  box: {
    cls: "shape-box",
    word: "FLOAT",
    prop: "border-box",
    note: "传统矩形边界：每行文字缩进完全一致，适合方正照片或引文卡片，但遇到圆形头像或异形剪影时四周会显得生硬。",
  },
  circle: {
    cls: "shape-circle",
    word: "FLOAT",
    prop: "circle(50%)",
    note: "正圆轮廓：文字顺着圆弧上下渐宽、中腰收窄，是杂志专访肖像和徽章配图最经典的现代浮动用法。",
  },
  polygon: {
    cls: "shape-polygon",
    word: "FLOW",
    prop: "polygon(0 0, 74% 0, 100% 52%, 62% 100%, 0 100%)",
    note: "斜切多边形：文字沿着倾斜切边梯级推进，呈现强烈的平面海报动势，完全无需手动加换行符。",
  },
  dropcap: {
    cls: "shape-dropcap",
    word: "浮",
    prop: "border-box (Drop Cap)",
    note: "首字下沉：将首字浮动到左缘并压紧行高，正文紧随其右排满三行后自然回归整栏，还原古典书籍开篇韵味。",
  },
};

let currentShape = "circle";

function renderShapeLab() {
  const info = SHAPE_INFO[currentShape];
  const m = Number(shapeMarginRange.value);
  shapeFloater.className = `shape-floater ${info.cls}`;
  shapeFloater.textContent = info.word;
  shapeFloater.style.shapeMargin = `${m}px`;
  shapeFloater.style.marginRight = currentShape === "box" || currentShape === "dropcap" ? `${Math.max(12, m)}px` : `${Math.max(10, m)}px`;

  shapeNameVal.textContent = info.prop;
  shapeMarginVal.textContent = `${m}px`;
  shapeNote.textContent = info.note;

  if (currentShape === "dropcap") {
    shapeCode.textContent = `.drop-cap {\n  float: left;\n  font-size: 62px;\n  line-height: 1;\n  margin: 0 ${Math.max(12, m)}px 8px 0;\n}`;
  } else {
    shapeCode.textContent = `.figure {\n  float: left;\n  shape-outside: ${info.prop};\n  shape-margin: ${m}px;\n}`;
  }

  document.querySelectorAll("[data-shape]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.shape === currentShape));
  });
}

document.querySelectorAll("[data-shape]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentShape = btn.dataset.shape;
    renderShapeLab();
  });
});
shapeMarginRange.addEventListener("input", renderShapeLab);
renderShapeLab();

/* =====================================================================
 * 5. 05 节：三十年历史时间轴
 * ===================================================================== */
const timelineNav = document.getElementById("timeline-nav");
const tlTitle = document.getElementById("tl-title");
const tlWho = document.getElementById("tl-who");
const tlDesc = document.getElementById("tl-desc");
const tlPain = document.getElementById("tl-pain");
const tlCode = document.getElementById("tl-code");

function selectEra(idx) {
  const node = TIMELINE_NODES[idx];
  tlTitle.textContent = `${node.year} · ${node.title}`;
  tlWho.textContent = node.who;
  tlDesc.textContent = node.desc;
  tlPain.textContent = `时代观察：${node.pain}`;
  tlCode.textContent = node.code;
  timelineNav.querySelectorAll(".era-btn").forEach((b, i) => {
    b.setAttribute("aria-pressed", String(i === idx));
  });
}

timelineNav.innerHTML = TIMELINE_NODES.map(
  (n, i) => `
  <button type="button" class="era-btn" data-era="${i}" aria-pressed="${i === 0}">
    <span class="era-btn__year">${n.year}</span>
    <span class="era-btn__name">${n.era}</span>
  </button>`
).join("");

timelineNav.querySelectorAll(".era-btn").forEach((b) => {
  b.addEventListener("click", () => selectEra(Number(b.dataset.era)));
});
selectEra(0);

/* =====================================================================
 * 6. 06 节：何时该浮 · 场景需求分诊台
 * ===================================================================== */
const triageList = document.getElementById("triage-list");
const triagePill = document.getElementById("triage-pill");
const triageTitle = document.getElementById("triage-title");
const triageReason = document.getElementById("triage-reason");
const triageCss = document.getElementById("triage-css");
const triageLinkRow = document.getElementById("triage-link-row");

function selectTriage(idx) {
  const c = TRIAGE_CASES[idx];
  triagePill.textContent = c.verdictText;
  triagePill.classList.toggle("is-avoid", c.verdict === "avoid");
  triageTitle.textContent = c.label;
  triageReason.textContent = c.reason;
  triageCss.textContent = c.css;
  triageLinkRow.innerHTML = c.linkUrl
    ? `推荐直达：<a href="${c.linkUrl}">${c.linkText} →</a>`
    : "判断：这正是浮动布局最拿手的原生主场。";

  triageList.querySelectorAll(".triage-item").forEach((b, i) => {
    b.setAttribute("aria-pressed", String(i === idx));
  });
}

triageList.innerHTML = TRIAGE_CASES.map(
  (c, i) => `
  <button type="button" class="triage-item" data-triage="${i}" aria-pressed="${i === 0}">
    <span>${c.label}</span>
    <span class="triage-arrow" aria-hidden="true">→</span>
  </button>`
).join("");

triageList.querySelectorAll(".triage-item").forEach((b) => {
  b.addEventListener("click", () => selectTriage(Number(b.dataset.triage)));
});
selectTriage(0);

/* =====================================================================
 * 7. 07 节：四选一实战小练习（只差父容器一条 CSS，纯中性选项）
 * ===================================================================== */
const quizGrid = document.getElementById("quiz-grid");
const quizFeedback = document.getElementById("quiz-feedback");
const quizFbTitle = document.getElementById("quiz-fb-title");
const quizFbBody = document.getElementById("quiz-fb-body");

quizGrid.innerHTML = QUIZ_OPTIONS.map(
  (opt, idx) => `
  <button type="button" class="quiz-opt" data-quiz="${idx}">
    <div class="quiz-opt__head">
      <span class="quiz-letter">${opt.id}</span>
      <span class="quiz-code">.card { ${opt.cssLine} }</span>
    </div>
    <div class="quiz-preview-stage" aria-hidden="true">
      <div class="quiz-mini-card ${opt.cardClass}">
        <span class="quiz-mini-badge">精选</span>
        <div class="quiz-mini-thumb"></div>
        <p class="quiz-mini-copy">摘要仅两行，比左侧缩略图矮一截。</p>
      </div>
    </div>
  </button>`
).join("");

quizGrid.querySelectorAll(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.quiz);
    const chosen = QUIZ_OPTIONS[idx];

    quizGrid.querySelectorAll(".quiz-opt").forEach((b, i) => {
      b.classList.remove("is-selected", "is-correct", "is-wrong");
      if (i === idx) b.classList.add("is-selected", chosen.correct ? "is-correct" : "is-wrong");
      if (QUIZ_OPTIONS[i].correct && !chosen.correct) b.classList.add("is-correct");
    });

    quizFeedback.classList.add("is-open");
    quizFeedback.classList.toggle("is-right", chosen.correct);
    quizFeedback.classList.toggle("is-wrong", !chosen.correct);
    quizFbTitle.textContent = chosen.correct
      ? `答对了 · 方案 ${chosen.id}（${chosen.verdict}）`
      : `再看一眼 · 你选了方案 ${chosen.id}（${chosen.verdict}）`;
    quizFbBody.textContent = chosen.correct
      ? chosen.explain
      : `${chosen.explain} 正确做法是方案 C（display: flow-root;）：它建立独立 BFC 撑开父框高度，同时保留溢出可见，让右上角「精选」角标完好无损。`;
  });
});

/* =====================================================================
 * 8. 08 节：原海报全屏放大、缩放、拖移灯箱（复用 #poster.src）
 * ===================================================================== */
const posterImg = document.getElementById("poster");
const openPosterBtn = document.getElementById("open-poster-btn");
const lightbox = document.getElementById("poster-lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbPan = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.classList.add("is-open");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  openPosterBtn.focus();
}

openPosterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.16 : -0.16;
  lbScale = Math.max(0.6, Math.min(3.2, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  e.preventDefault();
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
  lbPan = { startX: e.clientX - lbX, startY: e.clientY - lbY };
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbPan) return;
  lbX = e.clientX - lbPan.startX;
  lbY = e.clientY - lbPan.startY;
  applyLbTransform();
});

lbStage.addEventListener("pointerup", () => { lbPan = null; });
lbStage.addEventListener("pointercancel", () => { lbPan = null; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
    closeLightbox();
  }
});
