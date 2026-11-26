// 256 双列页面 · 入口协调器
// 统一管理开场单真源状态、实时二分圆徽标、四项设计要点实况灯、深林灯泡诊单带与 01–07 交互节。

import { createHeroStage, updateEmblem } from "./hero-stage.js";
import { INITIAL_STATE, PRESETS, clamp, computeLayout } from "./model.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

const state = { ...INITIAL_STATE };

const heroCanvas = document.getElementById("heroCanvas");
const emblemSvg = document.getElementById("emblemSvg");
const topStatusPill = document.getElementById("topStatusPill");
const mobStatusPill = document.getElementById("mobStatusPill");

// 深林灯泡诊单带元素
const diagBox = document.getElementById("diagBox");
const diagBadge = document.getElementById("diagBadge");
const diagTitle = document.getElementById("diagTitle");
const diagReason = document.getElementById("diagReason");
const diagFixBtn = document.getElementById("diagFixBtn");
const diagCssToggle = document.getElementById("diagCssToggle");
const diagCssBlock = document.getElementById("diagCssBlock");

// 单真源指标栏
const metSplit = document.getElementById("metSplit");
const metGutter = document.getElementById("metGutter");
const metOffset = document.getElementById("metOffset");
const metMass = document.getElementById("metMass");

// 控件引用
const scenarioBtns = [...document.querySelectorAll("[data-scenario]")];
const gutterRange = document.getElementById("gutterRange");
const gutterVal = document.getElementById("gutterVal");
const offsetRange = document.getElementById("offsetRange");
const offsetVal = document.getElementById("offsetVal");
const hierBtns = [...document.querySelectorAll("[data-hier]")];
const swapArtBtn = document.getElementById("swapArtBtn");
const guidesBtn = document.getElementById("guidesBtn");
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const kpRows = [...document.querySelectorAll("[data-kp-rule]")];

// 标题自示范：随左右栏宽比轻微映射“双列 / 页面”底下的双轨色条
const titleLeftBar = document.getElementById("titleLeftBar");
const titleRightBar = document.getElementById("titleRightBar");

let currentLayout = null;
let uiRaf = 0;
const setText = (el, v) => {
  if (el && el.textContent !== v) el.textContent = v;
};

function syncUI() {
  const sz = stage?.getSize?.() || { w: 720, h: 400 };
  currentLayout = computeLayout(state, sz.w || 720, sz.h || 400);

  // 1. 更新顶沿与移动端实况徽签
  const stateStr = currentLayout.allPass ? "ok" : "warn";
  for (const pill of [topStatusPill, mobStatusPill]) {
    if (!pill) continue;
    setText(pill, currentLayout.shortBadge);
    if (pill.dataset.state !== stateStr) pill.dataset.state = stateStr;
  }

  // 2. 更新自示范标题双轨比例尺
  if (titleLeftBar && titleRightBar) {
    const lStr = String(currentLayout.metrics.splitLeftPct);
    const rStr = String(currentLayout.metrics.splitRightPct);
    if (titleLeftBar.style.flexGrow !== lStr) titleLeftBar.style.flexGrow = lStr;
    if (titleRightBar.style.flexGrow !== rStr) titleRightBar.style.flexGrow = rStr;
  }

  // 3. 更新原海报同款活体二分圆徽标
  updateEmblem(emblemSvg, currentLayout);

  // 4. 更新左侧四枚「设计要点 KEY POINTS」实况灯
  kpRows.forEach((row) => {
    const key = row.dataset.kpRule;
    const rule = currentLayout.rules[key];
    if (!rule) return;
    const rs = rule.ok ? "ok" : "warn";
    if (row.dataset.state !== rs) row.dataset.state = rs;
    const pressed = String(state.focusRule === key);
    if (row.getAttribute("aria-pressed") !== pressed) row.setAttribute("aria-pressed", pressed);
    setText(row.querySelector("[data-kp-tag]"), rule.tag);
  });

  // 5. 更新原海报同款深林松绿灯泡诊单带
  if (diagBox && diagBox.dataset.state !== stateStr) diagBox.dataset.state = stateStr;
  setText(diagBadge, currentLayout.shortBadge);
  setText(diagTitle, currentLayout.diagnosis.title);
  setText(diagReason, currentLayout.diagnosis.reason);
  setText(diagFixBtn, currentLayout.diagnosis.actionLabel);
  if (diagCssBlock && !diagCssBlock.hidden) setText(diagCssBlock, currentLayout.cssSnippet);

  // 6. 单真源实测数值
  const m = currentLayout.metrics;
  setText(metSplit, `${m.splitLeftPct}:${m.splitRightPct}`);
  setText(metGutter, `${m.gutter}px`);
  setText(metOffset, m.offsetY === 0 ? "0px 齐" : `${m.offsetY > 0 ? "+" : ""}${m.offsetY}px`);
  setText(metMass, `${m.leftMassPct}:${m.rightMassPct}`);

  // 7. 同步控件状态
  scenarioBtns.forEach((b) => {
    const p = String(b.dataset.scenario === state.scenario);
    if (b.getAttribute("aria-pressed") !== p) b.setAttribute("aria-pressed", p);
  });
  if (gutterRange && gutterRange.value !== String(state.gutter)) gutterRange.value = String(state.gutter);
  setText(gutterVal, `${state.gutter}px`);
  if (offsetRange && offsetRange.value !== String(state.offsetY)) offsetRange.value = String(state.offsetY);
  setText(offsetVal, `${state.offsetY > 0 ? "+" : ""}${state.offsetY}px`);
  hierBtns.forEach((b) => {
    const p = String(b.dataset.hier === state.hierarchy);
    if (b.getAttribute("aria-pressed") !== p) b.setAttribute("aria-pressed", p);
  });
  if (guidesBtn) {
    const gp = String(state.showGuides);
    if (guidesBtn.getAttribute("aria-pressed") !== gp) guidesBtn.setAttribute("aria-pressed", gp);
    setText(guidesBtn, state.showGuides ? "标尺视线：开" : "标尺视线：关");
  }
  if (swapArtBtn) {
    const bothLeft = state.artASide === "left" && state.artBSide === "left";
    const bothRight = state.artASide === "right" && state.artBSide === "right";
    setText(swapArtBtn, bothLeft || bothRight ? "左右均分两图" : "对调左右图块");
  }
}

let stage = null;
let lastUiSync = 0;
function mutate(patch, opts = {}) {
  Object.assign(state, patch);
  if (opts.continuous) {
    // 连续触控拖动期间以约 100ms 节流同步文字面板，避免软件渲染下每帧强排整页 DOM；画布本身仍每帧顺滑重绘
    const now = performance.now();
    if (now - lastUiSync >= 100) {
      lastUiSync = now;
      syncUI();
    } else if (!uiRaf) {
      uiRaf = requestAnimationFrame(() => {
        uiRaf = 0;
        if (performance.now() - lastUiSync >= 90) {
          lastUiSync = performance.now();
          syncUI();
        }
      });
    }
  } else {
    if (uiRaf) {
      cancelAnimationFrame(uiRaf);
      uiRaf = 0;
    }
    lastUiSync = performance.now();
    syncUI();
    stage?.draw();
  }
}

if (heroCanvas) {
  stage = createHeroStage(heroCanvas, () => state, mutate);
}

// 事件绑定
scenarioBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    mutate({ scenario: btn.dataset.scenario });
  })
);

gutterRange?.addEventListener("input", () => {
  mutate({ gutter: clamp(Number(gutterRange.value), 0, 92) });
});

offsetRange?.addEventListener("input", () => {
  const v = clamp(Number(offsetRange.value), -44, 48);
  mutate({ offsetY: Math.abs(v) <= 3 ? 0 : v });
});

hierBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    mutate({ hierarchy: btn.dataset.hier });
  })
);

swapArtBtn?.addEventListener("click", () => {
  const bothSame = state.artASide === state.artBSide;
  if (bothSame) {
    mutate({ artASide: "left", artBSide: "right" });
  } else {
    mutate({
      artASide: state.artASide === "left" ? "right" : "left",
      artBSide: state.artBSide === "left" ? "right" : "left",
    });
  }
});

guidesBtn?.addEventListener("click", () => {
  mutate({ showGuides: !state.showGuides });
});

diagFixBtn?.addEventListener("click", () => {
  if (currentLayout?.diagnosis?.fixPatch) {
    mutate(currentLayout.diagnosis.fixPatch);
  }
});

diagCssToggle?.addEventListener("click", () => {
  if (!diagCssBlock) return;
  const open = diagCssBlock.hidden;
  diagCssBlock.hidden = !open;
  diagCssToggle.setAttribute("aria-expanded", String(open));
  diagCssToggle.textContent = open ? "收起 CSS" : "实时 CSS";
  if (open && currentLayout) diagCssBlock.textContent = currentLayout.cssSnippet;
});

presetBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) mutate(p.patch);
  })
);

kpRows.forEach((row) =>
  row.addEventListener("click", () => {
    const rule = row.dataset.kpRule;
    mutate({ focusRule: state.focusRule === rule ? null : rule, showGuides: true });
  })
);

// 键盘操作：焦点在画布时，←/→ 调栏宽比，↑/↓ 调右栏顶沿对齐，Space 切换图块均分，R 复原开场
heroCanvas?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutate({ split: +clamp(state.split - 0.02, 0.22, 0.78).toFixed(3) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    mutate({ split: +clamp(state.split + 0.02, 0.22, 0.78).toFixed(3) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const next = clamp(state.offsetY - 4, -44, 48);
    mutate({ offsetY: Math.abs(next) <= 2 ? 0 : next });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    const next = clamp(state.offsetY + 4, -44, 48);
    mutate({ offsetY: Math.abs(next) <= 2 ? 0 : next });
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    const same = state.artASide === state.artBSide;
    mutate(same ? { artASide: "left", artBSide: "right" } : { artASide: state.artBSide, artBSide: state.artASide });
  } else if (e.key.toLowerCase() === "r") {
    e.preventDefault();
    mutate(PRESETS.reset.patch);
  }
});

// 初始化开场 UI 与 01–07 正文各节交互
syncUI();
stage?.draw();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
