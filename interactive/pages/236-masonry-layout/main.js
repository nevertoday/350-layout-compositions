// 236 · 瀑布流布局 交互主控模块
import { loop } from "../../lib/stage.js";
import {
  BASE_CARDS,
  EXTRA_CARDS,
  HEIGHT_TIERS,
  SCENARIOS,
  QUIZ_OPTIONS,
  THEME_STYLES,
  PALETTE,
  createInitialState,
  createPosterSolution,
  createGridLanesSolution,
  computeLayout,
  countRelocations,
  evaluate,
  simulateStepPacking,
  computeImplTrack,
} from "./model.js";
import {
  createHeroWallRenderer,
  createStepPackRenderer,
  createScanCompareRenderer,
} from "./render.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// =========================================================================
// 一、开场活体包豪斯九卡砌墙台
// =========================================================================
const state = createInitialState();
const heroCanvas = $("#hero-canvas");
const heroRenderer = createHeroWallRenderer(heroCanvas);

let latestEval = null;

function getStageWidth() {
  return heroRenderer.getWallWidth();
}

function syncHeroUI() {
  const res = evaluate(state, getStageWidth());
  latestEval = res;
  const { layout, checks, score, diag, triad, liveCss } = res;

  // 1. 顶眉状态章
  const pill = $("#top-status-pill");
  if (score === 4) {
    pill.textContent = "4 / 4 已砌稳";
    pill.dataset.state = "ok";
  } else if (diag.severity === "warn") {
    pill.textContent = `${score} / 4 单列退化`;
    pill.dataset.state = "warn";
  } else {
    pill.textContent = `${score} / 4 待砌墙`;
    pill.dataset.state = "err";
  }

  // 2. 示范大标字脚随模式真实高低错落
  const heroTitle = $("#hero-title");
  if (state.rhythmMode === "uniform" || state.algorithm === "row-grid") {
    heroTitle.dataset.stagger = "flat";
  } else if (state.rhythmMode === "extreme") {
    heroTitle.dataset.stagger = "wild";
  } else {
    heroTitle.dataset.stagger = "masonry";
  }

  // 3. 右上包豪斯组合几何徽章里的琥珀黄竖块随当前列底状态轻微呼应
  const emblemBar = $("#emblem-bar");
  if (emblemBar) {
    const barH = state.rhythmMode === "uniform" ? 56 : state.rhythmMode === "extreme" ? 96 : 78;
    emblemBar.setAttribute("y", String(146 - barH));
    emblemBar.setAttribute("height", String(barH));
  }

  // 4. 原海报三彩圆实况指标
  $("#triad-stagger").dataset.ok = triad.stagger.ok ? "1" : "0";
  $("#badge-stagger").textContent = triad.stagger.badge;
  $("#triad-flow").dataset.ok = triad.flow.ok ? "1" : "0";
  $("#badge-flow").textContent = triad.flow.badge;
  $("#triad-gap").dataset.ok = triad.gap.ok ? "1" : "0";
  $("#badge-gap").textContent = triad.gap.badge;

  // 5. 单真源白话诊单
  const panel = $("#diag-panel");
  panel.dataset.severity = diag.severity;
  $("#diag-tag").textContent = diag.tag;
  $("#diag-title").textContent = diag.title;
  $("#diag-why").textContent = diag.why;
  $("#diag-action").textContent = diag.action;

  $("#m-void").textContent = `${layout.voidPct}%`;
  $("#m-span").textContent = `${layout.heightSpanRatio}×`;
  $("#m-tail").textContent = `${layout.tailSpreadPct}%`;
  $("#m-colw").textContent = `${layout.minColW}px`;

  // 6. 四维方点状态与按钮高亮
  $("#sq-flow").dataset.ok = checks.flow ? "1" : "0";
  $("#sq-cols").dataset.ok = checks.cols ? "1" : "0";
  $("#sq-gutter").dataset.ok = checks.gutter ? "1" : "0";
  $("#sq-rhythm").dataset.ok = checks.rhythm ? "1" : "0";

  $$(".seg-btn").forEach((btn) => {
    const p = btn.dataset.param;
    const v = btn.dataset.val;
    const active = String(state[p]) === v;
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    const isBad =
      (p === "algorithm" && (v === "row-grid" || v === "columns")) ||
      (p === "colWidthMode" && v === "uneven") ||
      (p === "rhythmMode" && (v === "extreme" || v === "uniform"));
    btn.dataset.bad = isBad ? "1" : "0";
  });

  $("#gutter-slider").value = String(state.gutter);
  $("#gutter-readout").textContent = `${state.gutter}px`;

  $$("[data-collock]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(state.colLock) === btn.dataset.collock ? "true" : "false");
  });

  const totalCards = BASE_CARDS.length + state.extraCount;
  const addBtn = $("#btn-add-cards");
  addBtn.textContent = state.extraCount >= EXTRA_CARDS.length ? `重置 9 卡 (${totalCards})` : `＋追加新卡 (${totalCards})`;

  const orderBtn = $("#btn-toggle-order");
  orderBtn.setAttribute("aria-pressed", state.showOrder ? "true" : "false");
  orderBtn.textContent = state.showOrder ? "读序线：开" : "读序线：关";

  $("#live-css code").textContent = liveCss;
}

const heroLoop = loop(heroCanvas, (_t, dt, opts) => {
  if (!latestEval) syncHeroUI();
  heroRenderer.draw(state, latestEval, dt, opts);
});

function updateHero(mutator) {
  mutator();
  syncHeroUI();
  heroRenderer.markDirty();
  heroLoop.draw();
}

// 绑定四维参数按钮与滑杆
$$(".seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.dataset.param;
    const v = btn.dataset.val;
    updateHero(() => {
      state[p] = v;
      state.lastRelocated = 0;
      if (p === "rhythmMode") state.heightOverrides = {};
    });
  });
});

$("#gutter-slider").addEventListener("input", (e) => {
  updateHero(() => {
    state.gutter = Number(e.target.value);
  });
});

$$("[data-collock]").forEach((btn) => {
  btn.addEventListener("click", () => {
    updateHero(() => {
      state.colLock = btn.dataset.collock === "auto" ? "auto" : Number(btn.dataset.collock);
    });
  });
});

$("#btn-add-cards").addEventListener("click", () => {
  updateHero(() => {
    const w = getStageWidth();
    const prev = computeLayout(state, w);
    if (state.extraCount >= EXTRA_CARDS.length) {
      state.extraCount = 0;
      state.lastRelocated = 0;
      state.lastAddedIds = [];
    } else {
      const nextCard = EXTRA_CARDS[state.extraCount];
      state.extraCount += 1;
      state.lastAddedIds = [nextCard.id];
      const next = computeLayout(state, w);
      state.lastRelocated = countRelocations(prev, next);
    }
  });
});

$("#btn-toggle-order").addEventListener("click", () => {
  updateHero(() => {
    state.showOrder = !state.showOrder;
  });
});

$("#btn-reset-err").addEventListener("click", () => {
  updateHero(() => {
    Object.assign(state, createInitialState());
  });
});

$("#btn-solve-poster").addEventListener("click", () => {
  updateHero(() => {
    Object.assign(state, createPosterSolution({ extraCount: state.extraCount, showOrder: state.showOrder }));
  });
});

$("#btn-solve-lanes").addEventListener("click", () => {
  updateHero(() => {
    Object.assign(state, createGridLanesSolution({ extraCount: state.extraCount, showOrder: state.showOrder }));
  });
});

// 画布交互：横向拖动实时改容器墙宽（支持鼠标与触屏，touch-action: pan-y 不抢竖向滚动）+ 点击卡片切高度
let dragCtx = null;

function cycleCardHeight(cardId) {
  updateHero(() => {
    const curLayout = computeLayout(state, getStageWidth());
    const card = curLayout.placed.find((p) => p.id === cardId);
    if (!card) return;
    state.selectedCardId = cardId;
    // 在 矮 -> 中 -> 高 -> 超长 之间循环
    let nextIdx = 0;
    for (let i = 0; i < HEIGHT_TIERS.length; i++) {
      if (card.factor < HEIGHT_TIERS[i].factor - 0.08) {
        nextIdx = i;
        break;
      }
      nextIdx = (i + 1) % HEIGHT_TIERS.length;
    }
    state.heightOverrides = { ...state.heightOverrides, [cardId]: HEIGHT_TIERS[nextIdx].factor };
    if (state.rhythmMode === "uniform" || state.rhythmMode === "extreme") {
      // 保留其它卡片当前高度快照，让用户手调单卡真能救回或玩坏节奏
      const snap = {};
      curLayout.placed.forEach((p) => { snap[p.id] = p.factor; });
      snap[cardId] = HEIGHT_TIERS[nextIdx].factor;
      state.heightOverrides = snap;
      state.rhythmMode = "natural";
    }
  });
}

function startWallDrag(clientX, clientY, pointerId = null) {
  dragCtx = {
    startX: clientX,
    startY: clientY,
    startRatio: state.wallRatio,
    moved: false,
    lockedAxis: null,
    pointerId,
  };
}

let lastDragUiSync = 0;

function moveWallDrag(clientX, clientY) {
  if (!dragCtx) return false;
  const dx = clientX - dragCtx.startX;
  const dy = clientY - dragCtx.startY;
  if (!dragCtx.lockedAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    dragCtx.lockedAxis = Math.abs(dx) >= Math.abs(dy) * 0.85 ? "x" : "y";
  }
  if (dragCtx.lockedAxis === "x") {
    dragCtx.moved = true;
    const span = Math.max(180, heroRenderer.getWallWidth() * 0.72);
    const nextRatio = Math.max(0.36, Math.min(1.0, dragCtx.startRatio + dx / span));
    if (Math.abs(nextRatio - state.wallRatio) > 0.002) {
      state.wallRatio = nextRatio;
      // 拖动中只重算最新布局并标脏，由 rAF 每帧画一次，DOM 文案按 80ms 节流避免回流
      latestEval = evaluate(state, getStageWidth());
      heroRenderer.markDirty();
      const now = performance.now();
      if (now - lastDragUiSync > 80) {
        lastDragUiSync = now;
        syncHeroUI();
      }
    } else {
      heroRenderer.markDirty();
    }
    return true;
  }
  return false;
}

function endWallDrag(clientX, clientY) {
  if (!dragCtx) return;
  const wasMoved = dragCtx.moved;
  const wasTap = !wasMoved && Math.hypot(clientX - dragCtx.startX, clientY - dragCtx.startY) < 9;
  dragCtx = null;
  if (wasMoved) {
    syncHeroUI();
    heroRenderer.markDirty();
  } else if (wasTap) {
    const rect = heroCanvas.getBoundingClientRect();
    const hitId = heroRenderer.hitTestCard(clientX - rect.left, clientY - rect.top);
    if (hitId != null) cycleCardHeight(hitId);
  }
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // 触屏交由下方 touch 事件，确保与 perf 的 touch 分发完全同轨
  heroCanvas.setPointerCapture(e.pointerId);
  startWallDrag(e.clientX, e.clientY, e.pointerId);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  if (dragCtx) {
    moveWallDrag(e.clientX, e.clientY);
  } else {
    const rect = heroCanvas.getBoundingClientRect();
    const hit = heroRenderer.hitTestCard(e.clientX - rect.left, e.clientY - rect.top);
    heroRenderer.setHover(hit);
    heroCanvas.style.cursor = hit != null ? "pointer" : "ew-resize";
  }
});

heroCanvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  if (dragCtx && e.pointerId === dragCtx.pointerId) {
    endWallDrag(e.clientX, e.clientY);
  }
});

heroCanvas.addEventListener("pointerleave", () => {
  heroRenderer.setHover(null);
});

// 原生 Touch 监听（不阻止竖向滚屏，横向拖动流畅驱动重绘，兼容 perf.mjs）
heroCanvas.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  const t = e.touches[0];
  startWallDrag(t.clientX, t.clientY);
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!e.touches.length || !dragCtx) return;
  const t = e.touches[0];
  const handled = moveWallDrag(t.clientX, t.clientY);
  if (handled) e.preventDefault();
}, { passive: false });

heroCanvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  if (t) endWallDrag(t.clientX, t.clientY);
  else dragCtx = null;
}, { passive: true });

// 键盘操作画布：←/→ 调墙宽，Enter/Space 调选中卡高度
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    updateHero(() => {
      state.wallRatio = Math.max(0.36, Math.min(1.0, state.wallRatio + dir * 0.06));
    });
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    cycleCardHeight(state.selectedCardId || 2);
  }
});

window.addEventListener("resize", () => {
  heroRenderer.syncBoxSize();
  syncHeroUI();
  heroLoop.draw();
});

// =========================================================================
// 二、第 01 节：单步放砖补位模拟器
// =========================================================================
const stepCanvas = $("#step-canvas");
const stepRenderer = createStepPackRenderer(stepCanvas);
const stepState = { count: 4, tolerance: 0, playing: false, timer: 0 };

function syncStepUI() {
  const sim = simulateStepPacking(stepState.count, stepState.tolerance);
  const tag = $("#step-tag");
  const explain = $("#step-explain");
  if (!sim.last) {
    tag.textContent = "第 0 / 10 块 · 空墙就绪";
    explain.textContent = "三列高度均为 0px，点击「放入下一块」观察第 1 块如何从最左侧起步。";
  } else {
    const p = sim.last;
    tag.textContent = `第 ${stepState.count} / 10 块 · 落入列 ${p.col + 1}`;
    if (p.toleranceSaved) {
      explain.textContent = `列 ${p.strictCol + 1}（${p.before[p.strictCol]}px）只比列 ${p.col + 1}（${p.before[p.col]}px）浅了 ${p.before[p.col] - p.before[p.strictCol]}px，落在 ${stepState.tolerance}px 容差带内；算法优先让 #${p.id} ${p.title} 落入更靠左的列 ${p.col + 1}，稳住横向阅读顺序。`;
    } else {
      explain.textContent = `放砖前各列底边为 [${p.before.join(" / ")}]px，列 ${p.col + 1} 最浅（${p.before[p.col]}px），#${p.id} ${p.title}（高 ${p.h}px）自动补入列 ${p.col + 1}，新底边变为 ${p.after[p.col]}px。`;
    }
  }
  $$(".tol-btn").forEach((b) => {
    b.setAttribute("aria-pressed", Number(b.dataset.tol) === stepState.tolerance ? "true" : "false");
  });
  $("#step-play").textContent = stepState.playing ? "暂停演示" : "自动演示";
  $("#step-play").setAttribute("aria-pressed", stepState.playing ? "true" : "false");
  return sim;
}

let currentStepSim = syncStepUI();
const stepLoop = loop(stepCanvas, (_t, dt, opts) => {
  if (stepState.playing && !opts.still) {
    stepState.timer += dt;
    if (stepState.timer >= 0.95) {
      stepState.timer = 0;
      stepState.count = stepState.count >= 10 ? 1 : stepState.count + 1;
      currentStepSim = syncStepUI();
    }
  }
  stepRenderer.draw(currentStepSim, stepState.tolerance, dt, opts);
});

$("#step-prev").addEventListener("click", () => {
  stepState.playing = false;
  stepState.count = Math.max(0, stepState.count - 1);
  currentStepSim = syncStepUI();
  stepLoop.draw();
});

$("#step-next").addEventListener("click", () => {
  stepState.playing = false;
  stepState.count = Math.min(10, stepState.count + 1);
  currentStepSim = syncStepUI();
  stepLoop.draw();
});

$("#step-reset").addEventListener("click", () => {
  stepState.playing = false;
  stepState.count = 0;
  currentStepSim = syncStepUI();
  stepLoop.draw();
});

$("#step-play").addEventListener("click", () => {
  stepState.playing = !stepState.playing;
  stepState.timer = 0;
  if (stepState.playing && stepState.count >= 10) stepState.count = 0;
  currentStepSim = syncStepUI();
  stepLoop.draw();
});

$$(".tol-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    stepState.tolerance = Number(btn.dataset.tol);
    currentStepSim = syncStepUI();
    stepLoop.draw();
  });
});

// =========================================================================
// 三、第 02 节：三条实现路线压测台
// =========================================================================
const implState = { count: 6, showTab: false };
let prevImplTracks = null;

function renderImplSvg(kind, track, prevTrack, showTab) {
  const cols = 3;
  const colW = 74;
  const gap = 8;
  const pad = 6;
  const vbW = pad * 2 + cols * colW + (cols - 1) * gap;
  const vbH = Math.max(210, Math.ceil(track.maxH + pad * 2 + 12));
  const prevColMap = prevTrack ? new Map(prevTrack.items.map((it) => [it.id, it.col])) : null;
  let movedCount = 0;

  let rects = "";
  const centers = [];

  track.items.forEach((it) => {
    const x = pad + it.col * (colW + gap);
    const y = pad + it.y;
    const st = THEME_STYLES[it.theme] || THEME_STYLES.beige;
    const isNew = it.id > 6;
    const shifted = prevColMap && prevColMap.has(it.id) && prevColMap.get(it.id) !== it.col;
    if (shifted) movedCount++;

    const stroke = shifted ? PALETTE.redDeep : isNew ? PALETTE.ink : "rgba(27,27,27,0.14)";
    const sw = shifted ? 2.4 : isNew ? 1.8 : 1;
    const dash = isNew ? 'stroke-dasharray="4 2"' : "";
    rects += `<rect x="${x}" y="${y}" width="${colW}" height="${it.h}" rx="4" fill="${st.bg}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`;
    rects += `<text x="${x + 7}" y="${y + 16}" fill="${st.fg}" font-family="Space Mono, monospace" font-size="11" font-weight="700">${it.label}</text>`;
    if (shifted) {
      rects += `<text x="${x + colW - 6}" y="${y + it.h - 7}" text-anchor="end" fill="${st.fg}" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="900">跳列!</text>`;
    } else if (isNew) {
      rects += `<text x="${x + colW - 6}" y="${y + it.h - 7}" text-anchor="end" fill="${st.fg}" font-family="Noto Sans SC, sans-serif" font-size="10" font-weight="700">新卡</text>`;
    }
    centers.push({ x: x + colW / 2, y: y + Math.min(26, it.h / 2) });
  });

  let overlay = "";
  if (showTab && centers.length > 1) {
    const pts = centers.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const col = kind === "columns" ? PALETTE.redDeep : PALETTE.ink;
    overlay += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="4 3"/>`;
    centers.forEach((c, i) => {
      overlay += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="8.5" fill="${col}" stroke="${PALETTE.paper}" stroke-width="1.8"/>`;
      overlay += `<text x="${c.x.toFixed(1)}" y="${(c.y + 3.5).toFixed(1)}" text-anchor="middle" fill="${PALETTE.paper}" font-family="Space Mono, monospace" font-size="9.5" font-weight="700">${i + 1}</text>`;
    });
  }

  return {
    svg: `<svg viewBox="0 0 ${vbW} ${vbH}" role="img" aria-hidden="true">${rects}${overlay}</svg>`,
    movedCount,
  };
}

function syncImplUI(isAppend = false) {
  const kinds = ["columns", "js", "grid-lanes"];
  const current = {};
  const movedSummary = {};
  kinds.forEach((k) => {
    current[k] = computeImplTrack(k, implState.count);
    const { svg, movedCount } = renderImplSvg(k, current[k], isAppend ? prevImplTracks?.[k] : null, implState.showTab);
    $(`#stage-${k}`).innerHTML = svg;
    const badge = $(`#moved-${k}`);
    badge.textContent = `旧卡迁移 ${movedCount} 张`;
    badge.dataset.alert = movedCount > 0 ? "1" : "0";
    movedSummary[k] = movedCount;
  });
  prevImplTracks = current;

  const appendBtn = $("#impl-append");
  appendBtn.disabled = implState.count >= 12;
  appendBtn.textContent = implState.count >= 12 ? "已追加至 12 张（点恢复重测）" : "＋ 模拟无限滚动：追加 6 张新卡";

  const tabBtn = $("#impl-tab");
  tabBtn.setAttribute("aria-pressed", implState.showTab ? "true" : "false");
  tabBtn.textContent = implState.showTab ? "隐藏 Tab 焦序连线" : "显示键盘 Tab 顺序编号";

  const status = $("#impl-status");
  if (isAppend && movedSummary.columns > 0) {
    status.textContent = `压测结果：CSS 多栏为了重新平衡总高，把 ${movedSummary.columns} 张既有旧卡强行挤到了邻列；JS 最短列与原生 grid-lanes 旧卡 0 迁移！`;
  } else if (implState.showTab) {
    status.textContent = "对比红/黑连线：CSS 多栏的 Tab 焦点一路竖着冲到底再折返顶行；另外两轨则自上而下横向平稳推进。";
  } else {
    status.textContent = `当前每轨展示 ${implState.count} 张卡片；点击「追加 6 张新卡」或开启 Tab 焦序直观对照差异。`;
  }
}

syncImplUI(false);

$("#impl-append").addEventListener("click", () => {
  implState.count = 12;
  syncImplUI(true);
});

$("#impl-reset").addEventListener("click", () => {
  implState.count = 6;
  prevImplTracks = null;
  syncImplUI(false);
});

$("#impl-tab").addEventListener("click", () => {
  implState.showTab = !implState.showTab;
  syncImplUI(false);
});

// =========================================================================
// 四、第 03 节（墨黑暗室）：自由逛图 vs 定向查价 视线对比
// =========================================================================
const scanCanvas = $("#scan-canvas");
const scanRenderer = createScanCompareRenderer(scanCanvas);
const scanState = { task: "browse", lmode: "masonry" };

const SCAN_CAPTIONS = {
  "browse:masonry": "漫游逛灵感 × 瀑布流：绿线顺着各张完整画幅自然游走，屏内紧致展示全部 6 款器物，适合边逛边发现。",
  "browse:grid": "漫游逛灵感 × 齐行网格：所有卡片被锁成等高，矮图上下留白过多，一屏能露出和呼吸的视觉节奏变平淡。",
  "compare:masonry": "横向比价格 × 瀑布流：红线在每个价格坐标间上下折返，眼睛无法沿同一水平基线快速扫读，比价效率明显下降。",
  "compare:grid": "横向比价格 × 齐行网格：所有价格稳稳落在两条青绿水平基线上，视线横扫即可一次对比三款价格——这类任务不该用瀑布流。",
};

function syncScanUI() {
  $$("[data-task]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.task === scanState.task ? "true" : "false"));
  $$("[data-lmode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lmode === scanState.lmode ? "true" : "false"));
  $("#scan-caption").textContent = SCAN_CAPTIONS[`${scanState.task}:${scanState.lmode}`];
}

syncScanUI();
const scanLoop = loop(scanCanvas, (_t, dt, opts) => {
  scanRenderer.draw(scanState.task, scanState.lmode, dt, opts);
});

$$("[data-task]").forEach((b) => {
  b.addEventListener("click", () => {
    scanState.task = b.dataset.task;
    syncScanUI();
    scanLoop.draw();
  });
});

$$("[data-lmode]").forEach((b) => {
  b.addEventListener("click", () => {
    scanState.lmode = b.dataset.lmode;
    syncScanUI();
    scanLoop.draw();
  });
});

// =========================================================================
// 五、第 04 节：包豪斯年代档案卡
// =========================================================================
const ERAS = [
  {
    kicker: "ARCHITECTURAL METAPHOR",
    title: "把石匠的「找低槽填石」搬进网页",
    text: '在早期依靠文档流（见 <a href="https://layout.xiaoxiaodong.ai/222/play/" target="_blank" rel="noopener">222 普通流布局</a>）与浮动（见 <a href="https://layout.xiaoxiaodong.ai/231/play/" target="_blank" rel="noopener">231 浮动布局</a>）排版的年代，元素高度不一就会把下一行顶歪。前端借用建筑砌石术「Masonry」命名这种打破水平行线、往垂直最浅空隙补砖的排法，中文因卡片错落倾泻称作「瀑布流」。',
    source: '延伸关联：不同屏宽下的列数折行往往配合 <a href="https://layout.xiaoxiaodong.ai/240/play/" target="_blank" rel="noopener">240 响应式布局</a> 与 <a href="https://layout.xiaoxiaodong.ai/242/play/" target="_blank" rel="noopener">242 容器查询布局</a>。',
    svg: `<svg viewBox="0 0 180 120" width="180" height="120"><rect x="12" y="14" width="46" height="34" rx="3" fill="#F25A39"/><rect x="66" y="14" width="46" height="58" rx="3" fill="#F3B52D"/><rect x="120" y="14" width="46" height="44" rx="3" fill="#098071"/><rect x="12" y="56" width="46" height="50" rx="3" fill="#1B1B1B"/><rect x="120" y="66" width="46" height="40" rx="3" fill="#F25A39"/><rect x="66" y="80" width="46" height="26" rx="3" fill="#098071"/></svg>`,
  },
  {
    kicker: "OPEN SOURCE · 2009–2010",
    title: "David DeSandro 写出 jQuery Masonry",
    text: "2009 至 2010 年间，前端设计师 David DeSandro 开发并发布了开源脚本 jQuery Masonry（2011 年 5 月发布 v2 架构重写，2013 年 v3 脱离 jQuery 成为独立脚本库）。它用极简的列高数组算法自动定位每张卡片的绝对坐标，让无数博客与摄影作品集第一次用几行配置就跑起了瀑布流。",
    source: "核实来源：David DeSandro 官方文档 masonry.desandro.com 与 GitHub 仓库 desandro/masonry。",
    svg: `<svg viewBox="0 0 180 120" width="180" height="120"><rect x="16" y="16" width="148" height="88" rx="6" fill="#1B1B1B"/><text x="28" y="42" fill="#F3B52D" font-family="Space Mono, monospace" font-size="11" font-weight="700">new Masonry(wall, {</text><text x="38" y="62" fill="#FAF2E7" font-family="Space Mono, monospace" font-size="11">columnWidth: 220,</text><text x="38" y="80" fill="#56DBC7" font-family="Space Mono, monospace" font-size="11">gutter: 16</text><text x="28" y="96" fill="#F3B52D" font-family="Space Mono, monospace" font-size="11" font-weight="700">});</text></svg>`,
  },
  {
    kicker: "PRODUCT BREAKTHROUGH · MARCH 2010",
    title: "Pinterest 把钉板瀑布流推向全球主流",
    text: "2009 年底，Ben Silbermann、Paul Sciarra 邀请曾在哥伦比亚大学学习建筑的 Evan Sharp 加入团队。他们摒弃呆板的横排列表，迭代了数十个原型后，于 2010 年 3 月以封闭测试形式上线 Pinterest。多列高低错落的「灵感钉板」配滚动加载一夜风靡，随后在电商商品流与图文社区中被广泛采用。",
    source: "核实来源：Pinterest 创立公开史料（Ben Silbermann、Paul Sciarra、Evan Sharp，2010 年 3 月上线）。",
    svg: `<svg viewBox="0 0 180 120" width="180" height="120"><circle cx="44" cy="40" r="22" fill="#F25A39"/><rect x="80" y="18" width="38" height="52" rx="4" fill="#F3B52D"/><rect x="126" y="18" width="38" height="34" rx="4" fill="#098071"/><rect x="126" y="60" width="38" height="44" rx="4" fill="#1B1B1B"/><rect x="80" y="78" width="38" height="26" rx="4" fill="#F25A39"/><rect x="24" y="70" width="44" height="34" rx="4" fill="#098071"/></svg>`,
  },
  {
    kicker: "W3C STANDARD · 2020–2026",
    title: "从浏览器实验走向原生 display: grid-lanes",
    text: '2020 年 Mozilla 首先在 Firefox 中试验 <code>grid-template-rows: masonry</code>。2024 至 2025 年，W3C CSS 工作组与各浏览器引擎围绕「归入 Grid 还是独立布局模式」展开广泛讨论，最终在 CSS Grid Layout Module Level 3 中敲定原生语法 <code>display: grid-lanes</code>，并配套 <code>flow-tolerance</code> 解决相邻列微差引发的跳序，让纯 CSS 零脚本瀑布流成为标准。',
    source: "核实来源：W3C CSS Grid Level 3 规范草案（css-grid-3）、WebKit 博客 Jen Simmons 等人技术公告（2025.12）与 MDN 文档。",
    svg: `<svg viewBox="0 0 180 120" width="180" height="120"><rect x="14" y="18" width="46" height="84" rx="4" fill="none" stroke="#098071" stroke-width="2" stroke-dasharray="5 3"/><rect x="67" y="18" width="46" height="84" rx="4" fill="none" stroke="#098071" stroke-width="2" stroke-dasharray="5 3"/><rect x="120" y="18" width="46" height="84" rx="4" fill="none" stroke="#098071" stroke-width="2" stroke-dasharray="5 3"/><rect x="18" y="22" width="38" height="32" rx="3" fill="#F25A39"/><rect x="71" y="22" width="38" height="48" rx="3" fill="#F3B52D"/><rect x="124" y="22" width="38" height="26" rx="3" fill="#1B1B1B"/><rect x="124" y="54" width="38" height="44" rx="3" fill="#098071"/><rect x="18" y="60" width="38" height="38" rx="3" fill="#F3B52D"/></svg>`,
  },
];

function syncEra(idx) {
  const e = ERAS[idx];
  $$(".era-tab").forEach((b, i) => b.setAttribute("aria-selected", i === idx ? "true" : "false"));
  $("#era-visual").innerHTML = e.svg;
  $("#era-kicker").textContent = e.kicker;
  $("#era-title").textContent = e.title;
  $("#era-text").innerHTML = e.text;
  $("#era-source").innerHTML = e.source;
}

syncEra(0);
$$(".era-tab").forEach((b) => {
  b.addEventListener("click", () => syncEra(Number(b.dataset.era)));
});

// =========================================================================
// 六、第 05 节：场景分诊台
// =========================================================================
function syncScenario(id) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  $$(".t-chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.sc === sc.id ? "true" : "false"));
  const box = $("#triage-result");
  box.dataset.verdict = sc.verdict;
  $("#tr-badge").textContent = sc.badge;
  $("#tr-scene").textContent = sc.label;
  $("#tr-headline").textContent = sc.headline;
  $("#tr-detail").textContent = sc.detail;
  const altEl = $("#tr-alt");
  if (sc.link) {
    altEl.innerHTML = `${sc.alt} → <a href="https://layout.xiaoxiaodong.ai/${sc.link.id}/play/" target="_blank" rel="noopener">查看 ${sc.link.name}</a>`;
  } else {
    altEl.textContent = sc.alt;
  }
}

syncScenario(SCENARIOS[0].id);
$$(".t-chip").forEach((b) => {
  b.addEventListener("click", () => syncScenario(b.dataset.sc));
});

// =========================================================================
// 七、第 06 节：单一变量四选一小练习（SVG 实绘，答题后浮现诊断标尺）
// =========================================================================
const QUIZ_HEIGHTS = [44, 72, 34, 62, 38, 56]; // 6 张不同原图比例的真实高度
const QUIZ_COLORS = ["#F25A39", "#F3B52D", "#098071", "#1B1B1B", "#F25A39", "#098071"];

function renderQuizSvg(mode, revealed) {
  const colW = 54;
  const gap = 8;
  const pad = 8;
  const vbW = pad * 2 + colW * 3 + gap * 2;
  const vbH = 156;
  let body = "";

  if (mode === "row-grid") {
    const rowHs = [72, 62];
    const rowYs = [pad, pad + rowHs[0] + gap];
    QUIZ_HEIGHTS.forEach((h, i) => {
      const c = i % 3;
      const r = Math.floor(i / 3);
      const x = pad + c * (colW + gap);
      const y = rowYs[r];
      body += `<rect x="${x}" y="${y}" width="${colW}" height="${h}" rx="4" fill="${QUIZ_COLORS[i]}"/>`;
      body += `<text x="${x + 6}" y="${y + 15}" fill="${QUIZ_COLORS[i] === "#F3B52D" ? "#1B1B1B" : "#FAF2E7"}" font-family="Space Mono, monospace" font-size="10" font-weight="700">#${i + 1}</text>`;
      if (revealed && rowHs[r] - h > 8) {
        body += `<rect x="${x + 1}" y="${y + h + 3}" width="${colW - 2}" height="${rowHs[r] - h - 4}" rx="3" fill="rgba(242,90,57,0.18)" stroke="#B62F12" stroke-width="1.2" stroke-dasharray="3 2"/>`;
      }
    });
  } else if (mode === "columns") {
    // 竖向按列填：列1放#1,#2，列2放#3,#4，列3放#5,#6
    const colY = [pad, pad, pad];
    const pts = [];
    QUIZ_HEIGHTS.forEach((h, i) => {
      const c = Math.floor(i / 2);
      const x = pad + c * (colW + gap);
      const y = colY[c];
      colY[c] += h + gap;
      body += `<rect x="${x}" y="${y}" width="${colW}" height="${h}" rx="4" fill="${QUIZ_COLORS[i]}"/>`;
      body += `<text x="${x + 6}" y="${y + 15}" fill="${QUIZ_COLORS[i] === "#F3B52D" ? "#1B1B1B" : "#FAF2E7"}" font-family="Space Mono, monospace" font-size="10" font-weight="700">#${i + 1}</text>`;
      pts.push(`${x + colW / 2},${y + 14}`);
    });
    if (revealed) {
      body += `<polyline points="${pts.join(" ")}" fill="none" stroke="#B62F12" stroke-width="1.8" stroke-dasharray="4 2"/>`;
    }
  } else if (mode === "grid-lanes") {
    const colY = [pad, pad, pad];
    const pts = [];
    QUIZ_HEIGHTS.forEach((h, i) => {
      const minY = Math.min(...colY);
      const c = colY.findIndex((v) => v <= minY + 12);
      const x = pad + c * (colW + gap);
      const y = colY[c];
      colY[c] += h + gap;
      body += `<rect x="${x}" y="${y}" width="${colW}" height="${h}" rx="4" fill="${QUIZ_COLORS[i]}"/>`;
      body += `<text x="${x + 6}" y="${y + 15}" fill="${QUIZ_COLORS[i] === "#F3B52D" ? "#1B1B1B" : "#FAF2E7"}" font-family="Space Mono, monospace" font-size="10" font-weight="700">#${i + 1}</text>`;
      pts.push(`${x + colW / 2},${y + 14}`);
    });
    if (revealed) {
      body += `<polyline points="${pts.join(" ")}" fill="none" stroke="#066257" stroke-width="1.8" stroke-dasharray="4 2"/>`;
    }
  } else {
    // cropped：全部强行裁成 46px 高度
    const h = 46;
    QUIZ_HEIGHTS.forEach((origH, i) => {
      const c = i % 3;
      const r = Math.floor(i / 3);
      const x = pad + c * (colW + gap);
      const y = pad + r * (h + gap + 8);
      body += `<rect x="${x}" y="${y}" width="${colW}" height="${h}" rx="4" fill="${QUIZ_COLORS[i]}"/>`;
      body += `<text x="${x + 6}" y="${y + 15}" fill="${QUIZ_COLORS[i] === "#F3B52D" ? "#1B1B1B" : "#FAF2E7"}" font-family="Space Mono, monospace" font-size="10" font-weight="700">#${i + 1}</text>`;
      if (revealed && origH > h + 6) {
        body += `<line x1="${x + 4}" y1="${y + h - 5}" x2="${x + colW - 4}" y2="${y + h - 5}" stroke="#FAF2E7" stroke-width="1.5" stroke-dasharray="3 2"/>`;
        body += `<text x="${x + colW - 5}" y="${y + h - 9}" text-anchor="end" fill="#FAF2E7" font-family="Noto Sans SC, sans-serif" font-size="9" font-weight="700">被裁切</text>`;
      }
    });
  }
  return `<svg viewBox="0 0 ${vbW} ${vbH}">${body}</svg>`;
}

function drawQuizCards(revealed = false) {
  QUIZ_OPTIONS.forEach((opt) => {
    $(`#qsvg-${opt.id}`).innerHTML = renderQuizSvg(opt.mode, revealed);
  });
}

drawQuizCards(false);

$$(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pickedId = btn.dataset.opt;
    const picked = QUIZ_OPTIONS.find((o) => o.id === pickedId);
    drawQuizCards(true);

    $$(".quiz-opt").forEach((b) => {
      const o = QUIZ_OPTIONS.find((x) => x.id === b.dataset.opt);
      b.setAttribute("aria-pressed", b.dataset.opt === pickedId ? "true" : "false");
      if (o.correct) b.dataset.state = "correct";
      else if (b.dataset.opt === pickedId) b.dataset.state = "wrong";
      else delete b.dataset.state;
    });

    const fb = $("#quiz-feedback");
    fb.hidden = false;
    fb.dataset.ok = picked.correct ? "1" : "0";
    $("#qf-verdict").textContent = picked.verdict;
    $("#qf-explain").textContent = picked.explain;
  });
});

$("#quiz-retry").addEventListener("click", () => {
  drawQuizCards(false);
  $$(".quiz-opt").forEach((b) => {
    b.setAttribute("aria-pressed", "false");
    delete b.dataset.state;
  });
  $("#quiz-feedback").hidden = true;
});

// =========================================================================
// 八、第 07 节：原海报放大、拖动、Esc 关闭灯箱（只复用 #poster.src）
// =========================================================================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbResetBtn = $("#lb-zoom-reset");
let lbScale = 1, lbX = 0, lbY = 0, lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbResetBtn.textContent = `${Math.round(lbScale * 100)}%`;
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
  $("#poster-open").focus();
}

$("#poster-open").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => { lbScale = Math.min(3.5, +(lbScale + 0.35).toFixed(2)); applyLbTransform(); });
$("#lb-zoom-out").addEventListener("click", () => { lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2)); applyLbTransform(); });
lbResetBtn.addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.18 : -0.18;
  lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbStage.setPointerCapture(e.pointerId);
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY, id: e.pointerId };
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLbTransform();
});

lbStage.addEventListener("pointerup", (e) => {
  if (lbDrag && e.pointerId === lbDrag.id) lbDrag = null;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// 初始化渲染
syncHeroUI();
heroLoop.draw();
stepLoop.draw();
scanLoop.draw();
