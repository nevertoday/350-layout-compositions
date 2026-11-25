// 332 起承转合构图 · 交互主控（开场四折观澜舞台 + 01–07 节全交互 + 原海报灯箱）
import { loop, reducedMotion } from "../../lib/stage.js";
import {
  PHASES,
  PRESETS,
  clamp,
  createInitialState,
  cursorSpeedAt,
  evaluate,
  pct,
} from "./model.js";
import { renderHeroCanvas } from "./stage-canvas.js";

const state = createInitialState();
const canvas = document.getElementById("hero-canvas");

// UI 节点缓存
const ui = {
  statusPill: document.getElementById("hero-status-pill"),
  titlePhases: [...document.querySelectorAll(".title-phase")],
  sceneTabs: [...document.querySelectorAll(".scene-tab")],
  logicItems: [...document.querySelectorAll(".logic-item")],
  phasePills: [...document.querySelectorAll(".phase-pill")],
  iconProbes: [...document.querySelectorAll(".icon-probe")],
  energySlider: document.getElementById("energy-slider"),
  energyReadout: document.getElementById("energy-readout"),
  activePhaseName: document.getElementById("active-phase-name"),
  curveSlider: document.getElementById("curve-slider"),
  curveReadout: document.getElementById("curve-readout"),
  btnSwap: document.getElementById("btn-swap"),
  btnPlay: document.getElementById("btn-play"),
  presetBtns: [...document.querySelectorAll(".preset-btn")],
  diagCard: document.querySelector(".diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagHint: document.getElementById("diag-hint"),
  btnFix: document.getElementById("btn-fix"),
  mEntry: document.getElementById("m-entry"),
  mLeap: document.getElementById("m-leap"),
  mDrop: document.getElementById("m-drop"),
  mGrade: document.getElementById("m-grade"),
  tipsItems: [...document.querySelectorAll("#tips-list li")],
};

let lastEval = null;
let currentFixAction = null;

function syncHeroUI(evalRes) {
  lastEval = evalRes;
  currentFixAction = evalRes.fixAction;

  // 状态胶囊
  ui.statusPill.textContent = evalRes.badge;
  ui.statusPill.classList.toggle("is-solved", evalRes.isSolved);

  // 标题自示范：四个字高度起伏呼应当前四折张力
  const maxE = Math.max(...state.energies);
  ui.titlePhases.forEach((el, i) => {
    const e = state.energies[i];
    const lift = Math.round((e - 0.45) * -10);
    el.style.transform = `translateY(${lift}px)`;
    el.classList.toggle("is-peak", e === maxE && e >= 0.72);
  });

  // 选折控件与滑轨
  ui.activePhaseName.textContent = PHASES[state.active].zh;
  const activePct = Math.round(state.energies[state.active] * 100);
  ui.energySlider.value = String(activePct);
  ui.energyReadout.textContent = `${activePct}%`;

  const curvePct = Math.round(state.curve * 100);
  ui.curveSlider.value = String(curvePct);
  ui.curveReadout.textContent = `${curvePct}%`;

  ui.phasePills.forEach((btn, i) => btn.classList.toggle("is-active", i === state.active));

  // 右上「核心逻辑」与右翼四金标同步
  evalRes.phaseChecks.forEach((chk, i) => {
    const valEl = document.querySelector(`[data-pval="${i}"]`);
    const badgeEl = document.querySelector(`[data-pbadge="${i}"]`);
    const probeTag = document.querySelector(`[data-probe-tag="${i}"]`);
    if (valEl) valEl.textContent = pct(state.energies[i]);
    if (badgeEl) badgeEl.textContent = chk.tag;
    if (probeTag) probeTag.textContent = chk.tag;

    const li = ui.logicItems[i];
    if (li) {
      li.classList.toggle("is-active", i === state.active);
      li.classList.toggle("is-ok", chk.ok);
      li.classList.toggle("is-bad", !chk.ok);
    }
    const probe = ui.iconProbes[i];
    if (probe) {
      probe.classList.toggle("is-active", i === state.active);
      probe.classList.toggle("is-ok", chk.ok);
      probe.classList.toggle("is-bad", !chk.ok);
    }
  });

  // 研判笺
  ui.diagCard.classList.toggle("is-solved", evalRes.isSolved);
  ui.diagBadge.textContent = evalRes.badge;
  ui.diagHeadline.textContent = evalRes.headline;
  ui.diagBody.textContent = evalRes.body;
  ui.diagHint.textContent = evalRes.hint;

  if (evalRes.fixAction) {
    ui.btnFix.hidden = false;
    ui.btnFix.textContent = evalRes.fixAction.label;
  } else {
    ui.btnFix.hidden = true;
  }

  ui.mEntry.textContent = evalRes.metrics.entryAir;
  ui.mLeap.textContent = evalRes.metrics.turnLeap;
  ui.mDrop.textContent = evalRes.metrics.resolveDrop;
  ui.mGrade.textContent = evalRes.metrics.rhythmGrade;

  // TIPS 四条实时对勾
  ui.tipsItems.forEach((li, i) => li.classList.toggle("is-ok", !!evalRes.tipsChecks[i]));

  // 播放按钮状态
  ui.btnPlay.setAttribute("aria-pressed", String(state.playing));
  ui.btnPlay.textContent = state.playing ? "暂停视线" : "演一遍视线";
}

function recomputeAndSync() {
  const w = canvas.clientWidth || 760;
  const h = canvas.clientHeight || 480;
  const ev = evaluate(state, w, h);
  syncHeroUI(ev);
  return ev;
}

// 渲染循环（屏幕外、隐藏页签或 reduced-motion 自动暂停；静置省电按需重绘，拖动/播放合帧单绘）
let lastUiKey = "";
let dirty = true;
let hasDrawnIntro = false;

function markDirty(immediate = false) {
  dirty = true;
  if (immediate || reducedMotion.matches) stageLoop.draw();
}

const stageLoop = loop(canvas, (t, dt, { still }) => {
  const inIntro = !still && t < 1.1;
  if (!still && state.playing && dt > 0) {
    state.cursor += cursorSpeedAt(state.energies, state.cursor) * dt;
    if (state.cursor > 1) state.cursor -= 1;
    dirty = true;
  }
  if (!dirty && !inIntro && hasDrawnIntro) return;
  dirty = false;
  hasDrawnIntro = true;

  const w = canvas.clientWidth || 760;
  const h = canvas.clientHeight || 480;
  const ev = evaluate(state, w, h);
  const key = `${state.energies.map((n) => Math.round(n * 100)).join(",")}|${Math.round(state.curve * 100)}|${state.active}|${state.scene}|${state.playing}`;
  if (key !== lastUiKey) {
    lastUiKey = key;
    syncHeroUI(ev);
  }
  renderHeroCanvas(canvas, state, ev, still ? 0 : t);
});

// 画布指针与触屏交互（兼容 Pointer 与 CDP Touch，横拖绝不锁页面竖滚）
let dragMode = null; // 'phase' | 'cursor' | null
let dragPhaseIdx = -1;
let dragStartX = 0;
let dragStartY = 0;
let dragStartEnergy = 0;
let dragStartCursor = 0;
let dragLocked = false;

function hitPhaseCircle(localX, localY) {
  if (!lastEval) return -1;
  for (const c of lastEval.layout.circles) {
    if (Math.hypot(localX - c.cx, localY - c.cy) <= c.r + 14) return c.index;
  }
  return -1;
}

function beginDrag(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const lx = clientX - rect.left;
  const ly = clientY - rect.top;
  const hit = hitPhaseCircle(lx, ly);
  dragStartX = clientX;
  dragStartY = clientY;
  dragLocked = false;
  if (hit >= 0) {
    state.active = hit;
    dragMode = "phase";
    dragPhaseIdx = hit;
    dragStartEnergy = state.energies[hit];
    recomputeAndSync();
    markDirty();
  } else {
    dragMode = "cursor";
    dragPhaseIdx = -1;
    dragStartCursor = state.cursor;
  }
}

function moveDrag(clientX, clientY, preventFn) {
  if (!dragMode) return;
  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  if (!dragLocked) {
    if (Math.hypot(dx, dy) < 4) return;
    // 若以垂直滑动为主且未点中圆镜，放行页面滚动
    if (Math.abs(dy) > Math.abs(dx) * 1.35 && dragMode === "cursor") {
      dragMode = null;
      return;
    }
    dragLocked = true;
  }
  if (preventFn) preventFn();
  const rect = canvas.getBoundingClientRect();
  const spanW = Math.max(180, rect.width * 0.55);

  if (dragMode === "phase" && dragPhaseIdx >= 0) {
    state.energies[dragPhaseIdx] = clamp(dragStartEnergy + dx / spanW, 0.05, 1.0);
    // 同步轻推视线光珠到该折附近，视觉反馈更紧密
    state.cursor = clamp(dragPhaseIdx / 3 + (dx / spanW) * 0.12, 0, 1);
  } else if (dragMode === "cursor") {
    state.playing = false;
    state.cursor = clamp(dragStartCursor + dx / Math.max(160, rect.width * 0.72), 0, 1);
    // 横拖画布中心时微调当前选中折张力，让手势对画面能量和视线流都有实时真实反馈
    state.energies[state.active] = clamp(
      state.energies[state.active] + (dx > 0 ? 0.004 : -0.004),
      0.05,
      1.0
    );
  }
  // 合并到下一帧 rAF 单绘，避免单帧内双绘拖慢软件渲染
  markDirty();
}

function endDrag() {
  dragMode = null;
  dragLocked = false;
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (e.pointerType === "touch") return; // 触屏交给 touch 事件，避免双触发
  beginDrag(e.clientX, e.clientY);
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  moveDrag(e.clientX, e.clientY);
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  endDrag();
});
canvas.addEventListener("pointercancel", endDrag);

canvas.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length !== 1) return;
    beginDrag(e.touches[0].clientX, e.touches[0].clientY);
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    if (!dragMode || e.touches.length !== 1) return;
    moveDrag(e.touches[0].clientX, e.touches[0].clientY, () => e.preventDefault());
  },
  { passive: false }
);
canvas.addEventListener("touchend", endDrag, { passive: true });
canvas.addEventListener("touchcancel", endDrag, { passive: true });

// 题材切换
ui.sceneTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    ui.sceneTabs.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    });
    recomputeAndSync();
    markDirty(true);
  });
});

// 选折联动（右上核心逻辑 + 滑轨胶囊 + 右翼四金标）
document.querySelectorAll("[data-select-phase]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.active = Number(btn.dataset.selectPhase);
    state.cursor = state.active / 3;
    recomputeAndSync();
    markDirty(true);
  });
});

// 张力与曲度滑轨
ui.energySlider.addEventListener("input", () => {
  state.energies[state.active] = clamp(Number(ui.energySlider.value) / 100, 0.05, 1.0);
  recomputeAndSync();
  markDirty(true);
});

ui.curveSlider.addEventListener("input", () => {
  state.curve = clamp(Number(ui.curveSlider.value) / 100, 0, 1);
  recomputeAndSync();
  markDirty(true);
});

// 互换起⇄转
ui.btnSwap.addEventListener("click", () => {
  const tmp = state.energies[0];
  state.energies[0] = state.energies[2];
  state.energies[2] = tmp;
  state.active = 2;
  recomputeAndSync();
  markDirty(true);
});

// 演一遍视线
ui.btnPlay.addEventListener("click", () => {
  if (reducedMotion.matches) {
    state.cursor = (state.cursor + 0.333) % 1;
    state.playing = false;
  } else {
    state.playing = !state.playing;
  }
  recomputeAndSync();
  markDirty(true);
});

// 单步校准按钮
ui.btnFix.addEventListener("click", () => {
  if (!currentFixAction) return;
  currentFixAction.apply(state);
  recomputeAndSync();
  markDirty(true);
});

// 预设解与试错按钮
ui.presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state.energies = [...p.energies];
    state.curve = p.curve;
    state.active = p.active;
    recomputeAndSync();
    markDirty(true);
  });
});

// 键盘操作（1–4 选折，←/→ 微调张力，Space 播放/暂停）
window.addEventListener("keydown", (e) => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const lb = document.getElementById("lightbox");
  if (lb && !lb.hidden) return;
  if (e.key >= "1" && e.key <= "4") {
    state.active = Number(e.key) - 1;
    state.cursor = state.active / 3;
    recomputeAndSync();
    markDirty(true);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const delta = e.key === "ArrowRight" ? 0.05 : -0.05;
    state.energies[state.active] = clamp(state.energies[state.active] + delta, 0.05, 1.0);
    recomputeAndSync();
    markDirty(true);
  } else if (e.key === " " && document.activeElement === document.body) {
    e.preventDefault();
    state.playing = !state.playing;
    recomputeAndSync();
    markDirty(true);
  }
});

window.addEventListener("resize", () => {
  recomputeAndSync();
  markDirty(true);
});

// 初始绘制一帧
recomputeAndSync();
markDirty(true);

/* ==================== 01 节：四拍抽离试验台 ==================== */
const beatKeep = [true, true, true, true];
const dropoutSvg = document.getElementById("dropout-svg");
const dropoutTag = document.getElementById("dropout-tag");
const dropoutText = document.getElementById("dropout-text");

function renderDropout() {
  const baseLevels = [0.20, 0.52, 0.90, 0.24];
  const labels = ["起 · 入口", "承 · 展开", "转 · 高潮", "合 · 余韵"];
  const xs = [90, 270, 450, 630];
  const yOf = (v) => 136 - v * 96;

  // 存活折点连线
  const livePts = [];
  for (let i = 0; i < 4; i++) {
    if (beatKeep[i]) livePts.push({ i, x: xs[i], y: yOf(baseLevels[i]) });
  }

  let pathD = "";
  if (livePts.length >= 2) {
    pathD = `M ${livePts[0].x} ${livePts[0].y}`;
    for (let k = 0; k < livePts.length - 1; k++) {
      const a = livePts[k], b = livePts[k + 1];
      const mx = (a.x + b.x) / 2;
      pathD += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
    }
  }

  const cards = xs
    .map((x, i) => {
      const on = beatKeep[i];
      const y = yOf(baseLevels[i]);
      return `
        <g opacity="${on ? 1 : 0.35}">
          <rect x="${x - 66}" y="14" width="132" height="148" rx="10"
            fill="${on ? "#05332C" : "none"}"
            stroke="${on ? "#396554" : "#FF8E72"}"
            stroke-width="${on ? 1.5 : 1.5}"
            stroke-dasharray="${on ? "" : "5 4"}" />
          <circle cx="${x}" cy="${y}" r="${on ? 11 : 7}"
            fill="${on ? (i === 2 ? "#FFCB41" : "#F6E2B5") : "#7D2315"}"
            stroke="${on ? "#014038" : "#FF8E72"}" stroke-width="2" />
          <text x="${x}" y="152" text-anchor="middle" fill="${on ? "#F7E5BB" : "#FFB8A3"}"
            font-size="13" font-family="Noto Serif SC, serif">${on ? labels[i] : `${labels[i].slice(0, 1)} · 已抽离`}</text>
        </g>`;
    })
    .join("");

  dropoutSvg.innerHTML = `
    <rect width="720" height="176" rx="10" fill="#014038" />
    ${cards}
    ${pathD ? `<path d="${pathD}" fill="none" stroke="#FFCB41" stroke-width="3" stroke-linecap="round" />` : ""}
  `;

  // 逐情况白话研判
  const offList = beatKeep.map((k, i) => (k ? null : i)).filter((v) => v !== null);
  if (offList.length === 0) {
    dropoutTag.textContent = "四拍完整";
    dropoutTag.className = "verdict-tag is-ok";
    dropoutText.textContent =
      "四拍俱全：视线从极简孤月轻步进入，在重峦中蓄积信息，遇巨浪骤然提神，最终落入平水倒影慢慢散开余韵。";
  } else if (offList.length >= 3) {
    dropoutTag.textContent = `只剩 ${4 - offList.length} 拍 · 不成章法`;
    dropoutTag.className = "verdict-tag is-bad";
    dropoutText.textContent =
      "抽掉太多节拍后，画面失去了先后次序与情绪坡度，退化成孤立的单格陈列。";
  } else if (!beatKeep[0] && offList.length === 1) {
    dropoutTag.textContent = "缺「起」· 入口突兀";
    dropoutTag.className = "verdict-tag is-bad";
    dropoutText.textContent =
      "没有「起」的简洁引路，观众一睁眼就掉进繁密中段，还没建立方向就被信息推着走，容易产生抗拒感。";
  } else if (!beatKeep[1] && offList.length === 1) {
    dropoutTag.textContent = "缺「承」· 断崖跳戏";
    dropoutTag.className = "verdict-tag is-bad";
    dropoutText.textContent =
      "从极简入口直接跳进怒涛高潮，缺少中间的铺垫与细节蓄势，转折像凭空炸雷，情绪来得太急而站不住脚。";
  } else if (!beatKeep[2] && offList.length === 1) {
    dropoutTag.textContent = "缺「转」· 寡淡平水";
    dropoutTag.className = "verdict-tag is-bad";
    dropoutText.textContent =
      "起、承、合全在平稳低位打转，没有一次打破惯性的高潮撞击，整幅画顺滑却记不住。";
  } else if (!beatKeep[3] && offList.length === 1) {
    dropoutTag.textContent = "缺「合」· 骤停噎住";
    dropoutTag.className = "verdict-tag is-bad";
    dropoutText.textContent =
      "画面在最高张力的巨浪处戛然而止，情绪悬在半空落不下来，读者看完只觉得紧绷而缺回味。";
  } else {
    const missNames = offList.map((i) => PHASES[i].zh).join("、");
    dropoutTag.textContent = `缺「${missNames}」· 弧线塌陷`;
    dropoutTag.className = "verdict-tag is-bad";
    dropoutText.textContent = `同时失去「${missNames}」后，前后的蓄势与回落断了衔接，故事感立刻松散。试着点回被抽离的节拍再对比弧线。`;
  }
}

document.querySelectorAll("[data-beat-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const i = Number(btn.dataset.beatToggle);
    beatKeep[i] = !beatKeep[i];
    btn.setAttribute("aria-pressed", String(beatKeep[i]));
    btn.textContent = beatKeep[i] ? "保留此拍" : "点此补回";
    btn.closest(".beat-card").classList.toggle("is-off", !beatKeep[i]);
    renderDropout();
  });
});

document.getElementById("dropout-reset").addEventListener("click", () => {
  for (let i = 0; i < 4; i++) beatKeep[i] = true;
  document.querySelectorAll("[data-beat-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", "true");
    btn.textContent = "保留此拍";
    btn.closest(".beat-card").classList.remove("is-off");
  });
  renderDropout();
});
renderDropout();

/* ==================== 02 节：快慢与留白的呼吸滑尺 ==================== */
const breathContrast = document.getElementById("breath-contrast");
const breathGap = document.getElementById("breath-gap");
const breathContrastVal = document.getElementById("breath-contrast-val");
const breathGapVal = document.getElementById("breath-gap-val");
const breathExplain = document.getElementById("breath-explain");
const breathModeTag = document.getElementById("breath-mode-tag");
const breathSvg = document.getElementById("breath-svg");

function renderBreath() {
  const c = Number(breathContrast.value) / 100; // 0..1 反差
  const g = Number(breathGap.value) / 100; // 0..1 段间留白

  const cLabel = c < 0.28 ? "平铺直叙" : c < 0.72 ? "中度反差" : "大开大合";
  const gLabel = g < 0.25 ? "拥挤憋闷" : g < 0.75 ? "从容呼吸" : "疏朗空灵";
  breathContrastVal.textContent = `${cLabel} · ${Math.round(c * 100)}%`;
  breathGapVal.textContent = `${gLabel} · ${Math.round(g * 100)}%`;

  // 根据反差计算四段密度：c=0 全是 0.5；c=1 接近 0.16 / 0.50 / 0.94 / 0.22
  const base = 0.50;
  const targets = [0.16, 0.50, 0.94, 0.22];
  const dens = targets.map((t) => base + (t - base) * c);

  // 4 段在 340 高里的排布，受留白 g 影响
  const gapPx = 4 + g * 20;
  const padY = 14 + g * 10;
  const usableH = 340 - padY * 2 - gapPx * 3;
  // 转折段高一点、起合段轻一点（随 c 变化）
  const weights = [0.9 - c * 0.16, 1.0, 1.0 + c * 0.36, 0.9 - c * 0.14];
  const wSum = weights.reduce((a, b) => a + b, 0);
  const heights = weights.map((w) => (usableH * w) / wSum);

  let y = padY;
  const names = ["1 起", "2 承", "3 转", "4 合"];
  const bands = dens
    .map((d, i) => {
      const h = heights[i];
      const thisY = y;
      y += h + gapPx;
      const barW = 70 + d * 240;
      const isTurn = i === 2 && c >= 0.35;
      const fill = isTurn ? "#FABA40" : i === 0 || i === 3 ? "#F6E2B5" : "#85A27D";
      const extraLines =
        i === 1
          ? `<rect x="92" y="${thisY + h * 0.58}" width="${barW * 0.72}" height="5" rx="2.5" fill="#F6E2B5" opacity="0.65" />`
          : i === 2
          ? `<polygon points="${92 + barW - 14},${thisY + 10} ${92 + barW + 10},${thisY + h * 0.5} ${92 + barW - 14},${thisY + h - 10}" fill="#FFCB41" opacity="${0.3 + c * 0.7}" />`
          : i === 3
          ? `<circle cx="${92 + barW + 22}" cy="${thisY + h * 0.5}" r="${6 + (1 - d) * 6}" fill="#FABA40" opacity="0.85" />`
          : "";
      return `
        <g>
          <rect x="18" y="${thisY}" width="424" height="${h}" rx="7" fill="#05332C" stroke="#396554" stroke-width="1" />
          <text x="32" y="${thisY + h * 0.5 + 4}" fill="#F7E5BB" font-size="13" font-family="Noto Serif SC, serif">${names[i]}</text>
          <rect x="92" y="${thisY + h * 0.30}" width="${barW}" height="${Math.max(8, h * 0.26)}" rx="4" fill="${fill}" />
          ${extraLines}
          <text x="428" y="${thisY + h * 0.5 + 4}" text-anchor="end" fill="#B6CBC0" font-size="11.5" font-family="DM Mono, monospace">${Math.round(d * 100)}%</text>
        </g>`;
    })
    .join("");

  breathSvg.innerHTML = `<rect width="460" height="340" rx="8" fill="#014038" />${bands}`;

  if (c < 0.28 && g < 0.25) {
    breathModeTag.textContent = "又平又挤（示意）";
    breathExplain.textContent =
      "四段密度几乎一致，段间也挤成一堵墙——人眼看不到入口、高潮和停顿，只能机械往下扫。";
  } else if (c < 0.28) {
    breathModeTag.textContent = "留白够但缺高潮（示意）";
    breathExplain.textContent =
      "段间有了停顿呼吸，但四拍本身分量太像，第 3 拍「转」立不起明显跃升，节奏仍偏平淡。";
  } else if (g < 0.22) {
    breathModeTag.textContent = "有起伏但喘不过气（示意）";
    breathExplain.textContent =
      "四段体量拉开了对比，可惜彼此贴得太紧，前一段的情绪还没消化就被下一段撞上，失了余韵。";
  } else {
    breathModeTag.textContent = "快慢与留白得法（示意）";
    breathExplain.textContent =
      "当前反差与段间留白合度：第 1 段轻落引眼，第 2 段渐密铺陈，第 3 段体量与势能陡增，第 4 段空出大面呼吸收尾。";
  }
}

breathContrast.addEventListener("input", renderBreath);
breathGap.addEventListener("input", renderBreath);
renderBreath();

/* ==================== 03 节：单幅里的隐形四折 ==================== */
const SF_WORKS = {
  landscape: {
    steps: [
      {
        x: 118,
        y: 304,
        title: "起：近岸平坡与一叶轻舟",
        body: "视线从左下低平沙洲轻步落脚，孤舟与大面积浅水留白先稳住进入点，不让山石堵死门口。",
      },
      {
        x: 245,
        y: 235,
        title: "承：曲桥林木沿斜坡攀升",
        body: "顺着溪流折线向中景延展，林屋与错落山坡逐层加密，把视线自然往上送。",
      },
      {
        x: 348,
        y: 118,
        title: "转：主峰绝壁破云骤起",
        body: "在画面上三分偏右处陡然竖起巨峰与飞瀑，体量、竖势与明暗瞬间拉满，构成全幅高潮。",
      },
      {
        x: 472,
        y: 256,
        title: "合：远汀雾霭与平水留白",
        body: "峰势向右下方骤然收轻，大片雾白与极淡远山把澎湃情绪收归宁静，留出画外余韵。",
      },
    ],
    art: `
      <rect width="560" height="370" fill="#F6E2B5" />
      <!-- 远雾天际 -->
      <circle cx="468" cy="76" r="24" fill="#FABA40" opacity="0.88" />
      <!-- 转：主峰高潮 -->
      <polygon points="242,270 344,58 432,268" fill="#014038" />
      <polygon points="344,58 368,268 432,268" fill="#1C5D47" />
      <path d="M 332 128 Q 340 175 326 226" fill="none" stroke="#F6E2B5" stroke-width="5" stroke-linecap="round" />
      <!-- 承：中景重峦 -->
      <path d="M 120 278 Q 208 182 308 264 L 308 320 L 120 320 Z" fill="#26634C" />
      <path d="M 392 276 Q 464 238 560 272 L 560 320 L 392 320 Z" fill="#85A27D" opacity="0.72" />
      <!-- 起：近坡孤舟 -->
      <path d="M 0 286 Q 94 264 186 306 L 186 370 L 0 370 Z" fill="#00352E" />
      <rect x="0" y="314" width="560" height="56" fill="#1C5D47" opacity="0.75" />
      <path d="M 96 306 L 140 306 L 130 315 L 104 315 Z" fill="#FABA40" />
      <!-- 合：远水平波 -->
      <rect x="434" y="328" width="76" height="4" rx="2" fill="#F6E2B5" opacity="0.75" />
      <rect x="452" y="340" width="44" height="4" rx="2" fill="#F6E2B5" opacity="0.6" />
    `,
  },
  poster: {
    steps: [
      {
        x: 112,
        y: 86,
        title: "起：左上细眉与单点金印",
        body: "海报左上只放一行克制的演出日期与一枚小金圆，周围留白干干净净，先把眼光定住。",
      },
      {
        x: 210,
        y: 170,
        title: "承：曲目单竖栏顺势铺陈",
        body: "细密有序的曲目与乐手名单构成中段纹理，让读者读出信息量与雅集气质。",
      },
      {
        x: 376,
        y: 162,
        title: "转：破框大字与金弦斜切",
        body: "右侧骤然出现巨大竖标题与一道斜贯画面的金弦弧线，打破平稳网格，把视觉冲击拉到顶。",
      },
      {
        x: 454,
        y: 306,
        title: "合：右下留白与静落票务码",
        body: "大字之下刻意空出一整块深绿留白，仅在右下角安稳收束地点与时间，看完心里沉静清楚。",
      },
    ],
    art: `
      <rect width="560" height="370" fill="#014038" />
      <rect x="20" y="20" width="520" height="330" fill="none" stroke="#396554" stroke-width="1.5" />
      <!-- 起 -->
      <circle cx="88" cy="84" r="14" fill="#FABA40" />
      <rect x="114" y="76" width="84" height="7" rx="3" fill="#F6E2B5" />
      <rect x="114" y="90" width="56" height="5" rx="2.5" fill="#85A27D" />
      <!-- 承 -->
      <rect x="76" y="148" width="152" height="7" rx="3" fill="#DAE7DE" opacity="0.82" />
      <rect x="76" y="166" width="136" height="7" rx="3" fill="#DAE7DE" opacity="0.7" />
      <rect x="76" y="184" width="144" height="7" rx="3" fill="#DAE7DE" opacity="0.7" />
      <rect x="76" y="202" width="110" height="7" rx="3" fill="#DAE7DE" opacity="0.6" />
      <!-- 转 -->
      <path d="M 250 280 Q 340 160 510 62" fill="none" stroke="#FABA40" stroke-width="4" />
      <rect x="318" y="88" width="116" height="136" rx="8" fill="#F6E2B5" />
      <text x="376" y="176" text-anchor="middle" fill="#014038" font-size="52" font-family="ZCOOL XiaoWei, Noto Serif SC, serif">秋声</text>
      <!-- 合 -->
      <rect x="394" y="294" width="104" height="8" rx="3" fill="#F6E2B5" opacity="0.85" />
      <rect x="422" y="310" width="76" height="6" rx="3" fill="#FABA40" opacity="0.85" />
    `,
  },
  web: {
    steps: [
      {
        x: 120,
        y: 86,
        title: "起：一屏一问，不堆导航广告",
        body: "网页最上方用宽裕呼吸与一句清朗主旨开篇，让访客 3 秒知道自己来到了什么故事里。",
      },
      {
        x: 240,
        y: 162,
        title: "承：双栏图文交错展开细节",
        body: "往下滚动进入工艺与数据细节，图文有节奏地交替出现，逐步建立信任与沉浸感。",
      },
      {
        x: 365,
        y: 224,
        title: "转：满幅深色对比屏反转视线",
        body: "在关键卖点或核心反转处切出全宽深色反白屏幕配核心动态演示，一下抓住注意力高潮。",
      },
      {
        x: 458,
        y: 314,
        title: "合：轻底单钮收束行动",
        body: "高潮后切回轻柔浅底，只留一句收尾金句与一个克制的行动按钮，让点击顺理成章。",
      },
    ],
    art: `
      <rect width="560" height="370" fill="#FBF7EC" />
      <!-- 浏览器顶条 -->
      <rect width="560" height="24" fill="#DCE6DE" />
      <circle cx="18" cy="12" r="4" fill="#85A27D" />
      <circle cx="32" cy="12" r="4" fill="#85A27D" />
      <!-- 起 -->
      <rect x="52" y="54" width="180" height="16" rx="4" fill="#014038" />
      <rect x="52" y="80" width="124" height="8" rx="3" fill="#85A27D" />
      <!-- 承 -->
      <rect x="52" y="128" width="212" height="58" rx="6" fill="#E6EFE8" stroke="#BDD0C4" />
      <rect x="284" y="128" width="224" height="58" rx="6" fill="#E6EFE8" stroke="#BDD0C4" />
      <!-- 转：全宽深色反转屏 -->
      <rect x="24" y="202" width="512" height="72" rx="8" fill="#014038" />
      <circle cx="366" cy="238" r="22" fill="#FABA40" />
      <rect x="56" y="224" width="180" height="12" rx="4" fill="#F6E2B5" />
      <rect x="56" y="244" width="130" height="8" rx="3" fill="#85A27D" />
      <!-- 合 -->
      <rect x="190" y="302" width="180" height="10" rx="4" fill="#0F2A25" opacity="0.7" />
      <rect x="404" y="298" width="102" height="28" rx="6" fill="#FABA40" />
    `,
  },
};

let sfWork = "landscape";
let sfStep = 0;
let sfShowTrace = true;
const sfSvg = document.getElementById("sf-svg");
const sfDetailTitle = document.getElementById("sf-detail-title");
const sfDetailBody = document.getElementById("sf-detail-body");

function renderSingleFrame() {
  const data = SF_WORKS[sfWork];
  const pts = data.steps;
  let overlay = "";
  if (sfShowTrace) {
    const d = `M ${pts[0].x} ${pts[0].y} Q ${(pts[0].x + pts[1].x) / 2 - 20} ${(pts[0].y + pts[1].y) / 2} ${pts[1].x} ${pts[1].y} T ${pts[2].x} ${pts[2].y} Q ${(pts[2].x + pts[3].x) / 2 + 24} ${(pts[2].y + pts[3].y) / 2 - 18} ${pts[3].x} ${pts[3].y}`;
    overlay += `<path d="${d}" fill="none" stroke="#FFCB41" stroke-width="3" stroke-dasharray="7 5" />`;
    overlay += pts
      .map((p, i) => {
        const active = i === sfStep;
        return `
          <g class="sf-hotspot" data-hit="${i}" style="cursor:pointer">
            ${active ? `<circle cx="${p.x}" cy="${p.y}" r="22" fill="rgba(255,203,65,0.28)" stroke="#FFCB41" stroke-width="2" />` : ""}
            <circle cx="${p.x}" cy="${p.y}" r="14" fill="${active ? "#FFCB41" : "#014038"}" stroke="#F7E5BB" stroke-width="2" />
            <text x="${p.x}" y="${p.y + 4.5}" text-anchor="middle" fill="${active ? "#00352E" : "#F7E5BB"}" font-size="13" font-weight="700" font-family="Noto Serif SC, serif">${PHASES[i].zh}</text>
          </g>`;
      })
      .join("");
  }

  sfSvg.innerHTML = `${data.art}${overlay}`;
  sfDetailTitle.textContent = pts[sfStep].title;
  sfDetailBody.textContent = pts[sfStep].body;

  sfSvg.querySelectorAll("[data-hit]").forEach((g) => {
    g.addEventListener("click", () => {
      sfStep = Number(g.dataset.hit);
      syncSfButtons();
      renderSingleFrame();
    });
  });
}

function syncSfButtons() {
  document.querySelectorAll(".sf-step").forEach((b, i) => b.classList.toggle("is-active", i === sfStep));
}

document.querySelectorAll(".sf-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    sfWork = btn.dataset.sfWork;
    document.querySelectorAll(".sf-tab").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-selected", String(a));
    });
    renderSingleFrame();
  });
});

document.querySelectorAll(".sf-step").forEach((btn) => {
  btn.addEventListener("click", () => {
    sfStep = Number(btn.dataset.sfStep);
    sfShowTrace = true;
    const tog = document.getElementById("sf-trace-toggle");
    tog.setAttribute("aria-pressed", "true");
    tog.classList.add("is-on");
    tog.textContent = "隐形动线：显示";
    syncSfButtons();
    renderSingleFrame();
  });
});

document.getElementById("sf-trace-toggle").addEventListener("click", (e) => {
  sfShowTrace = !sfShowTrace;
  e.currentTarget.setAttribute("aria-pressed", String(sfShowTrace));
  e.currentTarget.classList.toggle("is-on", sfShowTrace);
  e.currentTarget.textContent = sfShowTrace ? "隐形动线：显示" : "隐形动线：隐藏";
  renderSingleFrame();
});
renderSingleFrame();

/* ==================== 04 节：四代媒介对照翻阅栏 ==================== */
const ERAS = {
  poetry: {
    title: "元代诗论定名：「起要平直，承要春容，转要变化，合要渊永」",
    source: "元·范梈（1272–1330）《木天禁语》与诗法 · 元·杨载《诗法家数》",
    desc: "唐宋近体诗已有成熟的四段谋篇习惯，到了元代才被系统提炼成「起承转合」四字口诀。杨载《诗法家数》把「起承转合」立为律诗要法，强调起句高远、承句稳健、转折不着力、首尾相应；范梈更以十六字概括四拍分寸，成为后来文章、书画与版面章法的总纲。",
    four: [
      { k: "起", sub: "平直高远", text: "第一联直入题意、定下景别与基调，不故弄玄虚。" },
      { k: "承", sub: "春容稳健", text: "第二联从容铺开物象与细节，把首句的气脉撑饱满。" },
      { k: "转", sub: "变化开阖", text: "第三联忽然转换视角或情绪，破开前两联的平稳惯性。" },
      { k: "合", sub: "渊永不着迹", text: "尾联轻轻收束全篇，让言外之意在句尾之后继续回荡。" },
    ],
  },
  fuchun: {
    title: "六米长卷的物理时间：《富春山居图》的展卷呼吸",
    source: "元·黄公望（1347–1350，台北故宫博物院藏无用师卷，横 636.9 厘米）",
    desc: "中国传统手卷从右向左一臂一臂缓缓打开，观者双手的动作直接把空间画卷变成时间体验。黄公望自至正七年（1347）起笔、至正十年（1350）完成的《富春山居图（无用师卷）》横逾六米，整卷山势正是典型的平缓起势、连绵铺陈、高峰骤转、平沙收尾。",
    four: [
      { k: "起", sub: "平坡疏林", text: "展卷伊始先见低缓坡岸与疏落林木，让眼睛安稳步入江南水岸。" },
      { k: "承", sub: "沙洲村舍", text: "山麓与渔村、溪桥渐次展开，笔墨疏密交替、层层递进。" },
      { k: "转", sub: "主峰奇耸", text: "中后段骤然拔起全卷最高主峰与陡峭崖谷，墨色最浓、势态最紧。" },
      { k: "合", sub: "远汀烟水", text: "主峰之后山势放平，以大片留白水面与远山淡墨收尾，意境悠长。" },
    ],
  },
  treatise: {
    title: "画理通文理，流向东亚四格叙事",
    source: "清·沈宗骞《芥舟学画编》（1781） · 日本江户汉诗（赖山阳，1780–1832）与四格漫画",
    desc: "乾隆四十六年（1781），沈宗骞在《芥舟学画编》中直白点出山水画大章法「如行文之有起结也」，中间虚实、承接、发挥、隐匿一一合法。同源的「起承転結（Kishōtenketsu）」在东亚流传至日本江户汉诗与近代四格漫画（四コマ），走出一条不必依赖正反派搏斗、靠意外转折与回味打动人的无冲突叙事路子。",
    four: [
      { k: "起", sub: "安立场景", text: "第一格交代人物与寻常处境，零冲突，让读者轻松进入。" },
      { k: "承", sub: "顺势推进", text: "第二格沿既定方向补充细节，巩固读者对当下情境的预期。" },
      { k: "转", sub: "意外切入", text: "第三格突然换入看似无关的新视角或反转，制造惊喜张力。" },
      { k: "合", sub: "恍然收束", text: "第四格把第三格的意外与前两格悄然扣合，留下笑意或余韵。" },
    ],
  },
  game: {
    title: "零文字教学：把「起承转合」做成交互关卡节奏",
    source: "任天堂导演林田宏一（Koichi Hayashida），2012 年 GDC 与 Game Developer 访谈",
    desc: "2012 年，《超级马力欧 3D 乐园》导演林田宏一公开谈到团队受宫本茂四格漫画思维启发，将「起承转合」作为单个关卡的编排骨架：不弹冗长教程框，只用四段递进的空间布置让玩家自己学会、惊叹并收官。这与交互长页和图文排版的认知节奏完全同构。",
    four: [
      { k: "起", sub: "安全初遇", text: "在毫无惩罚的开阔处放一个新机关，一眼看懂、一试就会。" },
      { k: "承", sub: "组合练习", text: "把刚学会的机关放进稍复杂的地形里，自然熟练掌握。" },
      { k: "转", sub: "出其不意", text: "突然改变机关方向、速度或叠入新变量，打出整关最高潮。" },
      { k: "合", sub: "爽快收官", text: "用一次干脆利落的收尾动作跃向终点旗杆，给玩家圆满回响。" },
    ],
  },
};

function renderEra(key) {
  const e = ERAS[key];
  document.getElementById("era-title").textContent = e.title;
  document.getElementById("era-source").textContent = e.source;
  document.getElementById("era-desc").textContent = e.desc;
  document.getElementById("era-four-grid").innerHTML = e.four
    .map(
      (item) => `
      <div class="era-step-card">
        <div class="era-step-head"><strong>${item.k}</strong><span>${item.sub}</span></div>
        <p>${item.text}</p>
      </div>`
    )
    .join("");
}

document.querySelectorAll(".era-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".era-tab").forEach((b) => {
      const a = b === btn;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-selected", String(a));
    });
    renderEra(btn.dataset.era);
  });
});
renderEra("poetry");

/* ==================== 05 节：场景适用性诊判卡 ==================== */
const SCENARIOS = [
  {
    answer: "avoid",
    okText: "判断准确：应急导视必须一秒直给。如果先把箭头藏在「起」的留白后、等第 3 拍再给出口，危急时刻会直接耽误逃生。",
    badText: "这里别硬套四拍！紧急警示没有 10 秒阅读耐心，第一眼就必须把最高对比度指令直给到位，不能铺陈转折。",
  },
  {
    answer: "use",
    okText: "判断准确：这正是起承转合的拿手主场。清晨雾山留白起笔 → 采青工序铺陈 → 杀青烈火转折高潮 → 静盏清茶留余韵再放预约钮。",
    badText: "其实这里很适合用起承转合！品牌故事长图需要情绪沉浸，若第一屏就塞满促销与参数，反而失了茶山叙事的说服力。",
  },
  {
    answer: "avoid",
    okText: "判断准确：实时查询看板追求的是平权扫描与稳定坐标。强行制造高潮转折只会让旅客找不到自己那趟航班。",
    badText: "这里别用起承转合！表格与监控屏需要每一行规整等权，视觉剧烈起伏会直接干扰信息检索效率。",
  },
  {
    answer: "avoid",
    okText: "判断准确：方寸图标与极简名片没有空间走四步，强拆四段只会支离破碎，用好留白、疏密或主宾对比就够了。",
    badText: "这里篇幅太短装不下四折！把 32 像素图标或名片硬做成起承转合，只会塞成一团看不清的杂点。",
  },
];

document.querySelectorAll(".scenario-card").forEach((card) => {
  const idx = Number(card.dataset.sc);
  const info = SCENARIOS[idx];
  const resBox = card.querySelector(".sc-result");
  card.querySelectorAll(".vote-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      card.querySelectorAll(".vote-btn").forEach((b) => b.classList.toggle("is-picked", b === btn));
      const right = btn.dataset.vote === info.answer;
      resBox.hidden = false;
      resBox.className = `sc-result ${right ? "is-right" : "is-wrong"}`;
      resBox.textContent = right ? info.okText : info.badText;
    });
  });
});

/* ==================== 06 节：四选一小练习（只差四段密度分配一个变量） ==================== */
const QUIZ_DATA = {
  A: {
    dens: [0.48, 0.52, 0.55, 0.50],
    tag: "四段平温",
    reason: "方案 A（48% → 52% → 55% → 50%）：看起来工整对称，但四段视觉分量几乎拉平，缺少入口留白与高潮跃升，读完没有记忆点。",
  },
  B: {
    dens: [0.88, 0.62, 0.44, 0.25],
    tag: "高开低走",
    reason: "方案 B（88% → 62% → 44% → 25%）：首段就把浪势与重墨全倒出来，后面三段一路下滑泄气，变成先炸后平。",
  },
  C: {
    dens: [0.20, 0.48, 0.88, 0.24],
    tag: "最佳四拍",
    reason: "方案 C（20% → 48% → 88% → 24%）：第一段清疏留白引目，第二段层次铺开，第三段陡起视觉高潮，末段回落平水落印留余韵，完整成立。",
  },
  D: {
    dens: [0.20, 0.48, 0.86, 0.78],
    tag: "有转无合",
    reason: "方案 D（20% → 48% → 86% → 78%）：最容易混淆的干扰项——前三拍节奏都对，唯独第四段塞满重墨元素与密文，高潮之后收不住、失了余韵。",
  },
};

function drawQuizThumb(optKey, reveal) {
  const svg = document.getElementById(`quiz-svg-${optKey}`);
  const dens = QUIZ_DATA[optKey].dens;
  const bandH = 62;
  const gap = 10;
  const startY = 16;

  const bands = dens
    .map((d, i) => {
      const y = startY + i * (bandH + gap);
      const isHeavy = d >= 0.72;
      const isMid = d >= 0.38 && d < 0.72;
      const bg = isHeavy ? "#05332C" : "#014038";
      let content = "";
      if (d < 0.36) {
        // 清疏留白段（静月/平水）
        content = `
          <circle cx="${i === 3 ? 110 : 52}" cy="${y + 24}" r="${i === 3 ? 11 : 7}" fill="#FABA40" />
          <rect x="44" y="${y + 44}" width="${i === 3 ? 132 : 84}" height="4" rx="2" fill="#F6E2B5" opacity="0.72" />
        `;
      } else if (isMid) {
        // 中密铺陈段
        content = `
          <path d="M 24 ${y + 48} Q 74 ${y + 18} 126 ${y + 44} T 196 ${y + 38} L 196 ${y + 56} L 24 ${y + 56} Z" fill="#26634C" />
          <rect x="34" y="${y + 14}" width="92" height="5" rx="2.5" fill="#F6E2B5" opacity="0.82" />
          <rect x="34" y="${y + 25}" width="68" height="4" rx="2" fill="#85A27D" />
          <circle cx="166" cy="${y + 20}" r="8" fill="#FABA40" />
        `;
      } else {
        // 高密强张力段
        content = `
          <path d="M 20 ${y + 50} C 56 ${y + 6}, 104 ${y + 4}, 122 ${y + 30} C 142 ${y + 52}, 172 ${y + 12}, 200 ${y + 28} L 200 ${y + 58} L 20 ${y + 58} Z" fill="#1C5D47" />
          <polygon points="30,${y + 42} 102,${y + 10} 188,${y + 46}" fill="#FABA40" opacity="0.88" />
          <rect x="32" y="${y + 12}" width="128" height="7" rx="3" fill="#F7E5BB" />
          <rect x="32" y="${y + 24}" width="152" height="5" rx="2.5" fill="#F7E5BB" opacity="0.78" />
        `;
      }
      return `
        <g>
          <rect x="14" y="${y}" width="192" height="${bandH}" rx="7" fill="${bg}" stroke="#396554" stroke-width="1" />
          ${content}
          ${reveal ? `<text x="198" y="${y + 16}" text-anchor="end" fill="#FFCB41" font-size="11" font-family="DM Mono, monospace">${Math.round(d * 100)}%</text>` : ""}
        </g>`;
    })
    .join("");

  let curveOverlay = "";
  if (reveal) {
    const pts = dens.map((d, i) => ({
      x: 24 + d * 158,
      y: startY + i * (bandH + gap) + bandH / 2,
    }));
    const dStr = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} L ${pts[3].x} ${pts[3].y}`;
    curveOverlay = `
      <path d="${dStr}" fill="none" stroke="${optKey === "C" ? "#6EE0B8" : "#FF8E72"}" stroke-width="2.5" stroke-dasharray="4 3" />
      ${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${optKey === "C" ? "#6EE0B8" : "#FF8E72"}" />`).join("")}
    `;
  }

  svg.innerHTML = `<rect width="220" height="310" rx="8" fill="#00352E" />${bands}${curveOverlay}`;
}

["A", "B", "C", "D"].forEach((k) => drawQuizThumb(k, false));

const quizFeedback = document.getElementById("quiz-feedback");
const qfTitle = document.getElementById("qf-title");
const qfSummary = document.getElementById("qf-summary");
const qfList = document.getElementById("qf-list");

document.querySelectorAll(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const picked = btn.dataset.opt;
    const isRight = picked === "C";
    ["A", "B", "C", "D"].forEach((k) => {
      drawQuizThumb(k, true);
      const optBtn = document.querySelector(`.quiz-opt[data-opt="${k}"]`);
      const tag = document.querySelector(`[data-qtag="${k}"]`);
      optBtn.classList.toggle("is-correct", k === "C");
      optBtn.classList.toggle("is-wrong", k === picked && k !== "C");
      tag.textContent = QUIZ_DATA[k].tag;
    });

    quizFeedback.hidden = false;
    qfTitle.textContent = isRight
      ? "选对了！方案 C 走出完整的慢起—铺陈—骤转—归静弧线"
      : `你选了方案 ${picked}（${QUIZ_DATA[picked].tag}），正确答案是方案 C`;
    qfSummary.textContent = QUIZ_DATA[picked].reason;
    qfList.innerHTML = ["A", "B", "C", "D"].map((k) => `<li>${QUIZ_DATA[k].reason}</li>`).join("");
  });
});

document.getElementById("quiz-retry").addEventListener("click", () => {
  quizFeedback.hidden = true;
  ["A", "B", "C", "D"].forEach((k) => {
    drawQuizThumb(k, false);
    const optBtn = document.querySelector(`.quiz-opt[data-opt="${k}"]`);
    optBtn.classList.remove("is-correct", "is-wrong");
    document.querySelector(`[data-qtag="${k}"]`).textContent = "";
  });
});

/* ==================== 07 节：原海报灯箱（复用 #poster.src，可缩放拖动 + Esc 关闭） ==================== */
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbZoomLabel = document.getElementById("lb-zoom");
const posterImg = document.getElementById("poster");
let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function updateLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomLabel.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1.2;
  lbTx = 0;
  lbTy = 0;
  updateLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 0.7, 3.2);
  updateLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 0.7, 3.2);
  updateLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  updateLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  lbDragging = true;
  lbStartX = e.clientX - lbTx;
  lbStartY = e.clientY - lbTy;
  try {
    lbViewport.setPointerCapture(e.pointerId);
  } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbTx = e.clientX - lbStartX;
  lbTy = e.clientY - lbStartY;
  updateLbTransform();
});
lbViewport.addEventListener("pointerup", () => {
  lbDragging = false;
});
lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.2);
    updateLbTransform();
  },
  { passive: false }
);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
