// 053 向心式构图 · 主入口与单真源 UI 同步（main.js）
import {
  PRESETS,
  SCENARIOS,
  applyPreset,
  clamp,
  createInitialState,
  evaluate,
} from "./model.js";
import { mountHeroCanvas } from "./hero.js";
import {
  mountPosterLightbox,
  mountSection01,
  mountSection02,
  mountSection03,
  mountSection04,
  mountSection05,
  mountSection06,
} from "./sections.js";

const state = createInitialState();
const heroCanvas = document.getElementById("hero-canvas");

// DOM 引用
const statusChips = [...document.querySelectorAll("[data-status-chip]")];
const scenarioBtns = [...document.querySelectorAll("[data-scenario]")];
const pulseBtns = [...document.querySelectorAll("[data-pulse]")];
const fixBtns = [...document.querySelectorAll("[data-fix-classic]")];
const resetBtns = [...document.querySelectorAll("[data-reset-broken]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const guideBtn = document.getElementById("btn-guides");
const clearNoiseBtn = document.getElementById("btn-clear-noise");
const fixRebelsBtn = document.getElementById("btn-fix-rebels");

// 滑轨与数值读数
const skewRange = document.getElementById("range-skew");
const skewQuick = document.getElementById("range-skew-quick");
const skewVals = [...document.querySelectorAll("[data-val-skew]")];
const ringRange = document.getElementById("range-ring");
const ringVal = document.getElementById("val-ring");
const noiseRange = document.getElementById("range-noise");
const noiseVal = document.getElementById("val-noise");

// 诊断文本
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagNext = document.getElementById("diag-next");
const diagTier = document.getElementById("diag-tier");
const quickHeadline = document.getElementById("quick-headline");
const mobileQuick = document.getElementById("mobile-quick");
const diagBox = document.getElementById("diag-box");

// 底部原海报四关键词实时探针
const kwNodes = {
  convergence: {
    card: document.getElementById("kw-convergence"),
    badge: document.getElementById("kw-convergence-badge"),
  },
  focus: {
    card: document.getElementById("kw-focus"),
    badge: document.getElementById("kw-focus-badge"),
  },
  gathering: {
    card: document.getElementById("kw-gathering"),
    badge: document.getElementById("kw-gathering-badge"),
  },
  stability: {
    card: document.getElementById("kw-stability"),
    badge: document.getElementById("kw-stability-badge"),
  },
};

function syncUI() {
  const rect = heroCanvas.getBoundingClientRect();
  const res = evaluate(state, rect.width || 1000, rect.height || 520);
  const ok = res.passCount === 4;

  statusChips.forEach((chip) => {
    chip.textContent = res.statusChip;
    chip.classList.toggle("is-ok", ok);
    chip.classList.toggle("is-bad", !ok);
  });

  if (diagBox) {
    diagBox.classList.toggle("is-ok", ok);
    diagBox.classList.toggle("is-bad", !ok);
  }
  if (mobileQuick) {
    mobileQuick.classList.toggle("is-ok", ok);
    mobileQuick.classList.toggle("is-bad", !ok);
  }
  if (diagHeadline) diagHeadline.textContent = res.headline;
  if (diagWhy) diagWhy.textContent = res.why;
  if (diagNext) diagNext.textContent = res.nextStep;
  if (diagTier) diagTier.textContent = `向心聚力：${res.tier}（示意）`;
  if (quickHeadline) quickHeadline.textContent = res.headline;

  // 滑轨双向同步
  const skewStr = `${state.aimSkewDeg > 0 ? "+" : ""}${state.aimSkewDeg}°`;
  if (skewRange && Number(skewRange.value) !== state.aimSkewDeg) skewRange.value = String(state.aimSkewDeg);
  if (skewQuick && Number(skewQuick.value) !== state.aimSkewDeg) skewQuick.value = String(state.aimSkewDeg);
  skewVals.forEach((el) => { el.textContent = skewStr; });

  const ringPct = Math.round(state.sanctuaryRatio * 100);
  if (ringRange && Number(ringRange.value) !== ringPct) ringRange.value = String(ringPct);
  if (ringVal) ringVal.textContent = `${ringPct}%`;

  const noiseCount = state.distractors.filter(Boolean).length;
  if (noiseRange && Number(noiseRange.value) !== noiseCount) noiseRange.value = String(noiseCount);
  if (noiseVal) noiseVal.textContent = `${noiseCount} 处`;

  // 快捷修复辅键状态
  if (clearNoiseBtn) {
    clearNoiseBtn.disabled = noiseCount === 0;
    clearNoiseBtn.textContent = noiseCount === 0 ? "角落已纯净" : `清空角落杂散 (${noiseCount})`;
  }
  if (fixRebelsBtn) {
    fixRebelsBtn.disabled = res.rebelCount === 0;
    fixRebelsBtn.textContent = res.rebelCount === 0 ? "全部已向内" : `扳回外逃箭头 (${res.rebelCount})`;
  }
  if (guideBtn) {
    guideBtn.classList.toggle("is-active", state.showGuides);
    guideBtn.setAttribute("aria-pressed", String(state.showGuides));
    guideBtn.textContent = state.showGuides ? "延长线：开" : "延长线：关";
  }

  // 场景切签
  scenarioBtns.forEach((b) => {
    const active = b.dataset.scenario === state.scenarioId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  // 预设切签
  presetBtns.forEach((b) => {
    const active = b.dataset.preset === state.activePreset;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  // 底部四竖线关键词实时状态
  for (const [k, node] of Object.entries(kwNodes)) {
    const item = res.checks[k];
    if (!item || !node.card) continue;
    node.card.classList.toggle("is-ok", item.ok);
    node.card.classList.toggle("is-bad", !item.ok);
    if (node.badge) node.badge.textContent = item.badge;
  }
}

const heroCtrl = mountHeroCanvas(heroCanvas, state, () => {
  syncUI();
});

// 绑定场景切换
scenarioBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.scenarioId = b.dataset.scenario;
    syncUI();
    heroCtrl.redraw();
  });
});

// 放流检验
pulseBtns.forEach((b) => {
  b.addEventListener("click", () => {
    heroCtrl.pulse();
  });
});

// 一键校准原海报八向经典解
fixBtns.forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(state, "classic");
    syncUI();
    heroCtrl.redraw();
    heroCtrl.pulse();
  });
});

// 复原开场坏态
resetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(state, "broken");
    syncUI();
    heroCtrl.redraw();
  });
});

// 多合法解 & 双向试错预设
presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const key = b.dataset.preset;
    if (!PRESETS[key]) return;
    applyPreset(state, key);
    syncUI();
    heroCtrl.redraw();
  });
});

// 滑轨输入
function onSkewInput(val) {
  let v = clamp(Math.round(Number(val)), -36, 36);
  if (Math.abs(v) <= 1) v = 0;
  state.aimSkewDeg = v;
  state.activePreset = "custom";
  syncUI();
  heroCtrl.redraw();
}
skewRange?.addEventListener("input", (e) => onSkewInput(e.target.value));
skewQuick?.addEventListener("input", (e) => onSkewInput(e.target.value));

ringRange?.addEventListener("input", (e) => {
  let pct = clamp(Math.round(Number(e.target.value)), 8, 50);
  if (Math.abs(pct - 27) <= 1) pct = 27;
  state.sanctuaryRatio = Number((pct / 100).toFixed(3));
  state.activePreset = "custom";
  syncUI();
  heroCtrl.redraw();
});

noiseRange?.addEventListener("input", (e) => {
  const n = clamp(Math.round(Number(e.target.value)), 0, 4);
  state.distractors = [0, 1, 2, 3].map((i) => (i < n ? 1 : 0));
  state.activePreset = "custom";
  syncUI();
  heroCtrl.redraw();
});

clearNoiseBtn?.addEventListener("click", () => {
  state.distractors = [0, 0, 0, 0];
  state.activePreset = "custom";
  syncUI();
  heroCtrl.redraw();
});

fixRebelsBtn?.addEventListener("click", () => {
  state.directions = state.directions.map(() => 1);
  state.activePreset = "custom";
  syncUI();
  heroCtrl.redraw();
});

guideBtn?.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI();
  heroCtrl.redraw();
});

// 键盘操作：←/→ 调汇聚偏角，↑/↓ 调静谧环，[/] 切标本，Space 放流检验
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const modal = document.getElementById("poster-modal");
  if (modal && !modal.hidden) return;

  if (e.code === "Space") {
    // 只有当焦点不在按钮上时才拦空格避免覆盖按钮点击
    if (tag !== "BUTTON" && tag !== "A") {
      e.preventDefault();
      heroCtrl.pulse();
    }
    return;
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.shiftKey ? 5 : 2;
    state.aimSkewDeg = clamp(state.aimSkewDeg + (e.key === "ArrowRight" ? step : -step), -36, 36);
    state.activePreset = "custom";
    syncUI();
    heroCtrl.redraw();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const step = e.key === "ArrowUp" ? 0.02 : -0.02;
    state.sanctuaryRatio = Number(clamp(state.sanctuaryRatio + step, 0.08, 0.50).toFixed(3));
    state.activePreset = "custom";
    syncUI();
    heroCtrl.redraw();
  } else if (e.key === "[" || e.key === "]") {
    e.preventDefault();
    const cur = SCENARIOS.findIndex((s) => s.id === state.scenarioId);
    const next = (cur + (e.key === "]" ? 1 : -1) + SCENARIOS.length) % SCENARIOS.length;
    state.scenarioId = SCENARIOS[next].id;
    syncUI();
    heroCtrl.redraw();
  }
});

// 初始同步 + 挂载正文 7 节
syncUI();
mountSection01();
mountSection02();
mountSection03();
mountSection04();
mountSection05();
mountSection06();
mountPosterLightbox();
