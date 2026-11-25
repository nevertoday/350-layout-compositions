// 209 响应式网格 — 页面主入口（单真源模型 ↔ 三屏跃迁画布 ↔ 原海报核心原理与胶囊同步）

import { INITIAL_STATE, PRESETS, applyFixAction, clampState, evaluateAll } from "./model.js";
import { createHeroStage } from "./stage-canvas.js";
import { initSections } from "./sections.js";

let state = clampState(INITIAL_STATE);

// 预先生成原海报右上角 6×5 活体网格徽与移动端 3×3 微型网格徽
const posterMatrix = document.getElementById("poster-matrix");
for (let i = 0; i < 30; i++) posterMatrix.append(document.createElement("span"));
const miniGrid = document.getElementById("mini-grid-emblem");
for (let i = 0; i < 9; i++) miniGrid.append(document.createElement("span"));

const els = {
  statusPill: document.getElementById("hero-status-pill"),
  colRibbon: document.getElementById("live-col-ribbon"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagFixBar: document.getElementById("diag-fix-bar"),
  diagFixNote: document.getElementById("diag-fix-note"),
  btnQuickFix: document.getElementById("btn-quick-fix"),
  mDesktop: document.getElementById("m-desktop"),
  mTablet: document.getElementById("m-tablet"),
  mMobile: document.getElementById("m-mobile"),
  mChars: document.getElementById("m-chars"),
  valColsDesktop: document.getElementById("val-cols-desktop"),
  valColsTablet: document.getElementById("val-cols-tablet"),
  valColsMobile: document.getElementById("val-cols-mobile"),
  btnHeroLayout: document.getElementById("btn-hero-layout"),
  btnHierarchy: document.getElementById("btn-hierarchy-order"),
  rangeBp1: document.getElementById("range-bp1"),
  rangeBp2: document.getElementById("range-bp2"),
  valBp1: document.getElementById("val-bp1"),
  valBp2: document.getElementById("val-bp2"),
  liveCss: document.getElementById("live-css"),
  tipDevices: [...document.querySelectorAll("#tip-devices .dev-ico")],
  themeBtns: [...document.querySelectorAll("[data-theme]")],
  modeBtns: [...document.querySelectorAll("[data-mode]")],
};

let currentFixAction = "";

function setState(patch) {
  state = clampState({ ...state, ...patch });
  syncUI();
  heroStage.invalidate();
}

function handleFix(action) {
  state = applyFixAction(state, action);
  syncUI();
  heroStage.invalidate();
}

function formatDeviceMetric(dev) {
  if (dev.overflowPx > 0) return { text: `溢 +${dev.overflowPx}px`, cls: "is-bad" };
  if (dev.scale < 0.99) return { text: `缩 ${dev.effectiveFontPx}px`, cls: "is-bad" };
  if (!dev.ok) return { text: dev.issues[0].short, cls: "is-bad" };
  return { text: `${dev.activeCols}列 · ${dev.cardWidth}px`, cls: "is-good" };
}

function syncUI() {
  const res = evaluateAll(state);
  const { devices, live, principles } = res;

  // 顶栏状态章
  els.statusPill.textContent = res.summaryBadge;
  els.statusPill.classList.toggle("is-ok", res.allValid);

  // 自示范大标下方的活体列数条（随当前实时视口列数变化）
  els.colRibbon.style.gridTemplateColumns = `repeat(${live.activeCols}, 1fr)`;
  els.colRibbon.classList.toggle("is-bad", !live.ok);
  if (els.colRibbon.childElementCount !== live.activeCols) {
    els.colRibbon.innerHTML = Array.from({ length: live.activeCols }, () => "<span></span>").join("");
  }

  // 右上角 6×5 原海报网格徽：随实时档位点亮对应列宽节奏
  const litCols = live.tier === "desktop" ? 6 : live.tier === "tablet" ? 4 : 2;
  [...posterMatrix.children].forEach((cell, idx) => {
    const col = idx % 6;
    const row = Math.floor(idx / 6);
    cell.classList.toggle("is-lit", col < litCols && row === 0);
  });
  [...miniGrid.children].forEach((cell, idx) => {
    cell.classList.toggle("is-on", idx < live.activeCols);
  });

  // 三端体检诊单
  els.diagBadge.textContent = res.summaryBadge;
  els.diagBadge.classList.toggle("is-ok", res.allValid);
  els.diagTitle.textContent = res.summaryTitle;
  els.diagWhy.textContent = res.summaryWhy;

  currentFixAction = res.fixAction;
  els.diagFixBar.classList.toggle("is-done", res.allValid);
  if (res.allValid) {
    els.diagFixNote.textContent = "三端网格重排成立：可继续拖动 BP1 / BP2 切刀或切换其他多组合法解，观察不同风格断点。";
    els.btnQuickFix.hidden = true;
  } else {
    els.diagFixNote.textContent = "可直接点旁边一键纠偏，或自己在画布上横拖断点切刀与调整列数排查。";
    els.btnQuickFix.textContent = res.fixLabel || "一键校准至原海报解";
    els.btnQuickFix.hidden = false;
  }

  // 四格单真源实测读数
  const md = formatDeviceMetric(devices.desktop);
  const mt = formatDeviceMetric(devices.tablet);
  const mm = formatDeviceMetric(devices.mobile);
  els.mDesktop.textContent = md.text;
  els.mDesktop.className = `metric-v ${md.cls}`;
  els.mTablet.textContent = mt.text;
  els.mTablet.className = `metric-v ${mt.cls}`;
  els.mMobile.textContent = mm.text;
  els.mMobile.className = `metric-v ${mm.cls}`;
  els.mChars.textContent = `示意 ${live.estHeroChars} 字`;
  els.mChars.className = `metric-v ${live.estHeroChars > 46 || live.estHeroChars < 8 ? "is-bad" : "is-good"}`;

  // 控台按钮与滑轨
  els.modeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === state.adaptMode));
  els.themeBtns.forEach((b) => {
    const active = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  els.valColsDesktop.textContent = String(state.colsDesktop);
  els.valColsTablet.textContent = String(state.colsTablet);
  els.valColsMobile.textContent = String(state.colsMobile);

  els.btnHeroLayout.textContent = state.heroMobileLayout === "stack" ? "头图：小屏堆叠" : "头图：左右硬拼";
  els.btnHeroLayout.classList.toggle("is-active", state.heroMobileLayout === "stack");
  els.btnHeroLayout.classList.toggle("is-danger", state.heroMobileLayout === "side" && state.adaptMode === "fluid");

  els.btnHierarchy.textContent = state.hierarchyOrder === "hero-first" ? "次序：主角居首" : "次序：四卡压顶";
  els.btnHierarchy.classList.toggle("is-active", state.hierarchyOrder === "hero-first");
  els.btnHierarchy.classList.toggle("is-danger", state.hierarchyOrder === "cards-first");

  els.rangeBp1.value = String(state.bp1);
  els.rangeBp2.value = String(state.bp2);
  els.valBp1.textContent = `${state.bp1}px`;
  els.valBp2.textContent = `${state.bp2}px`;

  els.liveCss.textContent = res.liveCss;

  // 原海报四项核心原理实时状态灯
  for (const key of ["breakpoints", "reflow", "adapt", "hierarchy"]) {
    const card = document.getElementById(`p-${key}`);
    const tag = document.getElementById(`ptag-${key}`);
    const p = principles[key];
    card.classList.toggle("is-ok", p.ok);
    tag.textContent = p.tag;
  }

  // 底沿纯黑胶囊三端设备亮灯（与画布聚焦机身严格一致）
  const activeDev = state.viewportWidth >= 1060 ? "desktop" : state.viewportWidth >= 640 ? "tablet" : "mobile";
  els.tipDevices.forEach((ico) => {
    ico.classList.toggle("is-active", ico.dataset.dev === activeDev);
  });
}

// 绑定事件
const heroStage = createHeroStage(
  document.getElementById("hero-canvas"),
  () => state,
  (patch) => setState(patch),
  (action) => handleFix(action)
);

els.btnQuickFix.addEventListener("click", () => handleFix(currentFixAction));

els.themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => setState({ theme: btn.dataset.theme }));
});

els.modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    if (mode === "fluid" && state.bp1 < 400) {
      setState({ adaptMode: "fluid", bp1: 768, bp2: 1280 });
    } else {
      setState({ adaptMode: mode });
    }
  });
});

document.querySelectorAll("[data-col-step]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [slot, deltaStr] = btn.dataset.colStep.split(":");
    const delta = Number(deltaStr);
    const key = slot === "desktop" ? "colsDesktop" : slot === "tablet" ? "colsTablet" : "colsMobile";
    setState({ adaptMode: "fluid", [key]: state[key] + delta });
  });
});

els.btnHeroLayout.addEventListener("click", () => {
  setState({ heroMobileLayout: state.heroMobileLayout === "stack" ? "side" : "stack" });
});

els.btnHierarchy.addEventListener("click", () => {
  setState({ hierarchyOrder: state.hierarchyOrder === "hero-first" ? "cards-first" : "hero-first" });
});

els.rangeBp1.addEventListener("input", () => {
  setState({ adaptMode: "fluid", bp1: Number(els.rangeBp1.value) });
});
els.rangeBp2.addEventListener("input", () => {
  setState({ adaptMode: "fluid", bp2: Number(els.rangeBp2.value) });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (preset) setState(preset.patch);
  });
});

syncUI();
initSections();
