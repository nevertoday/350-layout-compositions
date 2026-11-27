// 182 轮廓绕排 · 主交互与单真源控制器
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PRESETS,
  SHAPES,
  createInitialState,
  computeLayout,
} from "./model.js";
import {
  drawHeroStage,
  drawShapeThumb,
  pickEnvelopeHandle,
  drawWipeCompare,
  REEF_CASES,
  drawReefCanvas,
  drawRhythmLab,
  QUIZ_QUESTIONS,
  drawQuizThumb,
} from "./canvas-views.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// 工具：按 DPR 同步画布像素尺寸（手机上限 1.5、桌面上限 2，兼顾锐利与慢机软渲染帧率）
function sizeCanvas(canvas, cachedRect = null) {
  const rect = cachedRect || canvas.getBoundingClientRect();
  const w = Math.max(160, Math.round(rect.width));
  const h = Math.max(120, Math.round(rect.height));
  const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W: w, H: h };
}

// =========================================================================
// 1. 开场核心：活体书页绕排排字台
// =========================================================================
const state = createInitialState();
const heroCanvas = $("#hero-canvas");
const marginRange = $("#margin-range");
const marginVal = $("#margin-val");
const btnCalibrate = $("#btn-calibrate");
const btnScan = $("#btn-scan");
const btnBridge = $("#btn-bridge");

const uiState = {
  intro: 0,
  scanT: -1,
  hoverTarget: "",
  dragging: "",
  dirty: true,
};

let lastLayout = null;
let lastBox = { W: 640, H: 468 };
let cachedHeroRect = null;
let lastReadoutKey = "";

function updateEditorialReadout(layout) {
  const { checks, metrics, diagnosis } = layout;
  const key = `${diagnosis.badge}|${diagnosis.headline}|${metrics.marginPx}|${metrics.edgeRange}|${metrics.wrappedLineCount}|${metrics.collisionLineCount}|${metrics.splitRowCount}|${metrics.leftSpanMax}|${metrics.minWrappedChars}|${state.wrapMode}|${state.cols}|${state.bridge}`;
  if (key === lastReadoutKey) return;
  lastReadoutKey = key;
  const isOk = metrics.passCount === 4;
  const isRef = state.wrapMode === "ring";

  // 顶部手机徽 & 诊单徽
  for (const pill of [$("#mobile-pill"), $("#diag-pill")]) {
    if (!pill) continue;
    pill.textContent = diagnosis.badge;
    pill.classList.toggle("is-ok", isOk);
    pill.classList.toggle("is-ref", isRef);
  }

  const note = $("#diag-note");
  note.classList.toggle("is-ok", isOk);
  note.classList.toggle("is-ref", isRef);
  $("#diag-grade").textContent = diagnosis.grade;
  $("#diag-headline").textContent = diagnosis.headline;
  $("#diag-why").textContent = diagnosis.why;
  $("#diag-fix").textContent = `下一步：${diagnosis.fix}`;

  // 标题左侧自示范微弧：随边距和是否成轮廓实时改变弯曲幅度
  const arcPath = $("#title-arc-path");
  if (arcPath) {
    const bend = state.wrapMode === "box" ? 22 : Math.max(4, 20 - metrics.marginPx * 0.35);
    arcPath.setAttribute("d", `M22,4 C${bend},22 ${bend},52 22,70`);
  }

  // 原海报 5 枚斜杠关键词实时亮灯
  const setKw = (id, pass) => {
    const el = $(id);
    if (!el) return;
    el.classList.toggle("is-ok", pass);
    el.classList.toggle("is-bad", !pass && !isRef);
  };
  setKw("#kw-hug", checks.hug);
  setKw("#kw-avoid", checks.avoid);
  setKw("#kw-contour", checks.hug && state.wrapMode === "contour");
  setKw("#kw-rhythm", checks.rhythm);
  setKw("#kw-focus", isOk);

  // 原海报 3 条向左橘红虚线箭头实时批注
  const cHug = $("#call-hug");
  cHug.classList.toggle("is-ok", checks.hug);
  $("#stat-hug").textContent = isRef
    ? "单行环边"
    : state.wrapMode === "box"
    ? "退化方框 183"
    : checks.hug
    ? `起伏 ${metrics.edgeRange}px · ${metrics.wrappedLineCount} 行`
    : metrics.marginPx > 28
    ? "过松抹平"
    : `仅绕 ${metrics.wrappedLineCount} 行`;

  const cAvoid = $("#call-avoid");
  cAvoid.classList.toggle("is-ok", checks.avoid);
  $("#stat-avoid").textContent = isRef
    ? "单行对照"
    : metrics.collisionLineCount > 0 || metrics.marginPx < 6
    ? `${metrics.marginPx}px · ${Math.max(1, metrics.collisionLineCount)} 行啃边`
    : metrics.marginPx > 28
    ? `${metrics.marginPx}px 过松`
    : `${metrics.marginPx}px (${metrics.marginEm}em)`;

  const cRhythm = $("#call-rhythm");
  const rhythmOk = checks.rhythm && checks.anchor;
  cRhythm.classList.toggle("is-ok", rhythmOk);
  $("#stat-rhythm").textContent = isRef
    ? "底部倒挂"
    : metrics.splitRowCount > 0
    ? `跨图劈栏 ${metrics.splitRowCount} 行`
    : !checks.anchor
    ? `左缘跳动 ${metrics.leftSpanMax}px`
    : metrics.orphanSlotCount > 0
    ? `最窄 ${metrics.minWrappedChars} 字`
    : `左锚稳 · 最窄 ${metrics.minWrappedChars} 字`;
}

function syncControlsUI() {
  marginRange.value = String(Math.round(state.marginPx));
  marginVal.textContent = `${Math.round(state.marginPx)}px`;
  $$("[data-wrap]").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.wrap === state.wrapMode)
  );
  $$("[data-cols]").forEach((b) =>
    b.classList.toggle("is-active", Number(b.dataset.cols) === state.cols)
  );
  btnBridge.setAttribute("aria-pressed", String(state.bridge));
  btnBridge.textContent = `凹口桥接：${state.bridge ? "开" : "关"}`;
  $$("[data-shape]").forEach((b) => {
    const active = b.dataset.shape === state.shape;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}

function markDirty(immediate = false) {
  uiState.dirty = true;
  if (immediate || reducedMotion.matches) heroLoop.draw();
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  if (!cachedHeroRect) cachedHeroRect = heroCanvas.getBoundingClientRect();
  const { ctx, W, H } = sizeCanvas(heroCanvas, cachedHeroRect);
  const resized = W !== lastBox.W || H !== lastBox.H;
  lastBox = { W, H };

  let needsDraw = uiState.dirty || resized;

  if (still) {
    if (uiState.intro < 1) {
      uiState.intro = 1;
      needsDraw = true;
    }
    if (uiState.scanT >= 0) {
      uiState.scanT = 0.65;
      needsDraw = true;
    }
  } else {
    if (uiState.intro < 1) {
      uiState.intro = Math.min(1, uiState.intro + Math.max(dt, 0.016) * 1.45);
      needsDraw = true;
    }
    if (uiState.scanT >= 0) {
      uiState.scanT += Math.max(dt, 0.016) * 0.28;
      if (uiState.scanT >= 1.04) uiState.scanT = -1;
      needsDraw = true;
    }
  }

  if (!needsDraw && lastLayout) return;

  lastLayout = computeLayout(state, { W, H });
  drawHeroStage(ctx, lastLayout, state, uiState);
  updateEditorialReadout(lastLayout);
  uiState.dirty = false;
});

// 画布指针与触控交互（支持直拖主体、直拖橘红缓冲环珠、以及空白处左右横拖推拉主体）
let dragInfo = null;

function canvasPoint(e) {
  const rect = heroCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function hitTestHero(pt) {
  if (!lastLayout) return "stage";
  if (state.wrapMode !== "ring") {
    const h = pickEnvelopeHandle(lastLayout, lastBox.W);
    if (h && Math.hypot(pt.x - h.x, pt.y - h.y) <= 20) return "ring";
  }
  const dx = (pt.x - lastLayout.cxPx) / (lastLayout.rx || 1);
  const dy = (pt.y - lastLayout.cyPx) / (lastLayout.ry || 1);
  if (dx * dx + dy * dy <= 1.05) return "shape";
  return "stage";
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function beginDrag(pt, pointerId = null) {
  const kind = hitTestHero(pt);
  uiState.dragging = kind === "ring" ? "ring" : "shape";
  dragInfo = {
    kind,
    pointerId,
    startX: pt.x,
    startY: pt.y,
    origCx: state.cx,
    origCy: state.cy,
    origMargin: state.marginPx,
    dir: lastLayout ? (lastLayout.cxPx >= lastBox.W * 0.45 ? -1 : 1) : -1,
  };
  markDirty();
}

function moveDrag(pt) {
  if (!dragInfo || !lastLayout) return;
  const dx = pt.x - dragInfo.startX;
  const dy = pt.y - dragInfo.startY;
  if (dragInfo.kind === "ring") {
    const delta = dx * dragInfo.dir;
    const nextMargin = clamp(Math.round(dragInfo.origMargin + delta * 0.85), 0, 44);
    if (nextMargin !== state.marginPx) {
      state.marginPx = nextMargin;
      marginRange.value = String(nextMargin);
      marginVal.textContent = `${nextMargin}px`;
    }
  } else if (dragInfo.kind === "shape") {
    state.cx = clamp(dragInfo.origCx + dx / lastLayout.box.innerW, 0.12, 0.88);
    state.cy = clamp(dragInfo.origCy + dy / lastLayout.box.innerH, 0.34, 0.66);
    if (state.cols === 2 && Math.abs(state.cx - 0.50) < 0.025) state.cx = 0.50;
  } else {
    state.cx = clamp(dragInfo.origCx + (dx / lastLayout.box.innerW) * 1.15, 0.12, 0.88);
    if (state.cols === 2 && Math.abs(state.cx - 0.50) < 0.025) state.cx = 0.50;
  }
  markDirty();
}

function endDrag() {
  dragInfo = null;
  uiState.dragging = "";
  markDirty();
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  if (e.pointerType === "touch") return; // 触控走下方原生 touch 监听器，避免双倍重绘
  const pt = canvasPoint(e);
  beginDrag(pt, e.pointerId);
  if (heroCanvas.setPointerCapture) {
    try {
      heroCanvas.setPointerCapture(e.pointerId);
    } catch {}
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  const pt = canvasPoint(e);
  if (dragInfo) {
    moveDrag(pt);
  } else {
    const hit = hitTestHero(pt);
    const nextHover = hit === "stage" ? "" : hit;
    if (nextHover !== uiState.hoverTarget) {
      uiState.hoverTarget = nextHover;
      heroCanvas.style.cursor = nextHover === "ring" ? "ew-resize" : "grab";
      markDirty();
    }
  }
});

heroCanvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  endDrag();
});
heroCanvas.addEventListener("pointercancel", (e) => {
  if (e.pointerType === "touch") return;
  endDrag();
});

// 兼容原生 touch 事件（单一路径驱动，兼顾真实手机与 perf.mjs 的 dispatchTouchEvent）
heroCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length) return;
    beginDrag(canvasPoint(e));
  },
  { passive: true }
);
heroCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!e.touches.length || !dragInfo) return;
    moveDrag(canvasPoint(e));
  },
  { passive: true }
);
heroCanvas.addEventListener("touchend", endDrag, { passive: true });

// 键盘操作：方向键挪主体、+/- 调边距、Space 放飞视线
heroCanvas.addEventListener("keydown", (e) => {
  let handled = true;
  if (e.key === "ArrowLeft") state.cx = clamp(state.cx - 0.03, 0.12, 0.88);
  else if (e.key === "ArrowRight") state.cx = clamp(state.cx + 0.03, 0.12, 0.88);
  else if (e.key === "ArrowUp") state.cy = clamp(state.cy - 0.03, 0.34, 0.66);
  else if (e.key === "ArrowDown") state.cy = clamp(state.cy + 0.03, 0.34, 0.66);
  else if (e.key === "[" || e.key === "-") state.marginPx = clamp(state.marginPx - 2, 0, 44);
  else if (e.key === "]" || e.key === "=" || e.key === "+")
    state.marginPx = clamp(state.marginPx + 2, 0, 44);
  else if (e.code === "Space") {
    uiState.scanT = reducedMotion.matches ? 0.65 : 0;
  } else {
    handled = false;
  }
  if (handled) {
    e.preventDefault();
    syncControlsUI();
    markDirty(true);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName || "")) {
    if (!$("#lightbox").hidden) return;
    e.preventDefault();
    uiState.scanT = reducedMotion.matches ? 0.65 : 0;
    markDirty(true);
  }
});

// 排印尺与预设绑定
marginRange.addEventListener("input", () => {
  state.marginPx = Number(marginRange.value);
  syncControlsUI();
  markDirty(true);
});

btnCalibrate.addEventListener("click", () => {
  Object.assign(state, PRESETS.classicRight);
  syncControlsUI();
  markDirty(true);
});

btnScan.addEventListener("click", () => {
  if (state.wrapMode === "ring") state.wrapMode = "contour";
  uiState.scanT = reducedMotion.matches ? 0.65 : 0;
  syncControlsUI();
  markDirty(true);
});

$$("[data-wrap]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.wrapMode = btn.dataset.wrap;
    syncControlsUI();
    markDirty(true);
  })
);

$$("[data-cols]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.cols = Number(btn.dataset.cols);
    if (state.cols === 2) state.cx = 0.50;
    syncControlsUI();
    markDirty(true);
  })
);

btnBridge.addEventListener("click", () => {
  state.bridge = !state.bridge;
  syncControlsUI();
  markDirty(true);
});

$$("[data-shape]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.shape = btn.dataset.shape;
    syncControlsUI();
    markDirty(true);
  })
);

$$("[data-preset]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    Object.assign(state, p);
    syncControlsUI();
    markDirty(true);
  })
);

// 绘制「应用示例」三枚小剪影按钮图标
function renderSpecimenThumbs() {
  $$("[data-thumb]").forEach((c) => {
    const dpr = pixelRatio(2);
    const w = 44, h = 50;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawShapeThumb(ctx, c.dataset.thumb, w, h);
  });
}

// =========================================================================
// 2. 第 01 节：双面卷帘刮开对比台
// =========================================================================
const wipeCanvas = $("#wipe-canvas");
const wipeRange = $("#wipe-range");
const wipeReadout = $("#wipe-readout");
let wipeShape = "vase";
let wipeSplit = 0.48;

function paintWipe() {
  const { ctx, W, H } = sizeCanvas(wipeCanvas);
  const info = drawWipeCompare(ctx, W, H, wipeSplit, wipeShape);
  const diff = Math.max(0, info.contourChars - info.boxChars);
  wipeReadout.textContent = `${SHAPES[wipeShape].sub}：矩形盒吃掉约 ${info.deadCornerPct}% 边角面积；换轮廓绕排后右侧随曲线起伏 ${info.edgeRange}px，同页多容纳 ${diff} 字。`;
}

wipeRange.addEventListener("input", () => {
  wipeSplit = Number(wipeRange.value) / 100;
  paintWipe();
});

$$("[data-wipe-shape]").forEach((btn) =>
  btn.addEventListener("click", () => {
    wipeShape = btn.dataset.wipeShape;
    $$("[data-wipe-shape]").forEach((b) => b.classList.toggle("is-active", b === btn));
    paintWipe();
  })
);

let wiping = false;
function updateWipeFromPointer(e) {
  const rect = wipeCanvas.getBoundingClientRect();
  wipeSplit = clamp((e.clientX - rect.left) / rect.width, 0.1, 0.9);
  wipeRange.value = String(Math.round(wipeSplit * 100));
  paintWipe();
}
wipeCanvas.addEventListener("pointerdown", (e) => {
  wiping = true;
  updateWipeFromPointer(e);
  if (wipeCanvas.setPointerCapture) {
    try { wipeCanvas.setPointerCapture(e.pointerId); } catch {}
  }
});
wipeCanvas.addEventListener("pointermove", (e) => {
  if (wiping) updateWipeFromPointer(e);
});
wipeCanvas.addEventListener("pointerup", () => (wiping = false));
wipeCanvas.addEventListener("pointercancel", () => (wiping = false));

// =========================================================================
// 3. 第 02 节：四暗礁标本解剖台
// =========================================================================
const reefCanvas = $("#reef-canvas");
const reefTitle = $("#reef-title");
const reefRule = $("#reef-rule");
const btnReefFix = $("#btn-reef-fix");
let activeReef = "tight";
let reefFixed = false;

function paintReef() {
  const { ctx, W, H } = sizeCanvas(reefCanvas);
  drawReefCanvas(ctx, W, H, activeReef, reefFixed);
  const spec = REEF_CASES[activeReef];
  reefTitle.textContent = spec.title;
  reefRule.textContent = spec.rule;
  btnReefFix.setAttribute("aria-pressed", String(reefFixed));
  btnReefFix.textContent = reefFixed ? "已修补 ✓ · 点此回看原错态" : "修补一刀：看正确改法";
}

$$(".reef-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    activeReef = tab.dataset.reef;
    reefFixed = false;
    $$(".reef-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    paintReef();
  })
);

btnReefFix.addEventListener("click", () => {
  reefFixed = !reefFixed;
  paintReef();
});

// =========================================================================
// 4. 第 03 节（深窑暗室）：三形态阅读节奏波形仪
// =========================================================================
const rhythmCanvas = $("#rhythm-canvas");
const btnRhythmEnv = $("#btn-rhythm-env");
const btnRhythmPlay = $("#btn-rhythm-play");
const rhythmState = {
  shape: "vase",
  smooth: true,
  playing: false,
  head: -1,
  dirty: true,
};

const RHYTHM_NOTES = {
  vase: {
    true: "长颈陶瓶由细颈平滑过渡到宽腹，行长逐行柔和递减再回放，既看得出器物曲线，又不会吓停视线。",
    false: "不加桥接的陶瓶颈肩过渡更陡，节奏反差增强，但仍需留意颈弯附近行宽变化是否过急。",
  },
  leaf: {
    true: "开启平滑外包络后，龟背叶的深裂口被柔和封住，行长呈丰润圆弧起伏，既留叶韵又不吞孤字。",
    false: "关闭桥接后，扫描线直接钻进叶片深裂口，波形谱立刻出现尖刺与断层，阅读节拍频频卡顿。",
  },
  blob: {
    true: "三瓣抽象流形的起伏大开大合，平滑外包络让三段弧面形成清晰的呼吸波峰，极适合杂志导语。",
    false: "原始内湾较深处会使相邻行宽跳变加大，用平滑包络微托凹湾可让视线滑行更顺。",
  },
};

const rhythmLoop = loop(rhythmCanvas, (t, dt, { still }) => {
  if (rhythmState.playing && !still) {
    rhythmState.head += Math.max(dt, 0.016) * 0.24;
    if (rhythmState.head >= 1) {
      rhythmState.playing = false;
      rhythmState.head = -1;
      btnRhythmPlay.textContent = "播放节拍扫读";
    }
    rhythmState.dirty = true;
  }
  if (!rhythmState.dirty) return;
  const { ctx, W, H } = sizeCanvas(rhythmCanvas);
  const info = drawRhythmLab(ctx, W, H, rhythmState.shape, rhythmState.smooth, rhythmState.head);
  $("#rm-range").textContent = `${info.edgeRange}px`;
  $("#rm-jump").textContent = `${info.maxJumpPct}%`;
  $("#rm-min").textContent = `${info.minChars} 字`;
  $("#rm-text").textContent = RHYTHM_NOTES[rhythmState.shape][String(rhythmState.smooth)];
  rhythmState.dirty = false;
});

$$("[data-rhythm-shape]").forEach((btn) =>
  btn.addEventListener("click", () => {
    rhythmState.shape = btn.dataset.rhythmShape;
    rhythmState.dirty = true;
    $$("[data-rhythm-shape]").forEach((b) => b.classList.toggle("is-active", b === btn));
    rhythmLoop.draw();
  })
);

btnRhythmEnv.addEventListener("click", () => {
  rhythmState.smooth = !rhythmState.smooth;
  btnRhythmEnv.setAttribute("aria-pressed", String(rhythmState.smooth));
  btnRhythmEnv.textContent = rhythmState.smooth ? "外包络：平滑桥接" : "外包络：原始紧贴";
  rhythmState.dirty = true;
  rhythmLoop.draw();
});

btnRhythmPlay.addEventListener("click", () => {
  if (reducedMotion.matches) {
    rhythmState.head = rhythmState.head < 0 ? 0.45 : -1;
    rhythmState.dirty = true;
    rhythmLoop.draw();
    return;
  }
  rhythmState.playing = !rhythmState.playing;
  rhythmState.head = rhythmState.playing ? 0 : -1;
  btnRhythmPlay.textContent = rhythmState.playing ? "暂停扫读" : "播放节拍扫读";
  rhythmState.dirty = true;
  rhythmLoop.draw();
});

// =========================================================================
// 5. 第 04 节：四代工艺手风琴 & 第 05 节：避坑翻牌
// =========================================================================
$$(".hist-trigger").forEach((btn) =>
  btn.addEventListener("click", () => {
    const item = btn.closest(".hist-item");
    const willOpen = !item.classList.contains("is-open");
    $$(".hist-item").forEach((el) => {
      const open = el === item && willOpen;
      el.classList.toggle("is-open", open);
      const t = $(".hist-trigger", el);
      t.setAttribute("aria-expanded", String(open));
      $(".hist-toggle", t).textContent = open ? "收起" : "展开";
    });
  })
);

$$(".flip-card").forEach((card) =>
  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const next = card.getAttribute("aria-pressed") !== "true";
    card.setAttribute("aria-pressed", String(next));
  })
);

// =========================================================================
// 6. 第 06 节：单变量眼力盲测考场
// =========================================================================
let quizIndex = 0;
const quizAnswers = {};

function renderQuiz() {
  const q = QUIZ_QUESTIONS[quizIndex];
  const picked = quizAnswers[q.id] || null;
  const revealed = !!picked;

  $("#quiz-var").textContent = q.variable;
  $("#quiz-prompt").textContent = q.prompt;

  for (const opt of q.options) {
    const card = $(`.quiz-card[data-opt="${opt.key}"]`);
    const canvas = $(`.qc-canvas[data-qcanvas="${opt.key}"]`);
    const isCorrect = opt.key === q.correct;
    const isPicked = opt.key === picked;

    card.classList.toggle("is-right", revealed && isCorrect);
    card.classList.toggle("is-wrong", revealed && isPicked && !isCorrect);

    const { ctx, W, H } = sizeCanvas(canvas);
    drawQuizThumb(ctx, W, H, opt.state, revealed, isCorrect, isPicked);
  }

  const fb = $("#quiz-feedback");
  if (!revealed) {
    fb.innerHTML = `<p class="qf-idle">直接点击 A / B / C / D 选一选最舒适耐读的一版，现场亮出实测红线与理由。</p>`;
  } else {
    const ok = picked === q.correct;
    const items = q.options
      .map((o) => `<li><strong>${o.key} 版：</strong>${o.reason}</li>`)
      .join("");
    fb.innerHTML = `
      <p class="qf-verdict ${ok ? "is-ok" : "is-bad"}">${
      ok
        ? `判断准确！${q.correct} 版正是这一组唯一平衡可读性与轮廓韵律的解。`
        : `你选了 ${picked} 版，但最稳妥耐读的是 ${q.correct} 版——对比上方四版实测红线看看差别：`
    }</p>
      <ul class="qf-list">${items}</ul>
    `;
  }
}

$$("[data-quiz]").forEach((btn) =>
  btn.addEventListener("click", () => {
    quizIndex = Number(btn.dataset.quiz);
    $$("[data-quiz]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderQuiz();
  })
);

$$(".quiz-card").forEach((card) =>
  card.addEventListener("click", () => {
    const q = QUIZ_QUESTIONS[quizIndex];
    quizAnswers[q.id] = card.dataset.opt;
    renderQuiz();
  })
);

// =========================================================================
// 7. 第 07 节：原海报全屏可缩放可拖动灯箱
// =========================================================================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbViewport = $("#lb-viewport");
const lbZoom = $("#lb-zoom");
let lbScale = 1, lbX = 0, lbY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoom.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lb.hidden = true;
}

$("#poster-open").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.25, 0.5, 4);
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.25, 0.5, 4);
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.18 : -0.18), 0.5, 4);
    applyLbTransform();
  },
  { passive: false }
);

let lbDrag = null;
lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport) {
    closeLightbox();
    return;
  }
  lbDrag = { sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  if (lbViewport.setPointerCapture) {
    try { lbViewport.setPointerCapture(e.pointerId); } catch {}
  }
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => (lbDrag = null));
lbViewport.addEventListener("pointercancel", () => (lbDrag = null));

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// =========================================================================
// 8. 初始化与自适应重绘
// =========================================================================
function redrawAllStatic() {
  cachedHeroRect = heroCanvas.getBoundingClientRect();
  renderSpecimenThumbs();
  paintWipe();
  paintReef();
  rhythmState.dirty = true;
  rhythmLoop.draw();
  renderQuiz();
  markDirty(true);
}

syncControlsUI();
redrawAllStatic();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(redrawAllStatic, 100);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(redrawAllStatic);
}
