// 235 · 粘性定位布局 主控脚本
// 遵循 GUIDE.md：单真源 model.js 驱动全部读数与视图；使用 lib/stage.js 的 loop()；零外部依赖；无障碍键盘操作全覆盖。

import { loop, reducedMotion } from "../../lib/stage.js";
import {
  CLINIC_CASES,
  MAX_SCROLL,
  QUIZ_OPTIONS,
  SECTIONS_GEOM,
  TIMELINE_NODES,
  clampScroll,
  computeCompareTriad,
  createBreathSolution,
  createBrokenState,
  createPosterSolution,
  evaluateBudget,
  evaluateSticky,
} from "./model.js";
import { createTrackCanvas } from "./track-canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 开场活体三分区试验台 ====================
const state = createBrokenState();

const elStatusPill = $("#top-status-pill");
const elTitleBadge = $("#title-sticky-badge");
const elDiagCard = $("#diag-card");
const elDiagTag = $("#diag-tag");
const elDiagTitle = $("#diag-title");
const elDiagWhy = $("#diag-why");
const elDiagAction = $("#diag-action");
const elMPhase = $("#m-phase");
const elMRunway = $("#m-runway");
const elMReadable = $("#m-readable");
const elCssBadge = $("#css-valid-badge");
const elLiveCss = $("#live-css-code");
const elViewport = $("#reel-viewport");
const elReelContent = $("#reel-content");
const elReelSections = $("#reel-sections");
const elThresholdLine = $("#threshold-line");
const elThresholdPill = $("#threshold-pill");
const elGhostMiss = $("#ghost-miss");
const elHeavyStack = $("#heavy-stack");
const elTrapFrame = $("#trap-frame");
const elTrackCanvas = $("#track-canvas");

const dotMap = {
  overflow: $("#dot-overflow"),
  threshold: $("#dot-threshold"),
  parent: $("#dot-parent"),
  layer: $("#dot-layer"),
};

// 生成原海报风格的三类橄榄金小图标
function cardIconSvg(kind) {
  if (kind === "mountain") {
    return `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><circle cx="22" cy="10" r="2.6" fill="currentColor"/><path d="M4 24L12.5 12.5L18.5 20L22 15.5L28 24Z" fill="currentColor"/></svg>`;
  }
  if (kind === "circle") {
    return `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><circle cx="16" cy="16" r="9.5" fill="currentColor"/></svg>`;
  }
  return `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M16 16V6.5A9.5 9.5 0 1 0 25.5 16Z" fill="currentColor"/></svg>`;
}

const BOOKMARK_SVG = `<svg class="sh-ico" viewBox="0 0 18 22" width="16" height="20" aria-hidden="true"><path d="M3 2.5h12v17l-6-4.2-6 4.2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;

// 一次性搭建三分区 DOM，后续拖动只做 GPU transform，杜绝重排卡顿
const sectionDomRefs = [];
function buildReelDom() {
  const frag = document.createDocumentFragment();
  for (const sec of SECTIONS_GEOM) {
    const secEl = document.createElement("div");
    secEl.className = "reel-section";
    secEl.dataset.secId = sec.id;

    const hdrEl = document.createElement("div");
    hdrEl.className = "sticky-header-bar";
    hdrEl.innerHTML = `
      <div class="sh-left">
        ${BOOKMARK_SVG}
        <div class="sh-titles">
          <strong>${sec.title}</strong>
          <span lang="en">${sec.en}</span>
        </div>
      </div>
      <span class="sh-badge">流动中</span>
    `;

    const cardsWrap = document.createElement("div");
    cardsWrap.className = "reel-cards";
    for (const c of sec.cards) {
      const cardEl = document.createElement("div");
      cardEl.className = "reel-card";
      cardEl.innerHTML = `
        <div class="reel-card-thumb">${cardIconSvg(c.icon)}</div>
        <div class="reel-card-body">
          <strong>${c.title}</strong>
          <span>${c.sub}</span>
          <div class="card-bars"><i style="width:76%"></i><i style="width:42%"></i></div>
        </div>
      `;
      cardsWrap.appendChild(cardEl);
    }

    secEl.appendChild(hdrEl);
    secEl.appendChild(cardsWrap);
    frag.appendChild(secEl);
    sectionDomRefs.push({ secEl, hdrEl, badgeEl: hdrEl.querySelector(".sh-badge") });
  }
  elReelSections.appendChild(frag);
}
buildReelDom();

let lastEval = evaluateSticky(state);
let lastParamKey = "";
let lastPhaseText = "";
let rafPending = false;

const trackCtrl = createTrackCanvas(elTrackCanvas, {
  getEval: () => lastEval,
  onScrollChange: (y) => {
    const next = clampScroll(y);
    if (next === state.scrollY) return;
    state.scrollY = next;
    scheduleRender();
  },
});

const PHASE_LABEL = {
  flow: "01 正常流动",
  approaching: "02 准备吸合",
  stuck: "03 吸附顶部",
  pushing: "04 顶出交棒",
  escaped: "脱轨滑走",
  passed: "已退场",
};

function renderHero(forceParams = false) {
  const ev = evaluateSticky(state);
  lastEval = ev;

  // 1. 高频同步：2D Canvas 轨道 + 视口内容与 3 枚粘性标头 GPU 位移
  trackCtrl.draw();
  elTrackCanvas.setAttribute("aria-valuenow", String(ev.scrollY));
  elReelContent.style.transform = `translate3d(0, ${-ev.scrollY}px, 0)`;

  const isBleed = state.layerMode === "bleed";
  ev.sections.forEach((sec, i) => {
    const ref = sectionDomRefs[i];
    ref.secEl.dataset.parent = state.parentMode;
    ref.hdrEl.style.transform = `translate3d(0, ${sec.deltaY}px, 0)`;
    ref.hdrEl.dataset.bleed = isBleed ? "1" : "0";
    ref.hdrEl.dataset.escaped = sec.isEscaped ? "1" : "0";
    const badgeTxt =
      sec.phase === "stuck"
        ? "已吸顶"
        : sec.phase === "pushing"
        ? "顶出交棒"
        : sec.phase === "approaching"
        ? "逼近阈值"
        : sec.phase === "escaped"
        ? "已脱轨"
        : "文档流";
    if (ref.badgeEl.textContent !== badgeTxt) ref.badgeEl.textContent = badgeTxt;
  });

  // 示范大标「粘性」微联动（真正吸合时亮起实粉书签态）
  const anyStuck = ev.sections.some((s) => s.phase === "stuck") && ev.passCount === 4;
  elTitleBadge.dataset.stuck = anyStuck ? "1" : "0";

  // 错态残影：仅当分区一已完全滑离顶部且未能吸顶时亮出，绝不与标题条叠字
  const showMiss = !ev.engineActive && ev.scrollY >= 134;
  elGhostMiss.hidden = !showMiss;

  // 左侧 4 阶段轴亮灯
  $$(".phase-node", $("#phase-rail")).forEach((node) => {
    const ph = node.dataset.phase;
    node.dataset.active = ev.stageActive === ph ? "1" : "0";
    node.dataset.err = ev.stageActive === "err" && ph === "03" ? "1" : "0";
  });

  // 读数按需更新（仅文本变化时写 DOM，保持拖动 60fps）
  const phaseSummary = PHASE_LABEL[ev.focus.phase] || "正常流动";
  if (phaseSummary !== lastPhaseText) {
    lastPhaseText = phaseSummary;
    elMPhase.textContent = phaseSummary;
  }

  // 2. 低频同步：参数、诊单、阈值线、实时 CSS 语法盒（参数变化或达标后阶段变动时刷新）
  const paramKey = `${state.topMode}|${state.overflowMode}|${state.parentMode}|${state.layerMode}|${ev.focus.id}|${ev.focus.phase}`;
  if (forceParams || paramKey !== lastParamKey) {
    lastParamKey = paramKey;

    elStatusPill.textContent = ev.passCount === 4 ? "4 / 4 已吸合" : `${ev.passCount} / 4 未吸合`;
    elStatusPill.dataset.state = ev.passCount === 4 ? "ok" : "err";

    elDiagCard.dataset.severity = ev.diag.severity;
    elDiagTag.textContent = ev.diag.tag;
    elDiagTitle.textContent = ev.diag.headline;
    elDiagWhy.textContent = ev.diag.why;
    elDiagAction.textContent = ev.diag.action;
    elMRunway.textContent = `${ev.runwayPx}px`;
    elMReadable.textContent = `${ev.readableRatio}%`;

    dotMap.overflow.dataset.ok = ev.checks.overflow ? "1" : "0";
    dotMap.threshold.dataset.ok = ev.checks.threshold ? "1" : "0";
    dotMap.parent.dataset.ok = ev.checks.parent ? "1" : "0";
    dotMap.layer.dataset.ok = ev.checks.layer ? "1" : "0";

    // 阈值虚线位置与文案
    const lineY = ev.effectiveThreshold ?? 0;
    elThresholdLine.style.transform = `translate3d(0, ${lineY}px, 0)`;
    elThresholdLine.dataset.active = ev.checks.threshold && ev.engineActive ? "1" : "0";
    elThresholdPill.textContent =
      ev.rawThreshold === null
        ? "未设 top（无阈值）"
        : state.layerMode === "heavy"
        ? `被叠压至 top: ${lineY}px`
        : `阈值线 top: ${ev.rawThreshold}px`;

    elViewport.dataset.overflow = state.overflowMode;
    elViewport.dataset.layer = state.layerMode;
    elHeavyStack.hidden = state.layerMode !== "heavy";
    elTrapFrame.hidden = state.overflowMode !== "auto-trap";

    // 更新分段按钮状态
    $$(".ctrl-panel .seg-btn").forEach((btn) => {
      const p = btn.dataset.param;
      const v = btn.dataset.val;
      const active = state[p] === v;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      if (active) {
        const isGood =
          (p === "overflowMode" && (v === "clip" || v === "visible")) ||
          (p === "topMode" && (v === "0" || v === "12")) ||
          (p === "parentMode" && v === "section") ||
          (p === "layerMode" && v === "solid");
        btn.dataset.tone = isGood ? "ok" : "err";
      } else {
        delete btn.dataset.tone;
      }
    });

    // 更新实时 CSS 代码盒
    const failNum = 4 - ev.passCount;
    elCssBadge.textContent = failNum === 0 ? "全部合规" : `${failNum} 处阻断`;
    elCssBadge.dataset.ok = failNum === 0 ? "1" : "0";
    elLiveCss.innerHTML = ev.cssLines
      .map((l) => `<span class="css-line tone-${l.tone}">${l.text}</span>`)
      .join("");
  }
}

function scheduleRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    renderHero(false);
  });
}

// 绑定四维排障按钮
$$(".ctrl-panel .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state[btn.dataset.param] = btn.dataset.val;
    renderHero(true);
  });
});

$("#btn-reset-broken").addEventListener("click", () => {
  Object.assign(state, createBrokenState());
  renderHero(true);
});

$("#btn-poster-sol").addEventListener("click", () => {
  Object.assign(state, createPosterSolution(Math.max(176, state.scrollY)));
  renderHero(true);
});

$("#btn-breath-sol").addEventListener("click", () => {
  Object.assign(state, createBreathSolution(Math.max(190, state.scrollY)));
  renderHero(true);
});

// 快速跳转观察点
$$(".mini-jump").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scrollY = clampScroll(Number(btn.dataset.jump));
    renderHero(true);
  });
});

// 右侧流动步进按钮
$("#btn-step-up").addEventListener("click", () => {
  state.scrollY = clampScroll(state.scrollY + 72);
  renderHero(true);
});

$("#btn-step-down").addEventListener("click", () => {
  state.scrollY = clampScroll(state.scrollY - 72);
  renderHero(true);
});

// 阅读视口内支持真实鼠标滚轮（到达边界后把滚动权还给外层主页面）
elViewport.addEventListener(
  "wheel",
  (e) => {
    const dy = e.deltaY;
    const next = clampScroll(state.scrollY + dy * 0.75);
    if (next !== state.scrollY) {
      e.preventDefault();
      state.scrollY = next;
      scheduleRender();
    }
  },
  { passive: false }
);

// 轨道和视口键盘无障碍操控（←/→/↑/↓/PageUp/PageDown）
function handleKeyScroll(e) {
  let step = 0;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") step = 36;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") step = -36;
  else if (e.key === "PageDown") step = 140;
  else if (e.key === "PageUp") step = -140;
  if (step !== 0) {
    e.preventDefault();
    state.scrollY = clampScroll(state.scrollY + step);
    renderHero(true);
  }
}
elTrackCanvas.addEventListener("keydown", handleKeyScroll);
elViewport.addEventListener("keydown", handleKeyScroll);

// 使用 lib/stage.js 的 loop() 处理首屏清晰渲染与窗口 resize（静置时零浪费重绘）
let heroDrawnOnce = false;
const heroLoop = loop(elTrackCanvas, (_t, _dt, { still }) => {
  if (!heroDrawnOnce || still) {
    heroDrawnOnce = true;
    renderHero(true);
  }
});

window.addEventListener("resize", () => {
  trackCtrl.draw();
});

renderHero(true);

// ==================== 01 节：三态同步滚筒对比 ====================
const elTriadRange = $("#triad-range");
const elTriadReadout = $("#triad-readout");
const elTriadVerdict = $("#triad-verdict");
const elFlowRel = $("#triad-flow-rel");
const elFlowSticky = $("#triad-flow-sticky");
const elFlowFixed = $("#triad-flow-fixed");
const elBlkSticky = $("#triad-blk-sticky");
const elBlkFixed = $("#triad-blk-fixed");
const elSecBox = $("#triad-sec-box");
const elStRel = $("#triad-st-rel");
const elStSticky = $("#triad-st-sticky");
const elStFixed = $("#triad-st-fixed");

function renderTriad(pct) {
  const res = computeCompareTriad(pct / 100);
  elTriadRange.value = String(pct);
  elTriadReadout.textContent = `滚卷 ${pct}% · scrollY ${res.scrollY}px`;

  elFlowRel.style.transform = `translate3d(0, ${-res.scrollY}px, 0)`;
  elFlowSticky.style.transform = `translate3d(0, ${-res.scrollY}px, 0)`;
  elFlowFixed.style.transform = `translate3d(0, ${-res.scrollY}px, 0)`;
  elBlkSticky.style.transform = `translate3d(0, ${res.sticky.y}px, 0)`;
  elBlkFixed.style.transform = `translate3d(0, ${res.fixed.y}px, 0)`;
  elSecBox.style.transform = `translate3d(0, ${-res.scrollY}px, 0)`;

  elStRel.textContent = res.rel.state;
  elStSticky.textContent = res.sticky.state;
  elStFixed.textContent = res.fixed.state;

  if (pct < 20) {
    elTriadVerdict.textContent = `在 ${pct}% 起点：relative 与 sticky 都老实待在文档流原位，绝不遮挡导语；fixed 则一开头就脱离文档流压在首行正文上。`;
  } else if (pct < 74) {
    elTriadVerdict.textContent = `在 ${pct}% 中段：relative 已彻底滚出视野失去章节参照；sticky 稳稳停在粉红虚线 top: 10px 处，卡片从下方穿过。`;
  } else {
    elTriadVerdict.textContent = `在 ${pct}% 末尾：虚线父盒底边滚到脚下，sticky 顺势被顶走、把空间让给后续新章节；fixed 依然雷打不动盖着页脚。`;
  }
}

elTriadRange.addEventListener("input", () => renderTriad(Number(elTriadRange.value)));
$$("[data-triad]").forEach((btn) => {
  btn.addEventListener("click", () => renderTriad(Number(btn.dataset.triad)));
});
renderTriad(0);

// ==================== 02 节：原生双向粘性数据表 ====================
const elMatrixScroll = $("#matrix-scroll");
const elMatrixStatus = $("#matrix-status");
const chkStickTop = $("#chk-stick-top");
const chkStickLeft = $("#chk-stick-left");
const chkCornerZ = $("#chk-corner-z");

function renderMatrixFlags() {
  const t = chkStickTop.checked;
  const l = chkStickLeft.checked;
  const z = chkCornerZ.checked;
  elMatrixScroll.dataset.stickTop = t ? "1" : "0";
  elMatrixScroll.dataset.stickLeft = l ? "1" : "0";
  elMatrixScroll.dataset.cornerZ = z ? "1" : "0";

  if (t && l && z) {
    elMatrixStatus.textContent = "双向均已吸合且交汇角置顶：请直接在下方表格上下、左右真实滚动。";
  } else if (t && l && !z) {
    elMatrixStatus.textContent = "交汇角层级过低：向右滚动时首列格会从左上角标题上方穿盖过去。";
  } else if (t && !l) {
    elMatrixStatus.textContent = "仅锁顶行表头：向右滚看细节列时，容易忘掉当前这一行是哪项布局。";
  } else if (!t && l) {
    elMatrixStatus.textContent = "仅锁首列项目：向下滚到底部时，顶部列名已滚出视野。";
  } else {
    elMatrixStatus.textContent = "已关闭全部粘性锁边：整张表按普通表格自由滚走，请对比查表费力程度。";
  }
}
[chkStickTop, chkStickLeft, chkCornerZ].forEach((c) => c.addEventListener("change", renderMatrixFlags));
renderMatrixFlags();

// ==================== 03 节：四大失效暗坑诊所 ====================
let clinicIdx = 0;
let clinicFixed = false;
let clinicScrollPct = 54;

const elClinicBadge = $("#clinic-badge");
const elClinicTitle = $("#clinic-title");
const elClinicSymptom = $("#clinic-symptom");
const elClinicCause = $("#clinic-cause");
const elClinicCode = $("#clinic-code");
const elClinicBtn = $("#btn-clinic-toggle");
const elClinicStatus = $("#clinic-status-txt");
const elClinicStage = $("#clinic-stage");
const elClinicRange = $("#clinic-range");
const elClinicScrollVal = $("#clinic-scroll-val");

function renderClinicStage() {
  const c = CLINIC_CASES[clinicIdx];
  const scrollPx = Math.round((clinicScrollPct / 100) * 190);
  elClinicScrollVal.textContent = `滚卷 ${clinicScrollPct}%`;

  if (c.id === "overflow" || c.id === "inset") {
    const startY = 66;
    const natY = startY - scrollPx;
    const hdrY = clinicFixed ? Math.max(10, Math.min(natY, 248 - scrollPx)) : natY;
    const missHint = !clinicFixed && natY < -28
      ? `<div class="cs-miss">原应吸顶于 top: 10px（已随流滑走）</div>`
      : "";
    elClinicStage.innerHTML = `
      <div class="cs-guide"></div>
      ${missHint}
      <div class="cs-doc" style="transform:translate3d(0,${-scrollPx}px,0); padding-top:10px;">
        <div class="cs-row">导语区块（位于粘性标头之上）</div>
        <div style="height:48px;"></div>
        <div class="cs-row">正文卡片 01 · 随卷动上移</div>
        <div class="cs-row">正文卡片 02 · 穿过吸顶标头</div>
        <div class="cs-row">正文卡片 03 · 仍在同一父盒</div>
        <div class="cs-row">正文卡片 04 · 接近分区底边</div>
        <div class="cs-row">正文卡片 05 · 下方延续段落</div>
      </div>
      <div class="cs-hdr" style="transform:translate3d(0,${hdrY}px,0); background:${clinicFixed ? "#1D7B60" : "#B82822"};">
        <span>${c.id === "overflow" ? ".sub-head（分区标头）" : ".filter-bar（筛选工具栏）"}</span>
        <span>${clinicFixed ? (natY <= 10 ? "✓ 稳稳吸顶" : "正常流") : "× 随流滑跑"}</span>
      </div>
    `;
  } else if (c.id === "flex") {
    const tocY = clinicFixed ? 10 : 10 - scrollPx;
    const tocH = clinicFixed ? 116 : 310;
    elClinicStage.innerHTML = `
      <div class="cs-guide"></div>
      <div class="cs-split">
        <div style="transform:translate3d(0,${-scrollPx}px,0);">
          <div class="cs-row">长正文第 1 段</div>
          <div class="cs-row">长正文第 2 段</div>
          <div class="cs-row">长正文第 3 段</div>
          <div class="cs-row">长正文第 4 段</div>
          <div class="cs-row">长正文第 5 段</div>
          <div class="cs-row">长正文第 6 段</div>
          <div class="cs-row">长正文第 7 段</div>
        </div>
        <div class="cs-toc" style="height:${tocH}px; transform:translate3d(0,${tocY}px,0); border-color:${clinicFixed ? "#73E5C2" : "#FF8E82"};">
          <strong>${clinicFixed ? "✓ .toc (flex-start)" : "× .toc (stretch 拉满)"}</strong>
          <span>· 01 概览</span>
          <span>· 02 语法</span>
          <span>· 03 暗坑</span>
          <span>${clinicFixed ? "高度 116px，留有滑行轨" : "被拉到 310px 锁死滑行"}</span>
        </div>
      </div>
    `;
  } else {
    // 超高粘性块
    const innerOffset = clinicFixed ? Math.round((clinicScrollPct / 100) * 90) : 0;
    elClinicStage.innerHTML = `
      <div class="cs-guide"></div>
      <div class="cs-split">
        <div style="transform:translate3d(0,${-scrollPx}px,0);">
          <div class="cs-row">主正文区域 · 持续向上滚动</div>
          <div class="cs-row">主正文段落 02</div>
          <div class="cs-row">主正文段落 03</div>
          <div class="cs-row">主正文段落 04</div>
          <div class="cs-row">主正文段落 05</div>
          <div class="cs-row">主正文段落 06</div>
        </div>
        <div class="cs-toc" style="height:${clinicFixed ? 202 : 280}px; overflow:hidden; border-color:${clinicFixed ? "#73E5C2" : "#FF8E82"};">
          <div style="transform:translate3d(0,${-innerOffset}px,0); display:flex; flex-direction:column; gap:5px;">
            <strong>${clinicFixed ? "✓ 限高 + 内滚" : "× 超高卡死底部"}</strong>
            <span>目录 01 · 导论</span>
            <span>目录 02 · 阈值</span>
            <span>目录 03 · 祖先</span>
            <span>目录 04 · 层叠</span>
            <span>目录 05 · 表格</span>
            <span>目录 06 · 兼容</span>
            <span>目录 07 · 练习</span>
            <span style="color:#E5CF6A;font-weight:700;">目录 08 · 底部链接（${clinicFixed ? "可达" : "永不可见"}）</span>
          </div>
        </div>
      </div>
    `;
  }
}

function renderClinic() {
  const c = CLINIC_CASES[clinicIdx];
  $$(".clinic-tab").forEach((t, i) => t.setAttribute("aria-selected", i === clinicIdx ? "true" : "false"));
  elClinicBadge.textContent = clinicFixed ? "已修复验证" : "故障重现中";
  elClinicBadge.dataset.fixed = clinicFixed ? "1" : "0";
  elClinicTitle.textContent = c.title;
  elClinicSymptom.textContent = `现象：${c.symptom}`;
  elClinicCause.textContent = `根因：${c.cause}`;
  elClinicCode.textContent = clinicFixed ? c.fixedCode : c.brokenCode;
  elClinicBtn.textContent = clinicFixed ? "复原该故障再对比" : c.fixBtn;
  elClinicBtn.dataset.fixed = clinicFixed ? "1" : "0";
  elClinicStatus.textContent = clinicFixed ? c.fixedNote : c.brokenNote;
  renderClinicStage();
}

$$(".clinic-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    clinicIdx = Number(tab.dataset.case);
    clinicFixed = false;
    renderClinic();
  });
});
elClinicBtn.addEventListener("click", () => {
  clinicFixed = !clinicFixed;
  renderClinic();
});
elClinicRange.addEventListener("input", () => {
  clinicScrollPct = Number(elClinicRange.value);
  renderClinicStage();
});
renderClinic();

// ==================== 04 节：年代脉络卡 + JS 抖动对比 ====================
const elTlYear = $("#tl-year-big");
const elTlBadge = $("#tl-badge");
const elTlTitle = $("#tl-title");
const elTlBody = $("#tl-body");

function selectTimeline(idx) {
  const node = TIMELINE_NODES[idx];
  $$(".tl-node").forEach((b, i) => b.setAttribute("aria-selected", i === idx ? "true" : "false"));
  elTlYear.textContent = node.year;
  elTlBadge.textContent = node.badge;
  elTlTitle.textContent = node.title;
  elTlBody.textContent = node.body;
}
$$(".tl-node").forEach((b) => b.addEventListener("click", () => selectTimeline(Number(b.dataset.tl))));
selectTimeline(2);

let jankAnimId = 0;
$("#btn-jank-demo").addEventListener("click", () => {
  cancelAnimationFrame(jankAnimId);
  const barJs = $("#jank-bar-js");
  const barCss = $("#jank-bar-css");
  const lagJs = $("#jank-lag-js");
  const lagCss = $("#jank-lag-css");

  if (reducedMotion.matches) {
    barJs.style.transform = "translate3d(0, 8px, 0)";
    barCss.style.transform = "translate3d(0, 0, 0)";
    lagJs.textContent = "已示意：主线程回调慢半拍（偏移约 +8px）";
    lagCss.textContent = "合成线程锁死：0px 零漂移";
    return;
  }

  const t0 = performance.now();
  const dur = 1100;
  lagCss.textContent = "合成线程锁死：0px 零漂移";
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    // 模拟主线程 scroll 事件滞后跳变，而原生 sticky 始终 0px 贴顶
    const wave = Math.sin(p * Math.PI * 6) * (1 - p) * 10;
    const snapped = Math.round(wave / 3) * 3;
    barJs.style.transform = `translate3d(0, ${snapped}px, 0)`;
    barCss.style.transform = "translate3d(0, 0, 0)";
    lagJs.textContent = p < 1 ? `急滚追赶中 · 抖动 ${snapped >= 0 ? "+" : ""}${snapped}px` : "急滚结束 · 期间多次掉帧抖动";
    if (p < 1) jankAnimId = requestAnimationFrame(step);
    else barJs.style.transform = "translate3d(0, 0, 0)";
  };
  jankAnimId = requestAnimationFrame(step);
});

// ==================== 05 节：多屏设备粘性占空计算器 ====================
const budgetState = {
  deviceId: "mobileH",
  layers: { nav: true, sec: true, filter: true, promo: false },
  autoUnstick: false,
};

function renderBudget() {
  const res = evaluateBudget(budgetState);
  $("#budget-pct").textContent = `${res.ratio}%`;

  $$("[data-dev]").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.dev === budgetState.deviceId ? "true" : "false")
  );

  const pinnedEl = $("#budget-pinned");
  const netEl = $("#budget-net");
  const verdictEl = $("#budget-verdict");
  const hPct = Math.max(0, Math.min(82, res.ratio));

  pinnedEl.style.height = `${hPct}%`;
  pinnedEl.dataset.status = res.status;
  pinnedEl.querySelector("span").textContent =
    res.effectivePinned === 0
      ? "已响应式解粘（0px）"
      : `吸顶占用 ${res.effectivePinned}px (${res.ratio}%)`;
  netEl.querySelector("span").textContent = `净阅读区 ${res.netH}px (${100 - res.ratio}%)`;

  verdictEl.dataset.status = res.status;
  verdictEl.textContent = res.verdict;
}

$$("[data-dev]").forEach((b) => {
  b.addEventListener("click", () => {
    budgetState.deviceId = b.dataset.dev;
    renderBudget();
  });
});
$$("[data-layer]").forEach((inp) => {
  inp.addEventListener("change", () => {
    budgetState.layers[inp.dataset.layer] = inp.checked;
    renderBudget();
  });
});
$("#chk-auto-unstick").addEventListener("change", (e) => {
  budgetState.autoUnstick = e.target.checked;
  renderBudget();
});
renderBudget();

// ==================== 06 节：单变量代码审查练习 ====================
const elQuizGrid = $("#quiz-grid");
const elQuizFb = $("#quiz-feedback");
const elQuizFbTitle = $("#quiz-fb-title");
const elQuizFbBody = $("#quiz-fb-body");
const elQuizBreakdown = $("#quiz-breakdown");

function buildQuiz() {
  elQuizGrid.innerHTML = "";
  for (const opt of QUIZ_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    btn.dataset.key = opt.key;
    btn.innerHTML = `
      <div class="quiz-opt-head">
        <span>${opt.label}</span>
        <span class="quiz-mark" aria-hidden="true"></span>
      </div>
      <pre>${opt.code}</pre>
    `;
    btn.addEventListener("click", () => handleQuizPick(opt.key));
    elQuizGrid.appendChild(btn);
  }
}

function handleQuizPick(pickedKey) {
  const picked = QUIZ_OPTIONS.find((o) => o.key === pickedKey);
  $$(".quiz-opt", elQuizGrid).forEach((btn) => {
    const opt = QUIZ_OPTIONS.find((o) => o.key === btn.dataset.key);
    const mark = btn.querySelector(".quiz-mark");
    if (opt.correct) {
      btn.dataset.state = "correct";
      mark.textContent = "✓ 唯一正解";
    } else if (opt.key === pickedKey) {
      btn.dataset.state = "wrong";
      mark.textContent = "× 会失灵";
    } else {
      delete btn.dataset.state;
      mark.textContent = "";
    }
  });

  elQuizFb.hidden = false;
  elQuizFbTitle.textContent = picked.correct
    ? "判断准确！方案 C 是唯一全部过关的实现"
    : `选了 ${picked.label} —— 它会在真实浏览器里失灵（正解为方案 C）`;
  elQuizFbBody.textContent = picked.reason;
  elQuizBreakdown.innerHTML = QUIZ_OPTIONS.map(
    (o) => `<li><strong>${o.label}</strong>（${o.diff}）：${o.reason}</li>`
  ).join("");
}

$("#btn-quiz-retry").addEventListener("click", () => {
  elQuizFb.hidden = true;
  $$(".quiz-opt", elQuizGrid).forEach((btn) => {
    delete btn.dataset.state;
    btn.querySelector(".quiz-mark").textContent = "";
  });
});
buildQuiz();

// ==================== 07 节：原海报灯箱（放大、拖拽、Esc 关闭） ====================
const elLightbox = $("#lightbox");
const elLbStage = $("#lb-stage");
const elLbImg = $("#lb-img");
const elPoster = $("#poster");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  elLbImg.style.transform = `translate3d(${lbX}px, ${lbY}px, 0) scale(${lbScale})`;
  $("#lb-zoom-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!elLbImg.src) elLbImg.src = elPoster.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  elLightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  elLightbox.hidden = true;
  $("#poster-trigger").focus();
}

$("#poster-trigger").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
$("#lb-zoom-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

elLbStage.addEventListener("pointerdown", (e) => {
  if (e.target === elLbStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  elLbStage.classList.add("dragging");
  try { elLbStage.setPointerCapture(e.pointerId); } catch {}
});
elLbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
elLbStage.addEventListener("pointerup", () => {
  lbDrag = false;
  elLbStage.classList.remove("dragging");
});
elLbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    lbScale = Math.max(0.6, Math.min(3, +(lbScale + delta).toFixed(2)));
    applyLbTransform();
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !elLightbox.hidden) closeLightbox();
});
