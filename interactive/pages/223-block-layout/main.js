import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BROKEN_STATE,
  CONTEXTS,
  DISPLAY_MODES,
  FAULTS,
  MODULE_METRICS,
  PATTERNS,
  POSTER_EXAMPLES,
  QUIZ,
  SOLUTIONS,
  TIMELINE,
  TRIAGE_CASES,
  clamp,
  evaluate,
} from "./model.js";

const $ = (id) => document.getElementById(id);

// ==================== 主状态（所有读写走 model.js 单一事实源） ====================
const state = { ...BROKEN_STATE };
let latestEval = evaluate(state);
let stageDirty = true;
let introDone = false;

// 02 节独立状态
const eqState = {
  parentW: 560,
  mode: "auto",   // auto | pct-content | pct-border | center
  pad: 24,
  bdr: 4,
  mb: 24,
  mt: 32,
  colMode: "collapse", // collapse | bfc
};
let eqDirty = true;

// 03 / 04 / 05 / 06 状态
let activeExId = "single";
let exShowPure = false;
let activeTlIdx = 0;
let activeTriageId = TRIAGE_CASES[0].id;
let pickedQuizKey = null;

// ==================== 同步更新开场 DOM 与读数 ====================
function renderHeroDOM() {
  const ev = evaluate(state);
  latestEval = ev;
  const ctx = CONTEXTS[state.context];

  // 1. 顶栏状态 & 自示范刊头「块级布局」四字联动
  const topPill = $("top-status-pill");
  topPill.textContent = `${ev.passed}/4 · ${ev.gradeLabel}`;
  topPill.classList.toggle("is-pass", ev.passed === 4);

  const demoTitle = $("demo-title");
  demoTitle.classList.toggle("is-broken", ev.passed < 2);
  demoTitle.classList.toggle("is-clear", ev.passed === 4);
  demoTitle.style.setProperty("--title-gap", `${Math.round(2 + ev.coherence * 8)}px`);

  const isCompact = window.innerWidth <= 640 || (window.innerHeight <= 460 && window.innerWidth > window.innerHeight);

  // 2. 舞台 HUD
  $("hud-dims").textContent = isCompact
    ? `宽 ${ev.cw}px · 槽 ${ev.mainSlotW}px`
    : `CONTAINER ${ev.cw}px · MAIN SLOT ${ev.mainSlotW}px · RENDER ${ev.totalRenderW}px`;
  const hudVerdict = $("hud-verdict");
  hudVerdict.textContent = `${ev.passed}/4 · ${ev.gradeLabel}`;
  hudVerdict.className = ev.passed === 4 ? "hud-ok" : "hud-bad";

  // 3. 语境文案与原海报圆日双峰显示
  $("lbl-container").textContent = ctx.containerLabel;
  $("lbl-module").textContent = ctx.moduleLabel;
  $("cap-width-readout").textContent = `${ev.cw}px`;
  $("txt-hdr-zh").textContent = ctx.headerZh;
  $("txt-hdr-en").textContent = ctx.headerEn;
  $("txt-cnt-zh").textContent = ctx.contentZh;
  $("txt-cnt-en").textContent = ctx.contentEn;
  $("txt-cnt-sub").textContent = ctx.contentSub;
  $("txt-ftr-zh").textContent = ctx.footerZh;
  $("txt-ftr-en").textContent = ctx.footerEn;
  $("poster-motif").classList.toggle("is-hidden", !ctx.showArt);

  // 4. 容器宽度按视口等比映射到可用宽度，宽屏充分舒展、窄屏绝不横向溢出
  const vp = $("stage-viewport");
  const vpRect = vp.getBoundingClientRect();
  const availW = Math.max(210, vpRect.width - (isCompact ? 56 : 86));
  const trackMax = Math.min(availW, 740);
  const scaleW = trackMax / 680;
  const visualContainerW = Math.max(176, Math.round(ev.cw * scaleW));
  const liveContainer = $("live-container");
  liveContainer.style.width = `${visualContainerW}px`;
  liveContainer.classList.toggle("is-open-seal", state.sealMode === "open");
  liveContainer.classList.toggle("is-flow-root", state.sealMode === "flow-root");

  // 内距缩放显示，确保窄屏不挤压裁字
  const visualPad = state.sealMode === "open" ? 0 : Math.max(6, Math.round(ev.pad * Math.min(1, scaleW + 0.12)));
  $("module-shell").style.setProperty("--shell-pad", `${visualPad}px`);

  // 顶边距穿透警示带与直点修复胶囊
  $("escape-band").classList.toggle("is-visible", ev.marginEscapePx > 0);
  const pillSeal = $("pill-seal");
  pillSeal.hidden = ev.marginEscapePx === 0;
  pillSeal.textContent = isCompact ? "× 点封口" : "× 顶距穿透 · 点此封口";

  // 组合模式与三栏左导
  const slots = $("body-slots");
  slots.dataset.pattern = state.pattern;
  $("blk-nav-col").hidden = state.pattern !== "threeCol";

  // 主内容块：inline 塌陷 / inline-block 收缩 / 100% content-box 溢墙
  const blkContent = $("blk-content");
  blkContent.classList.toggle("is-inline-fault", state.contentDisplay === "inline");
  blkContent.classList.toggle("is-ib-mode", state.contentDisplay === "inline-block");
  blkContent.classList.toggle("is-overflow-wall", ev.overflowPx > 0);
  const visualOverflow = ev.overflowPx > 0 ? Math.max(16, Math.min(38, Math.round(ev.overflowPx * scaleW * 0.85))) : 0;
  blkContent.style.setProperty("--overflow-visual", `${visualOverflow}px`);

  const pillContent = $("pill-content");
  if (state.contentDisplay === "inline") {
    pillContent.hidden = false;
    pillContent.textContent = isCompact ? "× 切 block" : "× 行内塌陷 · 点切 block";
    pillContent.dataset.fix = "block";
  } else if (ev.overflowPx > 0) {
    pillContent.hidden = false;
    pillContent.textContent = isCompact ? "× 改 auto" : `× 溢墙 +${ev.overflowPx}px · 点改 auto`;
    pillContent.dataset.fix = "autoWidth";
  } else if (state.contentDisplay === "inline-block") {
    pillContent.hidden = false;
    pillContent.textContent = isCompact ? "× 切 block" : "× 收缩不占行 · 点切 block";
    pillContent.dataset.fix = "block";
  } else {
    pillContent.hidden = true;
  }

  // 辅助区动态增删子块 & 定高溢底效果
  const auxStack = $("aux-stack");
  auxStack.classList.toggle("is-fixed-height", state.heightMode === "fixed");
  const frag = document.createDocumentFragment();
  for (let i = 0; i < ev.auxCount; i++) {
    const meta = ctx.sideItems[i] || { zh: `扩展块 ${i + 1}`, en: `BLOCK 0${i + 1}`, meta: "扩展槽" };
    const item = document.createElement("div");
    item.className = "aux-item";
    if (state.heightMode === "fixed" && i >= 1) item.classList.add("is-overflowing");
    item.innerHTML = `<strong>${meta.zh}</strong><span lang="en">${meta.en}</span>`;
    frag.appendChild(item);
  }
  auxStack.replaceChildren(frag);
  const pillAux = $("pill-aux");
  pillAux.hidden = ev.auxOverflowPx === 0;
  pillAux.textContent = isCompact ? "× 改 auto" : "× 定高溢底 · 点改 auto";
  $("blk-footer").classList.toggle("is-collided", ev.auxOverflowPx > 0);

  // 5. 控件读数与高亮同步
  $("rng-cw").value = String(ev.cw);
  $("val-cw").textContent = `${ev.cw}px`;
  $("rng-pad").value = String(state.sealMode === "open" ? 0 : ev.pad);
  $("val-pad").textContent = state.sealMode === "open" ? "0px（未封口）" : `${ev.pad}px`;
  $("val-aux-count").textContent = `${ev.auxCount} 块`;
  $("btn-aux-dec").disabled = ev.auxCount <= 1;
  $("btn-aux-inc").disabled = ev.auxCount >= 7;

  document.querySelectorAll(".ctx-tab").forEach((b) => {
    const on = b.dataset.ctx === state.context;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
    b.textContent = isCompact ? (b.dataset.short || b.textContent) : (b.dataset.full || b.textContent);
  });

  document.querySelectorAll(".seg-btn").forEach((b) => {
    const key = b.dataset.set;
    const val = b.dataset.val;
    const on = state[key] === val;
    const isFaultChoice =
      (key === "contentDisplay" && val === "inline") ||
      (key === "widthMode" && val === "pct-content") ||
      (key === "sealMode" && val === "open") ||
      (key === "heightMode" && val === "fixed");
    b.classList.toggle("is-active", on && !isFaultChoice);
    b.classList.toggle("is-fault-active", on && isFaultChoice);
    b.setAttribute("aria-pressed", String(on));
  });

  document.querySelectorAll(".pat-btn").forEach((b) => {
    const on = b.dataset.pat === state.pattern;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  $("btn-xray").setAttribute("aria-pressed", String(state.xray));

  // 6. 右侧炭黑「分块原则」竖板单真源诊单 & 4 项探针 & 活体 CSS
  const auditBox = $("audit-box");
  auditBox.classList.toggle("is-pass", ev.passed === 4);
  $("audit-score").textContent = `${ev.passed}/4 · ${ev.gradeLabel}`;
  $("audit-solution").textContent = ev.passed === 4 ? ev.solutionName : `待修 ${ev.issues.length} 项`;
  $("audit-title").textContent = ev.headline;
  $("audit-why").textContent = ev.why;
  $("audit-next").textContent = ev.action;

  // 手机快捷诊单同步
  $("mqa-line").textContent = `${ev.passed}/4 · ${ev.headline}`;

  // 四条原则探针实时徽标
  const badgeMap = {
    independent: ev.checks.independent
      ? "零溢出"
      : ev.overflowPx > 0
        ? `溢 +${ev.overflowPx}px`
        : ev.marginEscapePx > 0
          ? "顶距穿透"
          : "非块级",
    composable: ev.checks.composable
      ? `${PATTERNS[state.pattern].short}稳态`
      : state.contentDisplay !== "block"
        ? "未成块"
        : ev.colMinW < 96
          ? `栏宽 ${ev.colMinW}px`
          : `内距 ${Math.round(ev.padRatio * 100)}%`,
    extensible: ev.checks.extensible
      ? `${ev.auxCount} 块自伸`
      : ev.auxOverflowPx > 0
        ? `溢底 +${ev.auxOverflowPx}px`
        : `过碎 ${ev.auxCount} 块`,
    hierarchy: ev.checks.hierarchy
      ? `主槽 ${ev.mainSharePct}%`
      : state.contentDisplay !== "block"
        ? "块形瓦解"
        : `主槽 ${ev.mainSharePct}%`,
  };

  document.querySelectorAll(".p-item").forEach((li) => {
    const k = li.dataset.check;
    const ok = !!ev.checks[k];
    li.classList.toggle("is-ok", ok);
    const badge = $(`chk-${k}`);
    if (badge) badge.textContent = badgeMap[k];
  });

  $("css-eq-badge").textContent = ev.overflowPx > 0
    ? `超槽 +${ev.overflowPx}px`
    : `总宽 = ${ev.totalRenderW}px`;
  $("live-css-code").textContent = ev.cssLines.join("\n");

  stageDirty = true;
}

// ==================== 开场 2D Canvas 构成主义盒尺 X-Ray 叠层 ====================
function setupHeroCanvas() {
  const stageFrame = $("stage-frame");
  const vp = $("stage-viewport");
  const canvas = $("stage-canvas");
  const ctx = canvas.getContext("2d");

  let lastW = 0;
  let lastH = 0;
  let lastDpr = 0;

  function resizeIfNeeded() {
    const r = vp.getBoundingClientRect();
    const dpr = pixelRatio(1.5);
    const w = Math.max(100, Math.round(r.width));
    const h = Math.max(100, Math.round(r.height));
    if (w !== lastW || h !== lastH || dpr !== lastDpr) {
      lastW = w;
      lastH = h;
      lastDpr = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      stageDirty = true;
    }
    return { w, h, dpr };
  }

  function drawOverlay(t, dt, { still }) {
    const { w, h, dpr } = resizeIfNeeded();
    const introP = still ? 1 : clamp(t / 0.8, 0, 1);
    const animActive = (!still && introP < 1) || (!still && state.xray);

    if (!stageDirty && !animActive) return;
    if (introP >= 1) introDone = true;
    stageDirty = false;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const vpR = vp.getBoundingClientRect();
    const conR = $("live-container").getBoundingClientRect();
    const cntR = $("blk-content").getBoundingClientRect();
    const auxR = $("aux-stack").getBoundingClientRect();
    const ev = latestEval;

    const cx = conR.left - vpR.left;
    const cy = conR.top - vpR.top;
    const cw = conR.width;
    const ch = conR.height;

    const ease = 1 - Math.pow(1 - introP, 3);

    // 1. 顶部容器宽度构成主义卡尺线
    const rulerY = Math.max(7, cy - 6);
    const drawW = cw * ease;
    ctx.strokeStyle = "#141510";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(cx, rulerY);
    ctx.lineTo(cx + drawW, rulerY);
    ctx.moveTo(cx, rulerY - 4);
    ctx.lineTo(cx, rulerY + 4);
    ctx.moveTo(cx + drawW, rulerY - 4);
    ctx.lineTo(cx + drawW, rulerY + 4);
    ctx.stroke();

    // 右墙拖拽指引箭头与实时 px 标
    const rightX = cx + cw;
    ctx.fillStyle = "#141510";
    ctx.font = "600 11px 'IBM Plex Mono', monospace";
    const dimText = `${ev.cw}px`;
    const tx = clamp(rightX + 15, cx + 40, w - 42);
    ctx.fillText(dimText, tx, cy + ch * 0.5 + 4);

    // 2. 溢墙红斜纹警示区（当 width: 100% + content-box 冲破容器右壁时）
    if (ev.overflowPx > 0) {
      const bx = cntR.left - vpR.left;
      const by = cntR.top - vpR.top;
      const bw = cntR.width;
      const bh = cntR.height;
      const wallX = Math.min(cx + cw, bx + bw - 10);
      const ovW = Math.max(12, bx + bw - wallX);

      ctx.save();
      ctx.fillStyle = "rgba(184, 37, 16, 0.22)";
      ctx.fillRect(wallX, by, ovW, bh);
      ctx.strokeStyle = "#B82510";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(wallX, by, ovW, bh);
      ctx.setLineDash([]);
      // 右墙警示竖线
      ctx.beginPath();
      ctx.moveTo(wallX, cy - 4);
      ctx.lineTo(wallX, cy + ch + 4);
      ctx.stroke();
      ctx.restore();
    }

    // 3. 辅助区定高溢底警戒线
    if (ev.auxOverflowPx > 0 && auxR.width > 10) {
      const ax = auxR.left - vpR.left;
      const ay = auxR.top - vpR.top + auxR.height;
      ctx.save();
      ctx.strokeStyle = "#B82510";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(ax - 4, ay);
      ctx.lineTo(ax + auxR.width + 6, ay);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 按 Space 开启「盒尺透视 X-Ray」：画主内容块四层盒尺与构成主义扫描线
    if (state.xray) {
      const bx = cntR.left - vpR.left;
      const by = cntR.top - vpR.top;
      const bw = cntR.width;
      const bh = cntR.height;

      // 外围内边距青色框与内容净宽虚线框
      ctx.save();
      ctx.strokeStyle = "#155E4B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(bx + 10, by + 10, Math.max(20, bw - 20), Math.max(20, bh - 20));
      ctx.setLineDash([]);

      // 水平扫描激光线（reducedMotion 时定格在中心）
      const scanFrac = still ? 0.5 : (t * 0.45) % 1;
      const scanY = cy + scanFrac * ch;
      ctx.strokeStyle = "rgba(214, 81, 25, 0.78)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, scanY);
      ctx.lineTo(cx + cw, scanY);
      ctx.stroke();

      // 底部七段水平恒等式盒尺条
      const eqY = Math.min(h - 14, cy + ch + 11);
      ctx.fillStyle = "#141510";
      ctx.fillRect(cx, eqY - 9, Math.min(w - cx - 8, Math.max(190, cw)), 16);
      ctx.fillStyle = "#F7CB63";
      ctx.font = "600 10.5px 'IBM Plex Mono', monospace";
      const eqLabel = `b:${ev.bL}+p:${ev.pL}+w:${ev.contentBoxW}+p:${ev.pR}+b:${ev.bR}=${ev.totalRenderW}px`;
      ctx.fillText(eqLabel, cx + 6, eqY + 2);
      ctx.restore();
    }

    ctx.restore();
  }

  const ctl = loop(stageFrame, drawOverlay);
  return { draw: () => { stageDirty = true; ctl.draw(); } };
}

// ==================== 舞台手势拖动（[data-perf-drag] 横向推拉容器宽，保留竖向滚屏与胶囊点击） ====================
function setupStageInteractions(heroCanvasCtl) {
  const stage = $("stage-frame");
  let dragActive = false;
  let movedDrag = false;
  let suppressNextClick = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startW = state.containerW;
  let lockedAxis = null; // "x" | "y" | null

  function isHardControl(el) {
    return !!(el && el.closest("input, a"));
  }

  function applyWidthFromDelta(dx) {
    const vpW = Math.max(200, $("stage-viewport").getBoundingClientRect().width - 64);
    const ratio = 680 / Math.max(200, vpW);
    const nextW = Math.round(clamp(startW + dx * Math.max(1, ratio * 0.9), 280, 680));
    if (nextW !== state.containerW) {
      state.containerW = nextW;
      renderHeroDOM();
      heroCanvasCtl.draw();
    } else {
      stageDirty = true;
      heroCanvasCtl.draw();
    }
  }

  // 若刚刚完成了一次横拖，拦掉紧随其后的 click，防止误触画布内胶囊
  stage.addEventListener("click", (e) => {
    if (suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClick = false;
    }
  }, true);

  // 鼠标 / 触控笔 Pointer 事件
  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (isHardControl(e.target)) return;
    dragActive = true;
    movedDrag = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startW = state.containerW;
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragActive || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    if (!movedDrag && Math.abs(dx) < 5) return;
    movedDrag = true;
    applyWidthFromDelta(dx);
  });

  const endPointer = (e) => {
    if (!dragActive || e.pointerId !== pointerId) return;
    if (movedDrag) suppressNextClick = true;
    dragActive = false;
    movedDrag = false;
    pointerId = null;
  };
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);

  // 触屏 Touch 事件（perf.mjs 从 data-perf-drag 中心派发 touchStart/touchMove/touchEnd）
  stage.addEventListener("touchstart", (e) => {
    if (isHardControl(e.target) || e.touches.length !== 1) return;
    const t = e.touches[0];
    dragActive = true;
    movedDrag = false;
    lockedAxis = null;
    startX = t.clientX;
    startY = t.clientY;
    startW = state.containerW;
  }, { passive: true });

  stage.addEventListener("touchmove", (e) => {
    if (!dragActive || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (!lockedAxis) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (lockedAxis === "x") {
      e.preventDefault();
      movedDrag = true;
      applyWidthFromDelta(dx);
    }
  }, { passive: false });

  const endTouch = () => {
    if (movedDrag) suppressNextClick = true;
    dragActive = false;
    movedDrag = false;
    lockedAxis = null;
  };
  stage.addEventListener("touchend", endTouch, { passive: true });
  stage.addEventListener("touchcancel", endTouch, { passive: true });

  // 键盘控制：聚焦舞台时方向键调容器宽，Space 切换盒尺透视
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.containerW = clamp(state.containerW - 16, 280, 680);
      renderHeroDOM();
      heroCanvasCtl.draw();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.containerW = clamp(state.containerW + 16, 280, 680);
      renderHeroDOM();
      heroCanvasCtl.draw();
    } else if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      state.xray = !state.xray;
      renderHeroDOM();
      heroCanvasCtl.draw();
    }
  });

  // 全局 Space 快捷切换盒尺透视（只要未在按钮/输入框里）
  window.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.code === "Space") && !e.target.closest("button, input, a, [role='application']")) {
      const r = stage.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        e.preventDefault();
        state.xray = !state.xray;
        renderHeroDOM();
        heroCanvasCtl.draw();
      }
    }
  });
}

// ==================== 绑定开场全部控件 ====================
function bindHeroControls(heroCanvasCtl) {
  const sync = () => {
    renderHeroDOM();
    heroCanvasCtl.draw();
  };

  // 语境切换
  document.querySelectorAll(".ctx-tab").forEach((b) => {
    b.addEventListener("click", () => {
      state.context = b.dataset.ctx;
      sync();
    });
  });

  // 盒尺透视按钮（桌面 + 手机）
  const toggleXray = () => {
    state.xray = !state.xray;
    sync();
  };
  $("btn-xray").addEventListener("click", toggleXray);
  $("btn-xray-mobile").addEventListener("click", toggleXray);

  // 画布内直点病灶就地修复
  $("pill-seal").addEventListener("click", (e) => {
    e.stopPropagation();
    state.sealMode = "padded";
    if (state.containerPad < 12) state.containerPad = 16;
    sync();
  });

  $("pill-content").addEventListener("click", (e) => {
    e.stopPropagation();
    const fix = e.currentTarget.dataset.fix;
    if (fix === "block") state.contentDisplay = "block";
    else if (fix === "autoWidth") state.widthMode = "auto";
    sync();
  });

  $("pill-aux").addEventListener("click", (e) => {
    e.stopPropagation();
    state.heightMode = "auto";
    sync();
  });

  // 滑轨
  $("rng-cw").addEventListener("input", (e) => {
    state.containerW = Number(e.target.value);
    sync();
  });

  $("rng-pad").addEventListener("input", (e) => {
    const v = Number(e.target.value);
    if (v === 0) {
      state.sealMode = "open";
      state.containerPad = 0;
    } else {
      if (state.sealMode === "open") state.sealMode = "padded";
      state.containerPad = v;
    }
    sync();
  });

  // 属性刀闸
  document.querySelectorAll(".seg-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.set;
      const v = b.dataset.val;
      state[k] = v;
      if (k === "sealMode") {
        state.containerPad = v === "open" ? 0 : Math.max(12, state.containerPad || 16);
      }
      sync();
    });
  });

  // 真实增删模块
  $("btn-aux-dec").addEventListener("click", () => {
    state.auxCount = clamp(state.auxCount - 1, 1, 7);
    sync();
  });
  $("btn-aux-inc").addEventListener("click", () => {
    state.auxCount = clamp(state.auxCount + 1, 1, 7);
    sync();
  });

  // 组合模式
  document.querySelectorAll(".pat-btn").forEach((b) => {
    b.addEventListener("click", () => {
      state.pattern = b.dataset.pat;
      sync();
    });
  });

  // 合法多解预设
  document.querySelectorAll(".sol-btn").forEach((b) => {
    b.addEventListener("click", () => {
      Object.assign(state, SOLUTIONS[b.dataset.sol].patch);
      sync();
    });
  });

  // 双向试错预设
  document.querySelectorAll(".fault-btn").forEach((b) => {
    b.addEventListener("click", () => {
      Object.assign(state, FAULTS[b.dataset.fault].patch);
      sync();
    });
  });

  // 一键校准原海报解 & 复原错态
  const calibrate = () => {
    Object.assign(state, SOLUTIONS.posterClassic.patch);
    sync();
  };
  $("btn-calibrate").addEventListener("click", calibrate);
  $("btn-fix-mobile").addEventListener("click", calibrate);
  $("btn-reset").addEventListener("click", () => {
    Object.assign(state, BROKEN_STATE);
    sync();
  });

  window.addEventListener("resize", () => sync(), { passive: true });
}

// ==================== 01 节：三态真盒切片器 ====================
function setupSec01() {
  function renderMode(modeKey) {
    const m = DISPLAY_MODES[modeKey];
    $("slicer-arena").dataset.mode = modeKey;
    $("slicer-rule-tag").textContent = m.ruleTag;
    $("slicer-title").textContent = m.zh;
    $("slicer-summary").textContent = m.summary;
    $("slicer-use-note").textContent = m.useNote;
    $("slicer-props").innerHTML = m.props
      .map((p) => `<div><dt>${p.k}</dt><dd>${p.v}</dd></div>`)
      .join("");

    document.querySelectorAll(".slicer-tab").forEach((b) => {
      const on = b.dataset.dmode === modeKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  document.querySelectorAll(".slicer-tab").forEach((b) => {
    b.addEventListener("click", () => renderMode(b.dataset.dmode));
  });
  renderMode("block");
}

// ==================== 02 节：七段等式 Canvas + 垂直外边距折叠 ====================
function setupSec02() {
  const canvas = $("eq-canvas");
  const ctx = canvas.getContext("2d");

  function computeEq() {
    const P = eqState.parentW;
    const pad = eqState.pad;
    const bdr = eqState.bdr;
    const chrome = (pad + bdr) * 2;
    let mL = 0, mR = 0, contentW = 0, totalW = 0, overflow = 0, note = "";

    if (eqState.mode === "auto") {
      contentW = Math.max(40, P - chrome);
      totalW = P;
      note = `width: auto 下，浏览器先扣除左右边框 ${bdr * 2}px 与左右内边距 ${pad * 2}px，把剩余 ${contentW}px 留给内容区，总宽严丝合缝等于父宽 ${P}px。`;
    } else if (eqState.mode === "pct-content") {
      contentW = P;
      totalW = P + chrome;
      overflow = totalW - P;
      note = `默认 content-box 下，width: 100% 意味着「仅内容区 = ${P}px」。再加上边框与内边距 ${chrome}px，实际总宽冲到 ${totalW}px，撑出父容器 +${overflow}px！`;
    } else if (eqState.mode === "pct-border") {
      totalW = P;
      contentW = Math.max(40, P - chrome);
      note = `开启 border-box 后，width: 100% 锁住的是边框外缘 ${P}px，内边距与边框向盒内压缩内容区至 ${contentW}px，无论怎么调 padding 都绝不溢出。`;
    } else {
      contentW = Math.max(40, 340 - chrome);
      const rem = Math.max(0, P - 340);
      mL = Math.round(rem / 2);
      mR = rem - mL;
      totalW = P;
      note = `当定宽 340px（border-box）且左右 margin 均设为 auto，七段恒等式把剩余 ${rem}px 平分给左 ${mL}px 与右 ${mR}px，这就是块级水平居中的数学原理。`;
    }
    return { P, mL, bdr, pad, contentW, mR, totalW, overflow, note };
  }

  function renderEqDOM() {
    const d = computeEq();
    $("eq-val-pad").textContent = `${eqState.pad}px`;
    $("eq-val-bdr").textContent = `${eqState.bdr}px`;
    const badge = $("eq-h-status");
    badge.textContent = d.overflow > 0 ? `溢出 +${d.overflow}px` : `严丝合缝 ${d.totalW}px`;
    badge.classList.toggle("is-err", d.overflow > 0);
    $("eq-formula").textContent = `mL(${d.mL}) + bL(${d.bdr}) + pL(${d.pad}) + content(${d.contentW}) + pR(${d.pad}) + bR(${d.bdr}) + mR(${d.mR}) = ${d.totalW}px ${d.overflow > 0 ? `> 父宽 ${d.P}px` : `= 父宽 ${d.P}px`}`;
    $("eq-h-explain").textContent = d.note;

    document.querySelectorAll(".eq-mode-btn").forEach((b) => {
      const on = b.dataset.eqw === eqState.mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    eqDirty = true;
  }

  function drawEqCanvas() {
    if (!eqDirty) return;
    eqDirty = false;
    const dpr = pixelRatio(1.5);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width || 560));
    const h = 176;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const d = computeEq();
    const padX = 18;
    // 为可能出现的溢出留出右侧 22% 观察通道
    const maxScalePx = d.P * 1.24;
    const scale = (w - padX * 2) / maxScalePx;
    const parentPx = d.P * scale;

    // 父容器框
    ctx.fillStyle = "#F3E3CC";
    ctx.fillRect(padX, 34, parentPx, 102);
    ctx.strokeStyle = "#141510";
    ctx.lineWidth = 2;
    ctx.strokeRect(padX, 34, parentPx, 102);

    ctx.fillStyle = "#141510";
    ctx.font = "700 11px 'IBM Plex Mono', monospace";
    ctx.fillText(`父容器宽 ${d.P}px`, padX, 24);

    // 绘制七段条
    const segs = [
      { v: d.mL, color: "#EBD5B4", label: "mL", ink: "#141510" },
      { v: d.bdr, color: "#141510", label: "b", ink: "#FBF4E8" },
      { v: d.pad, color: "#D65119", label: "pL", ink: "#FFFFFF" },
      { v: d.contentW, color: "#F0B63E", label: `content ${d.contentW}px`, ink: "#141510" },
      { v: d.pad, color: "#D65119", label: "pR", ink: "#FFFFFF" },
      { v: d.bdr, color: "#141510", label: "b", ink: "#FBF4E8" },
      { v: d.mR, color: "#EBD5B4", label: "mR", ink: "#141510" },
    ];

    let x = padX;
    const barY = 58;
    const barH = 54;
    for (const s of segs) {
      if (s.v <= 0) continue;
      const sw = Math.max(2, s.v * scale);
      ctx.fillStyle = s.color;
      ctx.fillRect(x, barY, sw, barH);
      if (sw >= 24) {
        ctx.fillStyle = s.ink;
        ctx.font = "700 11px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(s.label, x + sw / 2, barY + barH / 2 + 4);
      }
      x += sw;
    }
    ctx.textAlign = "left";

    // 若溢出，标出红虚线与溢出像素
    if (d.overflow > 0) {
      const wallX = padX + parentPx;
      ctx.strokeStyle = "#B82510";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(wallX, 26);
      ctx.lineTo(wallX, 152);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#B82510";
      ctx.font = "700 11px 'IBM Plex Mono', monospace";
      ctx.fillText(`+${d.overflow}px 溢墙`, Math.min(w - 86, wallX + 6), 156);
    } else {
      ctx.fillStyle = "#155E4B";
      ctx.font = "700 11px 'IBM Plex Mono', monospace";
      ctx.fillText(`七段之和 = ${d.totalW}px（零溢出）`, padX, 156);
    }

    ctx.restore();
  }

  const eqCtl = loop(canvas, () => drawEqCanvas());

  document.querySelectorAll(".eq-mode-btn").forEach((b) => {
    b.addEventListener("click", () => {
      eqState.mode = b.dataset.eqw;
      renderEqDOM();
      eqCtl.draw();
    });
  });

  $("eq-rng-pad").addEventListener("input", (e) => {
    eqState.pad = Number(e.target.value);
    renderEqDOM();
    eqCtl.draw();
  });

  $("eq-rng-bdr").addEventListener("input", (e) => {
    eqState.bdr = Number(e.target.value);
    renderEqDOM();
    eqCtl.draw();
  });

  // 垂直外边距折叠交互
  function renderCollapse() {
    const mb = eqState.mb;
    const mt = eqState.mt;
    const isCollapse = eqState.colMode === "collapse";
    const actual = isCollapse ? Math.max(mb, mt) : mb + mt;
    const sum = mb + mt;

    $("col-mb-lbl").textContent = `${mb}px`;
    $("col-mt-lbl").textContent = `${mt}px`;
    $("col-val-mb").textContent = `${mb}px`;
    $("col-val-mt").textContent = `${mt}px`;

    const zone = $("col-gap-zone");
    zone.style.height = `${Math.max(22, Math.min(96, actual))}px`;
    $("col-gap-pill").textContent = isCollapse
      ? `实际间距 ${actual}px（max(${mb}, ${mt})，非 ${sum}px）`
      : `实际间距 ${actual}px（${mb} + ${mt} 直接相加）`;

    const badge = $("eq-v-status");
    badge.textContent = isCollapse ? `折叠取大 ${actual}px` : `独立相加 ${actual}px`;
    badge.classList.toggle("is-err", false);

    $("eq-v-explain").textContent = isCollapse
      ? `在普通块级文档流里，上方块底边距 ${mb}px 与下方块顶边距 ${mt}px 相遇后会合并成一个 ${actual}px 间距（CSS 2.1 §8.3.1），这样连续段落才不会出现双倍空洞。`
      : `把父容器改成弹性盒、网格或独立流根后，相邻块的外边距不再折叠，${mb}px 与 ${mt}px 直接累加为 ${actual}px——改用 gap 往往更省心。`;

    document.querySelectorAll(".col-mode-btn").forEach((b) => {
      const on = b.dataset.colmode === eqState.colMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  $("col-rng-mb").addEventListener("input", (e) => {
    eqState.mb = Number(e.target.value);
    renderCollapse();
  });
  $("col-rng-mt").addEventListener("input", (e) => {
    eqState.mt = Number(e.target.value);
    renderCollapse();
  });
  document.querySelectorAll(".col-mode-btn").forEach((b) => {
    b.addEventListener("click", () => {
      eqState.colMode = b.dataset.colmode;
      renderCollapse();
    });
  });

  renderEqDOM();
  eqCtl.draw();
  renderCollapse();
  window.addEventListener("resize", () => { eqDirty = true; eqCtl.draw(); }, { passive: true });
}

// ==================== 03 节：原海报底部四联图解真与偏 ====================
function setupSec03() {
  function renderEx() {
    const ex = POSTER_EXAMPLES.find((x) => x.id === activeExId) || POSTER_EXAMPLES[0];
    $("ex-detail-title").textContent = `${ex.title} · ${ex.en}`;
    const flipBtn = $("btn-ex-flip");
    flipBtn.setAttribute("aria-pressed", String(exShowPure));
    flipBtn.textContent = exShowPure
      ? "当前：纯 display: block 原样 · 点切现代容器"
      : "当前：现代块容器组合 · 点看纯 block 原样";

    const canvas = $("ex-canvas");
    canvas.dataset.ex = ex.id;
    canvas.dataset.pure = String(exShowPure);

    // 决定网格排布：若翻转到「纯 block 原样」，所有块一律竖排一列！
    if (exShowPure) {
      canvas.style.gridTemplateColumns = "1fr";
    } else if (ex.id === "twoCol") {
      canvas.style.gridTemplateColumns = "2fr 1fr";
    } else if (ex.id === "threeCol") {
      canvas.style.gridTemplateColumns = "1fr 2fr 1fr";
    } else {
      canvas.style.gridTemplateColumns = "1fr";
    }

    canvas.innerHTML = ex.blocks
      .map((blk) => {
        const areaStyle = exShowPure ? "" : `grid-area: ${blk.area};`;
        return `<div class="av-block av-${blk.role}" style="${areaStyle}">${blk.label}</div>`;
      })
      .join("");

    $("ex-code").textContent = exShowPure ? ex.cssPure : ex.cssModern;
    const tag = $("ex-badge");
    tag.textContent = ex.badge;
    tag.classList.toggle("is-pure", ex.isPureBlock);
    $("ex-desc").textContent = exShowPure ? ex.pureDesc : ex.modernDesc;
    $("ex-extra").textContent = exShowPure ? ex.modernDesc : ex.pureDesc;

    document.querySelectorAll(".ex-thumb").forEach((b) => {
      const on = b.dataset.ex === ex.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  document.querySelectorAll(".ex-thumb").forEach((b) => {
    b.addEventListener("click", () => {
      activeExId = b.dataset.ex;
      exShowPure = false;
      renderEx();
    });
  });

  $("btn-ex-flip").addEventListener("click", () => {
    exShowPure = !exShowPure;
    renderEx();
  });

  renderEx();
}

// ==================== 04 节：演进时间线 + 盒模型 SVG 图解 ====================
function setupSec04() {
  const FIGURES = {
    "doc-blocks": `<svg viewBox="0 0 260 140" width="260" height="140">
      <rect x="14" y="10" width="232" height="24" fill="#C94510"/>
      <text x="24" y="26" fill="#FFFFFF" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="600">&lt;h1&gt; 标题单元</text>
      <rect x="14" y="44" width="232" height="40" fill="#F0B63E" stroke="#141510" stroke-width="2"/>
      <text x="24" y="68" fill="#141510" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="600">&lt;p&gt; 段落独立成块</text>
      <rect x="14" y="94" width="232" height="34" fill="#141510"/>
      <text x="24" y="115" fill="#FBF4E8" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="600">&lt;ul&gt; 列表结构块</text>
    </svg>`,
    "css1-eq": `<svg viewBox="0 0 260 140" width="260" height="140">
      <rect x="10" y="24" width="240" height="86" fill="#F3E3CC" stroke="#141510" stroke-width="2"/>
      <rect x="26" y="42" width="208" height="50" fill="#C94510"/>
      <rect x="44" y="54" width="172" height="26" fill="#F0B63E"/>
      <text x="130" y="71" text-anchor="middle" fill="#141510" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="700">m+b+p+w+p+b+m = parent</text>
      <text x="130" y="18" text-anchor="middle" fill="#A33208" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="700">CSS1 §4.1.2 七段水平恒等式</text>
    </svg>`,
    "bfc-split": `<svg viewBox="0 0 260 140" width="260" height="140">
      <rect x="12" y="18" width="110" height="104" fill="#F0B63E" stroke="#141510" stroke-width="2"/>
      <text x="67" y="42" text-anchor="middle" fill="#141510" font-size="12" font-weight="800">Block-level</text>
      <rect x="24" y="54" width="86" height="18" fill="#141510"/>
      <rect x="24" y="78" width="86" height="18" fill="#C94510"/>
      <text x="67" y="112" text-anchor="middle" fill="#141510" font-size="10.5">纵向独立堆叠</text>
      <rect x="138" y="18" width="110" height="104" fill="#FFFBF2" stroke="#141510" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="193" y="42" text-anchor="middle" fill="#A33208" font-size="12" font-weight="800">Inline-level</text>
      <rect x="150" y="58" width="38" height="16" fill="#EBD5B4" stroke="#141510"/>
      <rect x="194" y="58" width="42" height="16" fill="#EBD5B4" stroke="#141510"/>
      <rect x="150" y="80" width="54" height="16" fill="#EBD5B4" stroke="#141510"/>
      <text x="193" y="112" text-anchor="middle" fill="#444038" font-size="10.5">顺文字流排开</text>
    </svg>`,
    "border-box": `<svg viewBox="0 0 260 140" width="260" height="140">
      <rect x="18" y="16" width="224" height="44" fill="#FDEAE5" stroke="#B82510" stroke-width="2" stroke-dasharray="4 3"/>
      <rect x="18" y="16" width="190" height="44" fill="#F0B63E" stroke="#141510" stroke-width="2"/>
      <text x="112" y="42" text-anchor="middle" fill="#141510" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="700">content-box: 100% + p/b 溢出</text>
      <rect x="18" y="76" width="224" height="46" fill="#155E4B" stroke="#141510" stroke-width="2"/>
      <rect x="34" y="86" width="192" height="26" fill="#F0B63E"/>
      <text x="130" y="103" text-anchor="middle" fill="#141510" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="700">border-box: 总宽严守 100%</text>
    </svg>`,
    "two-value": `<svg viewBox="0 0 260 140" width="260" height="140">
      <rect x="14" y="16" width="232" height="108" fill="#181815"/>
      <text x="26" y="40" fill="#F7CB63" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="700">display: &lt;outside&gt; &lt;inside&gt;</text>
      <rect x="26" y="54" width="96" height="54" fill="#C94510"/>
      <text x="74" y="76" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">外：block</text>
      <text x="74" y="94" text-anchor="middle" fill="#FFF4EC" font-size="10.5">对外独占一行</text>
      <rect x="134" y="54" width="100" height="54" fill="#F0B63E"/>
      <text x="184" y="76" text-anchor="middle" fill="#141510" font-size="11" font-weight="700">内：flow / grid</text>
      <text x="184" y="94" text-anchor="middle" fill="#141510" font-size="10.5">对内决定子布局</text>
    </svg>`,
  };

  function renderTl(idx) {
    activeTlIdx = idx;
    const item = TIMELINE[idx];
    $("tl-tag").textContent = item.tag;
    $("tl-date").textContent = item.date;
    $("tl-authors").textContent = item.authors;
    $("tl-headline").textContent = item.headline;
    $("tl-spec").textContent = item.spec;
    $("tl-body").textContent = item.body;
    $("tl-figure").innerHTML = FIGURES[item.diagram] || "";

    document.querySelectorAll(".tl-node").forEach((b) => {
      const on = Number(b.dataset.tl) === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  document.querySelectorAll(".tl-node").forEach((b) => {
    b.addEventListener("click", () => renderTl(Number(b.dataset.tl)));
  });
  renderTl(0);
}

// ==================== 05 节：场景分诊台 ====================
function setupSec05() {
  const list = $("triage-list");
  list.innerHTML = TRIAGE_CASES.map(
    (c) => `<button type="button" class="triage-btn" data-tid="${c.id}">${c.prompt}</button>`
  ).join("");

  function renderTriage(id) {
    activeTriageId = id;
    const item = TRIAGE_CASES.find((c) => c.id === id) || TRIAGE_CASES[0];
    const box = $("triage-result");
    box.className = `triage-result ${item.ok ? "is-ok" : "is-handoff"}`;
    box.innerHTML = `<strong>${item.verdict}</strong><p>${item.reason} 相关专页：<a href="https://layout.xiaoxiaodong.ai/${item.linkId}/play/">${item.linkLabel}</a>。</p>`;
    list.querySelectorAll(".triage-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.tid === id);
      b.setAttribute("aria-pressed", String(b.dataset.tid === id));
    });
  }

  list.querySelectorAll(".triage-btn").forEach((b) => {
    b.addEventListener("click", () => renderTriage(b.dataset.tid));
  });
  renderTriage(activeTriageId);
}

// ==================== 06 节：单变量动手小测 ====================
function setupSec06() {
  $("quiz-question").textContent = QUIZ.question;
  const grid = $("quiz-grid");

  const MINI_SVGS = {
    overflow: `<svg viewBox="0 0 220 42" width="100%" height="42">
      <rect x="6" y="4" width="176" height="34" fill="#F3E3CC" stroke="#141510" stroke-width="1.5"/>
      <rect x="6" y="10" width="204" height="22" fill="#F0B63E" stroke="#141510" stroke-width="1.5"/>
      <line x1="182" y1="2" x2="182" y2="40" stroke="#B82510" stroke-width="2" stroke-dasharray="3 2"/>
    </svg>`,
    ideal: `<svg viewBox="0 0 220 42" width="100%" height="42">
      <rect x="6" y="4" width="208" height="34" fill="#F3E3CC" stroke="#141510" stroke-width="1.5"/>
      <rect x="8" y="10" width="204" height="22" fill="#F0B63E" stroke="#141510" stroke-width="1.5"/>
    </svg>`,
    clip: `<svg viewBox="0 0 220 42" width="100%" height="42">
      <rect x="6" y="4" width="208" height="34" fill="#F3E3CC" stroke="#141510" stroke-width="1.5"/>
      <rect x="8" y="7" width="204" height="16" fill="#F0B63E" stroke="#141510" stroke-width="1.5"/>
      <rect x="8" y="21" width="204" height="15" fill="#141510"/>
    </svg>`,
    inline: `<svg viewBox="0 0 220 42" width="100%" height="42">
      <rect x="6" y="4" width="208" height="34" fill="#F3E3CC" stroke="#141510" stroke-width="1.5"/>
      <rect x="12" y="12" width="94" height="18" fill="#F0B63E" stroke="#141510" stroke-width="1.5" stroke-dasharray="3 2"/>
      <line x1="114" y1="21" x2="202" y2="21" stroke="#444038" stroke-width="2" stroke-dasharray="2 4"/>
    </svg>`,
  };

  // 答题前仅显示纯中性代码卡，绝不以图形提前剧透对错；答完后在下方揭晓真实盒尺对比图
  grid.innerHTML = QUIZ.options
    .map(
      (opt) => `<button type="button" class="quiz-opt" data-qkey="${opt.key}">
        <div class="qo-top">
          <span class="qo-letter" lang="en">${opt.key}</span>
          <span class="qo-meta">${opt.meta}</span>
        </div>
        <pre class="qo-code">${opt.code}</pre>
      </button>`
    )
    .join("");

  function renderQuiz() {
    const fb = $("quiz-feedback");
    const diag = $("qf-diagram");
    grid.querySelectorAll(".quiz-opt").forEach((b) => {
      const k = b.dataset.qkey;
      b.classList.remove("is-picked-ok", "is-picked-bad", "is-reveal-ok");
      if (pickedQuizKey) {
        if (k === pickedQuizKey && k === QUIZ.answer) b.classList.add("is-picked-ok");
        else if (k === pickedQuizKey) b.classList.add("is-picked-bad");
        else if (k === QUIZ.answer) b.classList.add("is-reveal-ok");
      }
    });

    if (!pickedQuizKey) {
      fb.hidden = true;
      diag.innerHTML = "";
      return;
    }
    const chosen = QUIZ.options.find((o) => o.key === pickedQuizKey);
    const ideal = QUIZ.options.find((o) => o.key === QUIZ.answer);
    const isOk = pickedQuizKey === QUIZ.answer;
    fb.hidden = false;
    fb.className = `quiz-feedback ${isOk ? "is-ok" : "is-bad"}`;
    $("qf-verdict").textContent = isOk
      ? `答对了 · 选 ${QUIZ.answer}`
      : `差一步 · 你选了 ${pickedQuizKey}，稳妥写法是 ${QUIZ.answer}`;
    $("qf-body").textContent = chosen.feedback;

    const cards = isOk
      ? [{ label: `方案 ${ideal.key} · 严丝合缝 600px（零溢出、自伸高）`, svg: MINI_SVGS[ideal.diagram] }]
      : [
          { label: `你选的方案 ${chosen.key} · 实际渲染结果`, svg: MINI_SVGS[chosen.diagram] },
          { label: `稳妥方案 ${ideal.key} · 严丝合缝 600px`, svg: MINI_SVGS[ideal.diagram] },
        ];
    diag.innerHTML = cards
      .map((c) => `<div class="qf-card"><strong>${c.label}</strong>${c.svg}</div>`)
      .join("");
  }

  grid.querySelectorAll(".quiz-opt").forEach((b) => {
    b.addEventListener("click", () => {
      pickedQuizKey = b.dataset.qkey;
      renderQuiz();
    });
  });

  $("btn-quiz-retry").addEventListener("click", () => {
    pickedQuizKey = null;
    renderQuiz();
  });

  renderQuiz();
}

// ==================== 07 节：原海报灯箱（放大 / 拖动 / Esc 关，海报只引用一次） ====================
function setupPosterLightbox() {
  const trigger = $("poster-trigger");
  const posterImg = $("poster");
  const lb = $("lightbox");
  const lbStage = $("lb-stage");
  const lbImg = $("lb-img");

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    $("lb-zoom-reset").textContent = `${Math.round(zoom * 100)}%`;
  }

  function openLb() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    $("lb-close").focus();
  }

  function closeLb() {
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", openLb);
  $("lb-close").addEventListener("click", closeLb);
  $("lb-zoom-in").addEventListener("click", () => { zoom = clamp(zoom + 0.35, 0.8, 3.5); applyTransform(); });
  $("lb-zoom-out").addEventListener("click", () => { zoom = clamp(zoom - 0.35, 0.8, 3.5); applyTransform(); });
  $("lb-zoom-reset").addEventListener("click", () => { zoom = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && zoom <= 1.01) { closeLb(); return; }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("is-dragging");
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    lbStage.classList.remove("is-dragging");
    try { lbStage.releasePointerCapture(e.pointerId); } catch {}
  };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = clamp(zoom + (e.deltaY < 0 ? 0.2 : -0.2), 0.8, 3.5);
    applyTransform();
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLb();
  });
}

// ==================== 初始化 ====================
const heroCanvasCtl = setupHeroCanvas();
renderHeroDOM();
heroCanvasCtl.draw();
setupStageInteractions(heroCanvasCtl);
bindHeroControls(heroCanvasCtl);
setupSec01();
setupSec02();
setupSec03();
setupSec04();
setupSec05();
setupSec06();
setupPosterLightbox();
