// 120 共同区域原则 · 入口主控
import { createInitialState, PRESETS, makeZeroOffsets } from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import { mountSections } from "./sections.js";

const state = createInitialState();

// DOM 缓存
const canvas = document.getElementById("hero-canvas");
const titleDemo = document.getElementById("title-demo");
const topStatus = document.getElementById("top-status");

// 右侧原海报三条虚线折箭实时注脚
const calloutEls = [0, 1, 2].map((i) => ({
  box: document.getElementById(`callout-${i}`),
  zh: document.getElementById(`callout-zh-${i}`),
  dot: document.getElementById(`callout-dot-${i}`),
}));

// 底栏 4 格原海报标本（边界 / 区域 / 归属 / 分组）
const specEls = {
  boundary: { card: document.getElementById("spec-boundary"), tag: document.getElementById("spec-boundary-tag") },
  region: { card: document.getElementById("spec-region"), tag: document.getElementById("spec-region-tag") },
  belonging: { card: document.getElementById("spec-belonging"), tag: document.getElementById("spec-belonging-tag") },
  grouping: { card: document.getElementById("spec-grouping"), tag: document.getElementById("spec-grouping-tag") },
};

// 底栏右下圆角细黑框 ✓ 诊单卡
const diagCard = document.getElementById("diag-card");
const diagIcon = document.getElementById("diag-icon");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const diagMetrics = document.getElementById("diag-metrics");

// 控件
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const regionBtns = [...document.querySelectorAll("[data-region-mode]")];
const colorBtns = [...document.querySelectorAll("[data-color-mode]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const gapRange = document.getElementById("range-gap");
const gapOut = document.getElementById("out-gap");
const padRange = document.getElementById("range-pad");
const padOut = document.getElementById("out-pad");
const ratioRange = document.getElementById("range-ratio");
const ratioOut = document.getElementById("out-ratio");
const snapBtn = document.getElementById("btn-snap-items");

let lastSyncSig = "";

function syncUI(geom, diag) {
  // 控制状态回显
  themeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.theme === state.theme)));
  regionBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.regionMode === state.regionMode)));
  colorBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.colorMode === state.colorMode)));

  if (gapRange && Number(gapRange.value) !== state.boxGap) gapRange.value = String(state.boxGap);
  if (gapOut) gapOut.textContent = `${geom.boxGapPx}px`;
  if (padRange && Number(padRange.value) !== state.boxPad) padRange.value = String(state.boxPad);
  if (padOut) padOut.textContent = `${geom.innerClearancePx}px`;
  if (ratioRange && Math.abs(Number(ratioRange.value) - state.intraRatio) > 0.005) {
    ratioRange.value = String(state.intraRatio);
  }
  if (ratioOut) ratioOut.textContent = `${geom.actualRatio.toFixed(2)}×`;

  // 自示范标题胶囊联动当前边界风格
  if (titleDemo) titleDemo.dataset.regionMode = state.regionMode;

  // 避免静置每帧重复改写相同 DOM 文本（省电 + 保持 perf drew 干净）
  const sig = `${diag.code}|${diag.passCount}|${geom.intraDistPx}|${geom.interDistPx}|${geom.actualRatio}|${geom.boxGapPx}|${geom.innerClearancePx}|${geom.lumaDiffPct}|${state.regionMode}|${state.colorMode}|${state.theme}|${geom.countsByRegion.join(",")}|${diag.misplaced.length}`;
  if (sig === lastSyncSig) return;
  lastSyncSig = sig;

  // 顶眉实时状态章
  if (topStatus) {
    topStatus.textContent = diag.isOk ? `4/4 共同区域成立` : `${diag.passCount}/4 · ${diag.perceivedShort}`;
    topStatus.dataset.state = diag.isOk ? "ok" : "err";
  }

  // 右侧三条原海报折箭实时注脚
  diag.callouts.forEach((c, idx) => {
    const el = calloutEls[idx];
    if (!el || !el.box) return;
    el.box.dataset.ok = String(c.ok);
    el.zh.textContent = c.zh;
    if (el.dot) el.dot.dataset.ok = String(c.ok);
  });

  // 底栏 4 格原海报实时标本
  for (const key of ["boundary", "region", "belonging", "grouping"]) {
    const ck = diag.checks[key];
    const el = specEls[key];
    if (!el || !el.card) continue;
    el.card.dataset.ok = String(ck.ok);
    el.tag.textContent = ck.tag;
  }

  // 底栏右下圆角细黑框 ✓ 诊单卡
  if (diagCard) {
    diagCard.dataset.ok = String(diag.isOk);
    diagIcon.textContent = diag.isOk ? "✓" : "!";
    diagBadge.textContent = diag.badge;
    diagTitle.textContent = diag.headline;
    diagBody.textContent = diag.body;
    diagHint.textContent = diag.hint;
    diagMetrics.textContent = `组内 ${geom.intraDistPx}px · 跨区 ${geom.interDistPx}px (${geom.actualRatio.toFixed(2)}×) · 底差 ${geom.lumaDiffPct}% · 感知：${diag.perceivedShort}`;
  }

  if (snapBtn) {
    const hasOff = diag.misplaced.length > 0;
    snapBtn.disabled = !hasOff;
    snapBtn.textContent = hasOff ? `归位 ${diag.misplaced.length} 枚错界元素` : "9/9 均已归位";
  }
}

function mutateState(fn) {
  fn(state);
}

const hero = mountHeroCanvas(canvas, () => state, mutateState, syncUI);

// 绑定所有原生控件
themeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    hero.draw();
  });
});

regionBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.regionMode = b.dataset.regionMode;
    hero.draw();
  });
});

colorBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.colorMode = b.dataset.colorMode;
    hero.draw();
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const fn = PRESETS[b.dataset.preset];
    if (!fn) return;
    const next = fn();
    Object.assign(state, next, { theme: b.dataset.preset === "poster" ? "poster" : state.theme });
    hero.draw();
  });
});

if (ratioRange) {
  ratioRange.addEventListener("input", () => {
    state.intraRatio = Number(ratioRange.value);
    hero.draw();
  });
}
if (gapRange) {
  gapRange.addEventListener("input", () => {
    state.boxGap = Number(gapRange.value);
    hero.draw();
  });
}
if (padRange) {
  padRange.addEventListener("input", () => {
    state.boxPad = Number(padRange.value);
    hero.draw();
  });
}
if (snapBtn) {
  snapBtn.addEventListener("click", () => {
    state.offsets = makeZeroOffsets();
    hero.draw();
  });
}

// 挂载正文 01–07 节
mountSections();

// 轻量滚入显现（不阻塞 check.mjs，reduced-motion 下直接可见）
const reveals = [...document.querySelectorAll(".reveal")];
if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px -24px 0px" });
  reveals.forEach((el) => io.observe(el));
}

// 首次立即绘制，确保第一帧立即可读
hero.draw();
