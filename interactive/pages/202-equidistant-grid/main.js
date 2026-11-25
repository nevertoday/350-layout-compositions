// 202 等距网格 · 页面主入口：联动开场校样台、X×X 交叉卡尺、自示范标题与正文互动节
import { reducedMotion } from "../../lib/stage.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import { clamp, createInitialState, diagnose, PRESETS } from "./model.js";
import { initSections } from "./sections.js";

const state = createInitialState();

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const titleChars = document.getElementById("hero-title");
const titleEn = document.getElementById("hero-title-en");
const statusStamp = document.getElementById("hero-status-stamp");
const mobileStatus = document.getElementById("hero-mobile-status");

// 左侧原海报「间距单位 = X」交叉卡尺
const caliperRect = document.getElementById("caliper-rect");
const caliperV1 = document.getElementById("caliper-v1");
const caliperV2 = document.getElementById("caliper-v2");
const caliperH1 = document.getElementById("caliper-h1");
const caliperH2 = document.getElementById("caliper-h2");
const caliperGxLbl = document.getElementById("caliper-gx-lbl");
const caliperGyLbl = document.getElementById("caliper-gy-lbl");
const caliperCaption = document.getElementById("caliper-caption");

// 单真源诊断卡
const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagHead = document.getElementById("diag-head");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const mobileDiagStrip = document.getElementById("mobile-diag-strip");
const mobileDiagBadge = document.getElementById("mobile-diag-badge");
const mobileDiagHead = document.getElementById("mobile-diag-head");
const mGxGy = document.getElementById("m-gxgy");
const mScale = document.getElementById("m-scale");
const mInner = document.getElementById("m-inner");
const mTrack = document.getElementById("m-track");
const cssPreview = document.getElementById("hero-css-line");

// 控件
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const baseBtns = [...document.querySelectorAll("[data-base-x]")];
const gxSlider = document.getElementById("ctrl-gx");
const gySlider = document.getElementById("ctrl-gy");
const padSlider = document.getElementById("ctrl-pad");
const gxValEl = document.getElementById("val-gx");
const gyValEl = document.getElementById("val-gy");
const padValEl = document.getElementById("val-pad");
const lockBtn = document.getElementById("ctrl-lock");
const fixTrackBtn = document.getElementById("ctrl-fix-track");
const spanModeBtn = document.getElementById("ctrl-span-mode");
const guideBtn = document.getElementById("ctrl-guides");

// 原海报底部四特点实况章
const traitEls = {
  rhythm: document.getElementById("trait-rhythm"),
  align: document.getElementById("trait-align"),
  scale: document.getElementById("trait-scale"),
  cost: document.getElementById("trait-cost"),
};

let heroDraw = () => {};

function updateCaliper(diag) {
  // SVG 坐标系 166×112，中心 (68, 56)，右侧留足标尺文字净空
  const cx = 68;
  const cy = 56;
  const rw = Math.max(6, Math.min(54, Math.round(state.gx * 1.1)));
  const rh = Math.max(6, Math.min(48, Math.round(state.gy * 1.1)));
  const x1 = cx - rw / 2;
  const x2 = cx + rw / 2;
  const y1 = cy - rh / 2;
  const y2 = cy + rh / 2;

  caliperRect.setAttribute("x", x1);
  caliperRect.setAttribute("y", y1);
  caliperRect.setAttribute("width", rw);
  caliperRect.setAttribute("height", rh);
  caliperRect.setAttribute("fill", diag.checks.axis ? "#F3552B" : "#B31D1D");

  caliperV1.setAttribute("x1", x1);
  caliperV1.setAttribute("x2", x1);
  caliperV2.setAttribute("x1", x2);
  caliperV2.setAttribute("x2", x2);

  caliperH1.setAttribute("y1", y1);
  caliperH1.setAttribute("y2", y1);
  caliperH2.setAttribute("y1", y2);
  caliperH2.setAttribute("y2", y2);

  caliperGxLbl.textContent = `gx ${state.gx}px`;
  caliperGyLbl.textContent = `gy ${state.gy}px`;

  if (diag.checks.axis && state.gx > 0) {
    caliperCaption.innerHTML = `间距单位 = <strong class="is-ok">${state.gx}px（${diag.metrics.gxMultText}）</strong>`;
  } else {
    caliperCaption.innerHTML = `横竖不等：<strong class="is-err">${state.gx} × ${state.gy}px</strong>`;
  }
}

function updateSelfDemoTitle(diag) {
  // 标题本身就是示范：用合成层位移与字距呼应当前 gx/gy，不触发布局高度抖动
  const lsEm = clamp((state.gx - 8) * 0.0038, -0.02, 0.14);
  const shiftY = clamp(Math.round((state.gy - 16) * 0.2), -3, 5);
  titleChars.style.letterSpacing = `${lsEm.toFixed(3)}em`;
  titleEn.style.transform = `translateY(${shiftY}px)`;
  titleEn.style.letterSpacing = `${(0.14 + clamp(state.gx * 0.0035, 0, 0.16)).toFixed(3)}em`;
  titleChars.classList.toggle("is-calibrated", diag.ok);
}

function syncUI() {
  const diag = diagnose(state);
  const m = diag.metrics;

  updateSelfDemoTitle(diag);
  updateCaliper(diag);

  // 状态印章
  const stampText = diag.ok ? `4 / 4 秩序建立 · ${m.gx}px` : `${diag.passedCount} / 4 待校准`;
  statusStamp.textContent = stampText;
  statusStamp.className = `status-stamp ${diag.ok ? "is-ok" : "is-err"}`;
  if (mobileStatus) {
    mobileStatus.textContent = diag.ok ? `4/4 · ${m.gx}px` : `${diag.passedCount}/4 待校`;
    mobileStatus.className = `mobile-status ${diag.ok ? "is-ok" : "is-err"}`;
  }

  // 单真源诊单
  diagCard.classList.toggle("is-ok", diag.ok);
  diagCard.classList.toggle("is-err", !diag.ok);
  diagBadge.textContent = diag.primary.badge;
  diagHead.textContent = diag.primary.headline;
  diagWhy.textContent = diag.primary.why;
  diagAction.textContent = diag.primary.action;
  if (mobileDiagStrip) {
    mobileDiagStrip.className = `mobile-diag-strip ${diag.ok ? "is-ok" : "is-err"}`;
    mobileDiagBadge.textContent = diag.primary.badge;
    mobileDiagHead.textContent = diag.primary.headline;
  }

  mGxGy.textContent = `${m.gx} / ${m.gy}px`;
  mGxGy.className = `m-val ${diag.checks.axis ? "is-ok" : "is-err"}`;
  mScale.textContent = diag.checks.scale ? `${m.gxMultText} (X=${m.baseX})` : `${m.gxMultText} · 离标`;
  mScale.className = `m-val ${diag.checks.scale ? "is-ok" : "is-err"}`;
  mInner.textContent = `${m.innerPad}px ${diag.checks.hierarchy ? "< 外缝" : "≥ 外缝"}`;
  mInner.className = `m-val ${diag.checks.hierarchy ? "is-ok" : "is-err"}`;
  mTrack.textContent = diag.checks.track
    ? state.spanMode === "valid"
      ? "严齐 (2W+X)"
      : "12 块严齐"
    : state.driftedSlot !== -1 && state.spanMode === "bug"
      ? "偏格+漏缝"
      : state.driftedSlot !== -1
        ? "偏格 1 处"
        : "漏算 1X";
  mTrack.className = `m-val ${diag.checks.track ? "is-ok" : "is-err"}`;

  cssPreview.textContent = m.cssLine;

  // 题材按钮状态
  for (const b of themeBtns) {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }

  // 基数按钮
  for (const b of baseBtns) {
    const on = Number(b.dataset.baseX) === state.baseX;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }

  // 滑杆与读数
  gxSlider.value = String(state.gx);
  gySlider.value = String(state.gy);
  padSlider.value = String(state.innerPad);
  gxValEl.textContent = `${state.gx}px (${m.gxMultText})`;
  gyValEl.textContent = `${state.gy}px (${m.gyMultText})`;
  padValEl.textContent = `${state.innerPad}px`;

  // 同步锁 / 归轨 / 跨列 / 标尺按钮
  lockBtn.classList.toggle("is-active", state.lockXY);
  lockBtn.setAttribute("aria-pressed", String(state.lockXY));
  lockBtn.textContent = state.lockXY ? "X=Y 同步锁：开" : "X=Y 同步锁：关";

  fixTrackBtn.disabled = state.driftedSlot === -1 && state.spanMode !== "bug";
  fixTrackBtn.textContent = state.driftedSlot !== -1 || state.spanMode === "bug" ? "一键归轨补缝" : "轨道已严齐";

  const spanLabels = { bug: "跨列：漏算 1X", valid: "跨列：规范 2W+X", none: "跨列：12 单卡" };
  spanModeBtn.textContent = spanLabels[state.spanMode];
  spanModeBtn.classList.toggle("is-warn", state.spanMode === "bug");

  guideBtn.classList.toggle("is-active", state.showGuides);
  guideBtn.setAttribute("aria-pressed", String(state.showGuides));
  guideBtn.textContent = state.showGuides ? "沟道标尺：显" : "沟道标尺：隐";

  // 底部原海报四枚特点实况章
  for (const tb of diag.traitBadges) {
    const el = traitEls[tb.key];
    if (!el) continue;
    el.textContent = tb.text;
    el.className = `trait-pill ${tb.ok ? "is-ok" : "is-err"}`;
  }

  heroDraw(reducedMotion.matches);
}

function mutate(patch) {
  Object.assign(state, patch);
  syncUI();
}

// 绑定开场交互控件
for (const b of themeBtns) {
  b.addEventListener("click", () => mutate({ theme: b.dataset.theme }));
}

for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    mutate({
      baseX: p.baseX,
      gx: p.gx,
      gy: p.gy,
      innerPad: p.innerPad,
      lockXY: p.lockXY,
      driftedSlot: p.driftedSlot,
      spanMode: p.spanMode,
    });
  });
}

for (const b of baseBtns) {
  b.addEventListener("click", () => {
    const nextBase = Number(b.dataset.baseX);
    mutate({ baseX: nextBase });
  });
}

gxSlider.addEventListener("input", () => {
  const v = Number(gxSlider.value);
  mutate(state.lockXY ? { gx: v, gy: v } : { gx: v });
});

gySlider.addEventListener("input", () => {
  const v = Number(gySlider.value);
  mutate(state.lockXY ? { gx: v, gy: v } : { gy: v });
});

padSlider.addEventListener("input", () => {
  mutate({ innerPad: Number(padSlider.value) });
});

lockBtn.addEventListener("click", () => {
  const nextLock = !state.lockXY;
  if (nextLock) {
    // 锁定时自动向最近的基数整倍归拢，保持单真源可预测
    const target = clamp(Math.round(state.gx / state.baseX) * state.baseX || state.baseX * 2, state.baseX, 32);
    mutate({ lockXY: true, gx: target, gy: target });
  } else {
    mutate({ lockXY: false });
  }
});

fixTrackBtn.addEventListener("click", () => {
  mutate({
    driftedSlot: -1,
    spanMode: state.spanMode === "bug" ? "valid" : state.spanMode,
  });
});

spanModeBtn.addEventListener("click", () => {
  const order = { bug: "valid", valid: "none", none: "bug" };
  mutate({ spanMode: order[state.spanMode] });
});

guideBtn.addEventListener("click", () => {
  mutate({ showGuides: !state.showGuides });
});

// 挂载开场 2D 校样画布
if (heroCanvas) {
  const mounted = mountHeroCanvas(heroCanvas, () => state, mutate);
  heroDraw = mounted.draw;
}

syncUI();
initSections();
