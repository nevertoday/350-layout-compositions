import { loop, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  PRESETS,
  SCENES,
  clampWidth,
  evaluate,
  formatCSSLines,
} from "./model.js";
import { createFluidStage } from "./fluid-canvas.js";

// ==================== 1. 开场弹性流体水槽状态与单真源联动 ====================
const state = {
  ...INITIAL_STATE,
  weights: [...INITIAL_STATE.weights],
};

let evalCache = evaluate(state);

const canvas = document.getElementById("fluidCanvas");
const heroStatusPill = document.getElementById("heroStatusPill");
const titleRibbon = document.getElementById("titleRibbon");
const stageReadout = document.getElementById("stageReadout");
const diagBadge = document.getElementById("diagBadge");
const diagTitle = document.getElementById("diagTitle");
const diagWhy = document.getElementById("diagWhy");
const diagAction = document.getElementById("diagAction");
const diagFixBtn = document.getElementById("diagFixBtn");
const principlesGrid = document.getElementById("principlesGrid");
const liveCss = document.getElementById("liveCss");
const codeMetrics = document.getElementById("codeMetrics");
const toggleReflow = document.getElementById("toggleReflow");
const toggleClamp = document.getElementById("toggleClamp");

let stageLoop = null;

function applyQuickFix(action) {
  if (action === "fix-unit-fr") {
    state.unit = "fr";
  } else if (action === "fix-weights-poster") {
    state.weights = [10, 10, 20, 30, 20, 10];
  } else if (action === "fix-balance-clamp") {
    state.weights = [10, 10, 20, 30, 20, 10];
    state.clampGuard = true;
  } else if (action === "fix-clamp") {
    state.clampGuard = true;
  } else if (action === "fix-reflow") {
    state.reflow = true;
  }
  syncAll(true);
}

let lastDomSync = 0;
let domSyncTimer = 0;

function scheduleDomSync(immediate) {
  const now = performance.now();
  if (immediate || now - lastDomSync >= 140) {
    if (domSyncTimer) {
      clearTimeout(domSyncTimer);
      domSyncTimer = 0;
    }
    lastDomSync = now;
    syncDOM();
  } else if (!domSyncTimer) {
    domSyncTimer = setTimeout(() => {
      domSyncTimer = 0;
      lastDomSync = performance.now();
      syncDOM();
    }, 150);
  }
}

const fluidStage = createFluidStage(
  canvas,
  () => state,
  () => evalCache,
  {
    onWidthChange(nextW, dragging = false) {
      const clamped = clampWidth(nextW);
      if (clamped === state.width) return;
      state.width = clamped;
      evalCache = evaluate(state);
      fluidStage.markDirty();
      if (reducedMotion.matches) stageLoop?.draw();
      scheduleDomSync(!dragging);
    },
    onWeightsChange(nextW, dragging = false) {
      state.weights = nextW;
      evalCache = evaluate(state);
      fluidStage.markDirty();
      if (reducedMotion.matches) stageLoop?.draw();
      scheduleDomSync(!dragging);
    },
    onDragEnd() {
      scheduleDomSync(true);
    },
    onQuickFix: applyQuickFix,
  }
);

let prevRibbonHtml = "";
let prevPrinciplesHtml = "";
let prevCssHtml = "";
let prevButtonsSig = "";

function renderLiveCSS(lines) {
  const html = lines
    .map((line) => {
      if (line.sel) {
        return `<span class="css-sel">${line.sel}</span>${line.rest || ""}`;
      }
      if (line.prop) {
        const cls = line.warn ? "css-val is-warn" : "css-val";
        return `  <span class="css-prop">${line.prop}</span>: <span class="${cls}">${line.val}</span>`;
      }
      const note = line.note
        ? `<span class="css-note${line.warn ? " is-warn" : ""}">${line.note}</span>`
        : "";
      return `${line.rest || ""}${note}`;
    })
    .join("\n");
  if (html !== prevCssHtml) {
    prevCssHtml = html;
    liveCss.innerHTML = html;
  }
}

const PRINCIPLE_ICONS = {
  pct: `%`,
  wave: `<svg viewBox="0 0 18 18" width="13" height="13" fill="none"><path d="M2 9.5C4 6.2 6.5 6.2 9 9C11.5 11.8 14 11.8 16 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  elastic: `<svg viewBox="0 0 18 18" width="13" height="13" fill="none"><path d="M2 9C4 4.5 6.2 4.5 9 9C11.8 13.5 14 13.5 16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  expand: `<svg viewBox="0 0 18 18" width="13" height="13" fill="none"><path d="M6.8 3.5H3.5v3.3M11.2 3.5h3.3v3.3M6.8 14.5H3.5v-3.3M11.2 14.5h3.3v-3.3M4 4l3.5 3.5M14 4l-3.5 3.5M4 14l3.5-3.5M14 14l-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function syncAll(snapCanvas = false) {
  evalCache = evaluate(state);
  if (snapCanvas) fluidStage.snapWidth(state.width);
  else fluidStage.markDirty();
  scheduleDomSync(true);
  if (reducedMotion.matches) stageLoop?.draw();
}

let principleNodes = null;

function syncDOM() {
  const ev = evalCache;
  const live = ev.live;

  // 刊头状态胶囊
  if (heroStatusPill.textContent !== ev.statusLabel) heroStatusPill.textContent = ev.statusLabel;
  heroStatusPill.classList.toggle("is-ok", ev.healthy);

  // 自示范标题流体条（仅在权重或列数变化时重排 DOM，拖动宽屏时零开销）
  const ribbonHtml = live.cols
    .map((c) => `<span style="flex:${Math.max(4, c.weight)} 1 0;background:${c.color}"></span>`)
    .join("");
  if (ribbonHtml !== prevRibbonHtml) {
    prevRibbonHtml = ribbonHtml;
    titleRibbon.innerHTML = ribbonHtml;
  }

  // 舞台读数条
  const unitName = state.unit === "px" ? "固定 px" : state.unit === "pct" ? "百分比 %" : "弹性 fr";
  const colLabel = live.stacked ? "3 层 100% 堆叠" : `${live.cols.length} 列`;
  const readoutStr = `容器 ${state.width}px（${live.tier.zh}）· ${unitName} · ${colLabel}`;
  if (stageReadout.textContent !== readoutStr) stageReadout.textContent = readoutStr;

  // 诊单区
  const badgeStr = ev.healthy
    ? "4/4 原理通流 · 流体秩序成立"
    : `待校准 · ${ev.passedCount}/4 原理通流`;
  if (diagBadge.textContent !== badgeStr) diagBadge.textContent = badgeStr;
  diagBadge.classList.toggle("is-ok", ev.healthy);
  if (diagTitle.textContent !== ev.verdictTitle) diagTitle.textContent = ev.verdictTitle;
  if (diagWhy.textContent !== ev.verdictWhy) diagWhy.textContent = ev.verdictWhy;
  if (diagAction.textContent !== ev.verdictAction) diagAction.textContent = ev.verdictAction;

  if (ev.fixAction && ev.fixLabel) {
    diagFixBtn.hidden = false;
    if (diagFixBtn.textContent !== ev.fixLabel) diagFixBtn.textContent = ev.fixLabel;
    diagFixBtn.dataset.action = ev.fixAction;
  } else {
    diagFixBtn.hidden = true;
  }

  // 四枚原海报原理实时徽（首次建 DOM，之后仅改节点文本与类名，杜绝重排）
  if (!principleNodes) {
    principlesGrid.innerHTML = ev.principles
      .map(
        (p) => `
        <div class="p-chip${p.ok ? " is-ok" : ""}">
          <div class="p-chip-top">
            <span class="p-dot" aria-hidden="true">${PRINCIPLE_ICONS[p.icon] || "%"}</span>
            <span class="p-name">${p.title}</span>
          </div>
          <span class="p-state">${p.badge}</span>
        </div>`
      )
      .join("");
    principleNodes = [...principlesGrid.querySelectorAll(".p-chip")].map((chip) => ({
      chip,
      stateEl: chip.querySelector(".p-state"),
    }));
  } else {
    ev.principles.forEach((p, idx) => {
      const node = principleNodes[idx];
      if (!node) return;
      node.chip.classList.toggle("is-ok", p.ok);
      if (node.stateEl.textContent !== p.badge) node.stateEl.textContent = p.badge;
    });
  }

  // 右侧活体 CSS 与指标
  const metricStr = [
    live.overflowPx > 0 ? `溢出 +${live.overflowPx}px` : live.voidPx > 80 ? `空带 ${live.voidPx}px` : "零溢出",
    `最窄 ${Math.round(live.minColPx)}px`,
    `主列 ${Math.round(live.focalColPx)}px`,
  ].join(" · ");
  if (codeMetrics.textContent !== metricStr) codeMetrics.textContent = metricStr;
  renderLiveCSS(formatCSSLines(state, ev));

  // 仅在按钮相关状态变化时刷新选中态
  const btnSig = `${state.scene}|${state.unit}|${state.gap}|${state.reflow}|${state.clampGuard}`;
  if (btnSig !== prevButtonsSig) {
    prevButtonsSig = btnSig;
    document.querySelectorAll("[data-scene]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.scene === state.scene);
    });
    document.querySelectorAll("[data-unit]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.unit === state.unit);
    });
    document.querySelectorAll("[data-gap]").forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.gap) === state.gap);
    });
    toggleReflow.setAttribute("aria-pressed", String(state.reflow));
    toggleReflow.textContent = `小屏重排：${state.reflow ? "开" : "关"}`;
    toggleClamp.setAttribute("aria-pressed", String(state.clampGuard));
    toggleClamp.textContent = `行宽护栏：${state.clampGuard ? "开" : "关"}`;
  }
}

// 绑定开场控件事件
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sc = btn.dataset.scene;
    if (!SCENES[sc]) return;
    state.scene = sc;
    syncAll(false);
  });
});

document.querySelectorAll("[data-unit]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.unit = btn.dataset.unit;
    syncAll(false);
  });
});

document.querySelectorAll("[data-gap]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.gap = Number(btn.dataset.gap);
    syncAll(false);
  });
});

toggleReflow.addEventListener("click", () => {
  state.reflow = !state.reflow;
  syncAll(false);
});

toggleClamp.addEventListener("click", () => {
  state.clampGuard = !state.clampGuard;
  syncAll(false);
});

diagFixBtn.addEventListener("click", () => {
  if (diagFixBtn.dataset.action) applyQuickFix(diagFixBtn.dataset.action);
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    Object.assign(state, p.patch);
    if (p.patch.weights) state.weights = [...p.patch.weights];
    syncAll(false);
  });
});

// 画布键盘微调（← → 调整容器宽，Shift 步进 80px）
canvas.addEventListener("keydown", (ev) => {
  const step = ev.shiftKey ? 80 : 24;
  if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    state.width = clampWidth(state.width - step);
    syncAll(true);
  } else if (ev.key === "ArrowRight") {
    ev.preventDefault();
    state.width = clampWidth(state.width + step);
    syncAll(true);
  }
});

// 启动省电渲染循环
stageLoop = loop(canvas, (t, dt, opts) => {
  fluidStage.drawFrame(t, dt, opts);
});
window.addEventListener("resize", () => {
  fluidStage.markDirty();
  if (reducedMotion.matches) stageLoop.draw();
});
syncAll(true);

// ==================== 2. 节 01：演进时间轴 + Marcotte 公式换算器 ====================
const ERAS = [
  {
    title: "2000 · John Allsopp《A Dao of Web Design》（A List Apart，2000-04-07）",
    body: "早期网页设计师带着纸媒习惯，拼命想用固定像素把网页钉成一张不能缩放的印刷品。Allsopp 借《道德经》的「顺势而为」指出：网页的可变性不是缺陷，而是它独有的优势——放弃对每个像素的绝对控制，用相对单位迎接千差万别的屏幕。",
  },
  {
    title: "2009 · Ethan Marcotte《Fluid Grids》（A List Apart，2009-03-03）",
    body: "面对当时流行但僵硬的固定像素网格，Marcotte 提出把 Photoshop 固定稿翻译成流体 CSS 的简明法则：target ÷ context = result（目标列宽 ÷ 父容器总宽 = 百分比占比）。自此「流动」从口号变成了可精确落地的工程算式。",
  },
  {
    title: "2010 · Ethan Marcotte《Responsive Web Design》（A List Apart，2010-05-25；2011 成书）",
    body: "流体网格能按比例伸缩，但一到 320px 手机上六列还是会挤扁。Marcotte 把「流体网格 + 弹性图片 + CSS 媒体查询」合成一套完整方法，奠定了此后十余年的多端网页设计范式（断点重组详见 209 响应式网格）。",
  },
  {
    title: "2016–2017 · W3C CSS Grid Layout Module Level 1（2016-09-29 首版候选推荐标准）",
    body: "浏览器原生引入二维网格与 fr（flex fraction）弹性份数单位，加上 minmax() 范围函数。工程师再也不用把 700 ÷ 988 手算成 70.8502024% 写进样式表，fr 会自动先扣掉固定 gap，再按比例分配剩余空间。",
  },
  {
    title: "2018 · Jen Simmons《Everything You Know About Web Design Just Changed》",
    body: "Simmons 提出「内在网页设计（Intrinsic Web Design）」：把固定轨道、流体百分比、fr 弹性份数与内容固有尺寸混排在同一个网格里，让版面不再只靠生硬断点跳变，而是按内容本身的需求自然伸缩。",
  },
];

const eraDetail = document.getElementById("eraDetail");
const eraCards = [...document.querySelectorAll(".era-card")];

function showEra(idx) {
  const e = ERAS[idx] || ERAS[0];
  eraDetail.innerHTML = `<strong>${e.title}</strong><br>${e.body}`;
  eraCards.forEach((btn, i) => {
    const active = i === idx;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
}
eraCards.forEach((btn) => btn.addEventListener("click", () => showEra(Number(btn.dataset.era))));
showEra(0);

// Marcotte 换算器
const calcState = { target: 700, ctx: 988 };
const targetVal = document.getElementById("targetVal");
const ctxVal = document.getElementById("ctxVal");
const calcResult = document.getElementById("calcResult");
const calcBars = document.getElementById("calcBars");

function renderCalc() {
  calcState.target = Math.max(80, Math.min(calcState.ctx - 40, calcState.target));
  const pct = (calcState.target / calcState.ctx) * 100;
  targetVal.textContent = `${calcState.target}px`;
  ctxVal.textContent = `${calcState.ctx}px`;
  calcResult.textContent = `${pct.toFixed(2)}%`;

  const screens = [
    { name: "手机 390px", w: 390 },
    { name: "平板 960px", w: 960 },
    { name: "桌面 1440px", w: 1440 },
  ];
  calcBars.innerHTML = screens
    .map((s) => {
      const px = Math.round((s.w * pct) / 100);
      return `
      <div class="cb-row">
        <span class="cb-lbl">${s.name}</span>
        <div class="cb-track"><div class="cb-fill" style="width:${pct.toFixed(2)}%"></div></div>
        <span class="cb-px">${px}px (${pct.toFixed(1)}%)</span>
      </div>`;
    })
    .join("");
}

document.getElementById("targetDec").addEventListener("click", () => {
  calcState.target -= 20;
  renderCalc();
});
document.getElementById("targetInc").addEventListener("click", () => {
  calcState.target += 20;
  renderCalc();
});
document.getElementById("ctxDec").addEventListener("click", () => {
  calcState.ctx = Math.max(400, calcState.ctx - 40);
  renderCalc();
});
document.getElementById("ctxInc").addEventListener("click", () => {
  calcState.ctx = Math.min(1920, calcState.ctx + 40);
  renderCalc();
});
document.querySelectorAll("[data-calc]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [t, c] = btn.dataset.calc.split(",").map(Number);
    calcState.target = t;
    calcState.ctx = c;
    document.querySelectorAll("[data-calc]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderCalc();
  });
});
renderCalc();

// ==================== 3. 节 02：% vs fr 含缝双轨剖面 ====================
const trapState = { gap: 0, fixedSide: false };
const trapTracks = document.getElementById("trapTracks");
const trapVerdict = document.getElementById("trapVerdict");
const trapSidebarBtn = document.getElementById("trapSidebarBtn");

function renderTrap() {
  const containerW = 1000;
  const g = trapState.gap;
  const sideW = trapState.fixedSide ? 180 : 0;
  const weights = [10, 10, 20, 30, 20, 10];
  const nCols = trapState.fixedSide ? 7 : 6;
  const totalGaps = (nCols - 1) * g;

  // 轨道 A：纯百分比（严格按 CSS 行为，每个 % 乘以 containerW，再加上固定边栏和 gap）
  const pctCols = [
    ...(trapState.fixedSide ? [{ label: "180px", px: sideW, kind: "side" }] : []),
    ...weights.map((w, i) => ({ label: `${w}%`, px: (containerW * w) / 100, kind: i === 3 ? "focal" : "norm" })),
  ];
  const pctTotal = pctCols.reduce((a, c) => a + c.px, 0) + totalGaps;
  const pctOver = Math.max(0, Math.round(pctTotal - containerW));

  // 轨道 B：fr 份数（先扣除固定边栏与所有 gap，再按 1:1:2:3:2:1 分余量）
  const frAvail = Math.max(0, containerW - sideW - totalGaps);
  const frCols = [
    ...(trapState.fixedSide ? [{ label: "180px", px: sideW, kind: "side" }] : []),
    ...weights.map((w, i) => ({
      label: `${w / 10}fr`,
      px: (frAvail * w) / 100,
      kind: i === 3 ? "focal" : "norm",
    })),
  ];
  const frTotal = Math.round(frCols.reduce((a, c) => a + c.px, 0) + totalGaps);

  const colors = ["#302276", "#3C2B87", "#4B36A2", "#E8689E", "#5943AF", "#34266D"];

  function buildLane(code, cols, total, over) {
    let normIdx = 0;
    const segs = cols
      .map((c) => {
        const pctOfBox = (c.px / containerW) * 100;
        const bg = c.kind === "side" ? "" : c.kind === "focal" ? "" : `background:${colors[normIdx % colors.length]};`;
        if (c.kind !== "side") normIdx++;
        const cls = [
          "lane-seg",
          c.kind === "focal" ? "is-focal" : "",
          c.kind === "side" ? "is-side" : "",
          over > 0 ? "is-overflow" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<div class="${cls}" style="width:${pctOfBox.toFixed(2)}%;${bg}">${c.label}</div>`;
      })
      .join("");
    const gapPct = (g / containerW) * 100;
    return `
      <div class="track-lane">
        <div class="lane-top">
          <code class="lane-code">${code}</code>
          <span class="lane-stat ${over > 0 ? "is-bad" : "is-ok"}">${over > 0 ? `总宽 ${total}px · 爆框 +${over}px` : `总宽 ${total}px · 严丝合缝`}</span>
        </div>
        <div class="lane-frame">
          <span class="lane-frame-tag">父容器 100%（1000px）右壁</span>
          <div class="lane-bar-row" style="gap:${gapPct.toFixed(2)}%">${segs}</div>
        </div>
      </div>`;
  }

  const pctCode = `${trapState.fixedSide ? "180px " : ""}10% 10% 20% 30% 20% 10%${g ? ` ; gap: ${g}px` : ""}`;
  const frCode = `${trapState.fixedSide ? "180px " : ""}1fr 1fr 2fr 3fr 2fr 1fr${g ? ` ; gap: ${g}px` : ""}`;

  trapTracks.innerHTML =
    buildLane(pctCode, pctCols, pctTotal, pctOver) +
    buildLane(frCode, frCols, frTotal, 0);

  if (pctOver === 0) {
    trapVerdict.textContent =
      "零间隙且没有固定侧栏时，百分比与 fr 算出的列宽分毫不差——这也是 208 原海报示例不写 gap 的真正原因。试着点一下「gap: 16px」或「加固定边栏 180px」，立刻能看出两者的分水岭。";
  } else {
    trapVerdict.textContent = `在 1000px 容器里，百分比轨道把 100% 全部占满后又叠加了${trapState.fixedSide ? " 180px 固定栏与" : ""} ${totalGaps}px 栏距，实测冲出右壁 +${pctOver}px；下方 fr 轨道先扣掉固定项与栏距，再把剩余 ${Math.round(frAvail)}px 精确按 1:1:2:3:2:1 分配，永远不溢出。`;
  }
}

document.querySelectorAll("[data-trap-gap]").forEach((btn) => {
  btn.addEventListener("click", () => {
    trapState.gap = Number(btn.dataset.trapGap);
    document.querySelectorAll("[data-trap-gap]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderTrap();
  });
});

trapSidebarBtn.addEventListener("click", () => {
  trapState.fixedSide = !trapState.fixedSide;
  trapSidebarBtn.setAttribute("aria-pressed", String(trapState.fixedSide));
  trapSidebarBtn.textContent = `加固定边栏 180px：${trapState.fixedSide ? "开" : "关"}`;
  renderTrap();
});
renderTrap();

// ==================== 4. 节 03：行长与护栏扫描仪 ====================
const measureRange = document.getElementById("measureRange");
const measureWidthOut = document.getElementById("measureWidthOut");
const measureCol = document.getElementById("measureCol");
const measureColTag = document.getElementById("measureColTag");
const measureStats = document.getElementById("measureStats");
let guardOn = false;

function renderMeasure() {
  const vw = Number(measureRange.value);
  measureWidthOut.textContent = `${vw}px`;

  // 裸奔纯流体：主栏固定按 50% 随屏幕一路涨落；护栏流体：小屏 92%，大屏受 max-width + clamp(300px, 48%, 620px) 保护
  let colPx = Math.round(vw * 0.5);
  let ruleLabel = "纯流体 50%（无护栏）";
  if (guardOn) {
    if (vw < 768) {
      colPx = Math.round(vw * 0.92);
      ruleLabel = "小屏自动单栏 92%";
    } else {
      const cappedContainer = Math.min(vw, 1440);
      colPx = Math.max(320, Math.min(620, Math.round(cappedContainer * 0.45)));
      ruleLabel = "护栏 clamp(320px, 45%, 620px)";
    }
  }

  // 映射为屏幕内可视宽（最大按 100% 占容器，视觉上真实感受长短）
  const visualPx = Math.max(180, Math.min(980, colPx));
  measureCol.style.width = `${visualPx}px`;

  const zhChars = Math.max(8, Math.round((colPx - 40) / 15.6));
  const enChars = Math.max(16, Math.round((colPx - 40) / 8.5));
  const totalZh = 114;
  const estLines = Math.max(1, Math.ceil(totalZh / zhChars));

  let zone = "舒适行长";
  let isWarn = false;
  if (zhChars < 20) {
    zone = "过窄碎行（频繁换行）";
    isWarn = true;
  } else if (zhChars > 42) {
    zone = "过长迷路（回行跨度大）";
    isWarn = true;
  }

  measureCol.classList.toggle("is-warn", isWarn);
  measureColTag.textContent = `${ruleLabel} · 实算列宽 ${colPx}px`;

  measureStats.innerHTML = `
    <div class="m-stat"><span class="m-stat-k">模拟主栏实宽</span><span class="m-stat-v">${colPx}px</span></div>
    <div class="m-stat"><span class="m-stat-k">汉字约计（经验值）</span><span class="m-stat-v ${isWarn ? "is-warn" : "is-ok"}">${zhChars} 字/行</span></div>
    <div class="m-stat"><span class="m-stat-k">英文约计（Bringhurst 45–75）</span><span class="m-stat-v ${enChars > 75 || enChars < 38 ? "is-warn" : "is-ok"}">${enChars} ch</span></div>
    <div class="m-stat"><span class="m-stat-k">阅读节奏判别（约 ${estLines} 行）</span><span class="m-stat-v ${isWarn ? "is-warn" : "is-ok"}">${zone}</span></div>
  `;
}

measureRange.addEventListener("input", renderMeasure);
document.querySelectorAll("[data-guard]").forEach((btn) => {
  btn.addEventListener("click", () => {
    guardOn = btn.dataset.guard === "on";
    document.querySelectorAll("[data-guard]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderMeasure();
  });
});
renderMeasure();

// ==================== 5. 节 04：四大真场景活体 CSS Grid 橱窗 ====================
const SHOWCASES = {
  web: {
    css: (w) =>
      w < 768
        ? "grid-template-columns: 1fr; gap: 10px; /* <768px 堆叠 */"
        : "max-width: 1440px; grid-template-columns: 1fr 3fr 1fr; gap: 12px;",
    note: (w) =>
      w < 768
        ? "手机 360px 下自动折为单列，主内容区抢占首屏，左右辅助栏顺流排到下方。"
        : `在 ${w}px 下采用 1fr : 3fr : 1fr 比例流道，中间正文永远占 60% 视觉权重，两侧导览与推荐等比伸缩。`,
    render: (w) => {
      const cols = w < 768 ? "1fr" : "1fr 3fr 1fr";
      return `<div class="demo-grid" style="grid-template-columns:${cols}">
        <div class="demo-cell"><strong>导航</strong><span>${w < 768 ? "100%" : "20% · 1fr"}</span></div>
        <div class="demo-cell is-hero"><strong>核心正文主栏</strong><span>${w < 768 ? "100% 首屏聚焦" : "60% · 3fr 随容器伸缩"}</span></div>
        <div class="demo-cell is-mid"><strong>推荐</strong><span>${w < 768 ? "100%" : "20% · 1fr"}</span></div>
      </div>`;
    },
  },
  dash: {
    css: (w) =>
      w < 768
        ? "grid-template-columns: 1fr; gap: 10px;"
        : w < 1024
          ? "grid-template-columns: 1fr 1fr; gap: 10px;"
          : "grid-template-columns: 1fr 2fr 1fr; gap: 12px;",
    note: (w) =>
      w < 768
        ? "移动端数据看板把趋势主图置顶满宽，避免多列把折线图挤成竖条。"
        : `数据看板在 ${w}px 下让中间趋势图拿到 2 倍弹性份数，左右指标卡与实时流水同步补位。`,
    render: (w) => {
      const cols = w < 768 ? "1fr" : w < 1024 ? "1fr 1fr" : "1fr 2fr 1fr";
      return `<div class="demo-grid" style="grid-template-columns:${cols}">
        <div class="demo-cell"><strong>核心指标 KPI</strong><span>活跃 +18.4% · 留存 64%</span></div>
        <div class="demo-cell is-hero"><strong>实时流量趋势主图</strong><span>${w < 768 ? "满宽折线区" : "2fr 弹性加宽主视窗"}</span></div>
        <div class="demo-cell is-mid"><strong>区域分布排行</strong><span>华东 / 华南 / 华北</span></div>
      </div>`;
    },
  },
  cards: {
    css: () => "grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;",
    note: (w) =>
      `无需写一句媒体查询：minmax(180px, 1fr) 保证单卡绝不窄于 180px，空间够就自动在 ${w}px 里多排一列，多余像素由所有卡片均分。`,
    render: (w) => {
      const count = w <= 360 ? 1 : w <= 768 ? 2 : w <= 1280 ? 4 : 4;
      return `<div class="demo-grid" style="grid-template-columns:repeat(${count}, minmax(0, 1fr))">
        <div class="demo-cell is-hero"><strong>作品卡 01</strong><span>minmax(180px, 1fr)</span></div>
        <div class="demo-cell is-mid"><strong>作品卡 02</strong><span>自动填充余量</span></div>
        <div class="demo-cell"><strong>作品卡 03</strong><span>每列等宽对齐</span></div>
        <div class="demo-cell is-mid"><strong>作品卡 04</strong><span>零断点折行</span></div>
      </div>`;
    },
  },
  editorial: {
    css: (w) =>
      w < 768
        ? "grid-template-columns: 1fr; gap: 10px;"
        : "grid-template-columns: minmax(120px, 1fr) minmax(300px, 3fr) minmax(140px, 1.2fr); max-width: 1280px;",
    note: (w) =>
      `杂志专题在 ${w}px 下既维持左注、中正文、右引语的三段节奏，又通过 max-width 锁住正文不超舒适行长。`,
    render: (w) => {
      const cols = w < 768 ? "1fr" : "1fr 3fr 1.2fr";
      return `<div class="demo-grid" style="grid-template-columns:${cols}">
        <div class="demo-cell"><strong>章节边注</strong><span>第 04 节 · 图注</span></div>
        <div class="demo-cell is-hero"><strong>深度特写正文</strong><span>字距与行长受护栏保护，阅读不累眼</span></div>
        <div class="demo-cell is-mid"><strong>核心引语</strong><span>「流动的空间，不变的秩序」</span></div>
      </div>`;
    },
  },
};

let activeSc = "web";
let activeSw = 1280;
const showcaseFrame = document.getElementById("showcaseFrame");
const showcaseCss = document.getElementById("showcaseCss");
const showcaseNote = document.getElementById("showcaseNote");

function renderShowcase() {
  const sc = SHOWCASES[activeSc];
  // 按比例在页面可用宽内展示设备尺寸差异
  const maxWMap = { 360: "340px", 768: "640px", 1280: "960px", 1600: "100%" };
  showcaseFrame.style.maxWidth = maxWMap[activeSw] || "100%";
  showcaseFrame.innerHTML = sc.render(activeSw);
  showcaseCss.textContent = sc.css(activeSw);
  showcaseNote.textContent = sc.note(activeSw);
}

document.querySelectorAll("[data-sc]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeSc = btn.dataset.sc;
    document.querySelectorAll("[data-sc]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderShowcase();
  });
});

document.querySelectorAll("[data-sw]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeSw = Number(btn.dataset.sw);
    document.querySelectorAll("[data-sw]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderShowcase();
  });
});
renderShowcase();

// ==================== 6. 节 05：三例项目分诊卡 ====================
const TRIAGE = [
  {
    title: "案例一 · 240 页建筑精装画册",
    desc: "开本固定为 210 × 285mm，要求全书跨页基线与图版裁切毫米级严丝合缝。",
    best: "other",
    yesMsg: "不太适合：纸张物理开本永远不会伸缩，流体比例在这里没有收益，反而失去毫米级定点精度。应改用 207 固定网格 + 198 基线网格。",
    noMsg: "判断准确：纸质画册介质尺寸恒定，应直接选用 207 固定网格配合 198 基线网格，锁定精确页边距与栏宽。",
  },
  {
    title: "案例二 · 跨端 SaaS 运营数据看板",
    desc: "团队同时在 13 寸笔记本、27 寸外接屏和平板上盯实时营收曲线与卡片指标。",
    best: "fluid",
    yesMsg: "判断准确：多尺寸屏幕下趋势主图与卡片列表需要平滑吃满空间并保持主次比例，正适合 fr + minmax() 流体网格。",
    noMsg: "错失了最对口的场景：这类多屏看板若写死像素，小本子会横向滚、大屏会大片留白；流体网格加护栏才是最优解。",
  },
  {
    title: "案例三 · 音乐节先锋实验主视觉海报",
    desc: "需要巨大斜切标题冲破画框、照片叠压文字，追求反常规视觉爆发力。",
    best: "other",
    yesMsg: "不太适合：流体网格追求的是空间伸缩中的理性秩序，用来做先锋海报容易显得板正。改用 210 破格网格或 200 非对称网格更有张力。",
    noMsg: "判断准确：先锋海报要的是情绪冲突而非多屏自适应，用 210 破格网格或 200 非对称网格更合适。",
  },
];

const triageCards = document.getElementById("triageCards");
triageCards.innerHTML = TRIAGE.map(
  (item, idx) => `
  <article class="t-card" data-triage="${idx}">
    <h4>${item.title}</h4>
    <p>${item.desc}</p>
    <div class="t-btns">
      <button type="button" class="t-btn" data-pick="fluid">用流体网格</button>
      <button type="button" class="t-btn" data-pick="other">换用别法</button>
    </div>
    <div class="t-result" hidden></div>
  </article>`
).join("");

triageCards.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".t-btn");
  if (!btn) return;
  const card = btn.closest(".t-card");
  const idx = Number(card.dataset.triage);
  const item = TRIAGE[idx];
  const pick = btn.dataset.pick;
  card.querySelectorAll(".t-btn").forEach((b) => b.classList.toggle("is-picked", b === btn));
  const out = card.querySelector(".t-result");
  const ok = pick === item.best;
  out.hidden = false;
  out.classList.toggle("is-wrong", !ok);
  out.textContent = pick === "fluid" ? item.yesMsg : item.noMsg;
});

// ==================== 7. 节 06：小练习（单变量四选一） ====================
const QUIZ = [
  {
    key: "A",
    code: "width: 1200px;\ngrid-template-columns: 120px 120px 240px 360px 240px 120px;\ngap: 20px;",
    bars: [10, 10, 20, 30, 20, 10],
    ok: false,
    reason: "方案 A 把容器与六列全部写死成固定像素（实际占宽 1300px）。在 390px 手机上会严重溢出横向滚屏，在 1920px 宽屏上又无法弹性延展，不属于流体网格。",
  },
  {
    key: "B",
    code: "width: 100%;\ngrid-template-columns: 10% 10% 20% 30% 20% 10%;\ngap: 20px;",
    bars: [10, 10, 20, 30, 20, 10],
    ok: false,
    reason: "方案 B 是最隐蔽的真实 CSS 暗礁：六列百分比加起来已经占满 100%，再叠 5 条 20px 栏距，总宽恒定等于 100% + 100px，在任何屏幕宽度下都会向右爆框溢出；且在 390px 手机上没重排，10% 列被压成 39px 细缝。",
  },
  {
    key: "C",
    code: "width: 100%;\ngrid-template-columns: 1fr 1fr 2fr 3fr 2fr 1fr;\ngap: 20px;",
    bars: [10, 10, 20, 30, 20, 10],
    ok: false,
    reason: "方案 C 用 fr 漂亮地解决了栏距爆框问题，但缺少两端护栏：1920px 宽屏下没有 max-width 上限会把主文列拉得过宽，390px 手机下没有重排会把 6 列压成每列不足 50px 的竖条。",
  },
  {
    key: "D",
    code: "width: 100%; max-width: 1440px;\ngrid-template-columns: 1fr 1fr 2fr 3fr 2fr 1fr; gap: 20px;\n/* < 768px 切换为单列 1fr 堆叠 */",
    bars: [10, 10, 20, 30, 20, 10],
    ok: true,
    reason: "答对了！方案 D 三步全部命中：用 fr 替代纯百分比，先扣除 5 条 20px 栏距再按 1:1:2:3:2:1 分配，零溢出；用 max-width: 1440px 给宽屏行长兜底；并在 <768px 切换单列堆叠保住手机可读性。",
  },
];

const quizColors = ["#302276", "#3C2B87", "#4B36A2", "#E8689E", "#5943AF", "#34266D"];
const quizOptions = document.getElementById("quizOptions");
const quizFeedback = document.getElementById("quizFeedback");

quizOptions.innerHTML = QUIZ.map(
  (q) => `
  <button type="button" class="q-opt" data-quiz="${q.key}" role="radio" aria-checked="false">
    <div class="q-opt-head">
      <span class="q-letter">${q.key}</span>
      <strong>方案 ${q.key}</strong>
    </div>
    <div class="q-opt-mini" aria-hidden="true">${q.bars
      .map((b, i) => `<span style="flex:${b} 1 0;background:${quizColors[i]}"></span>`)
      .join("")}</div>
    <pre class="q-opt-code">${q.code}</pre>
  </button>`
).join("");

quizOptions.addEventListener("click", (ev) => {
  const opt = ev.target.closest(".q-opt");
  if (!opt) return;
  const pick = QUIZ.find((q) => q.key === opt.dataset.quiz);
  if (!pick) return;

  quizOptions.querySelectorAll(".q-opt").forEach((el) => {
    const isMe = el === opt;
    el.setAttribute("aria-checked", String(isMe));
    el.classList.toggle("is-selected", isMe);
    el.classList.toggle("is-correct", isMe && pick.ok);
    el.classList.toggle("is-wrong", isMe && !pick.ok);
  });

  quizFeedback.hidden = false;
  quizFeedback.classList.toggle("is-wrong", !pick.ok);
  quizFeedback.textContent = pick.reason;
});

// ==================== 8. 节 07：原海报灯箱（放大 / 拖动 / Esc 关闭） ====================
const posterImg = document.getElementById("poster");
const posterOpenBtn = document.getElementById("posterOpenBtn");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbStage = document.getElementById("lbStage");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLightbox() {
  lbImg.src = posterImg.currentSrc || posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lbClose").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLightbox);
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lbZoomOut").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lbReset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const delta = ev.deltaY < 0 ? 0.2 : -0.2;
  lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (ev) => {
  if (ev.target === lbStage) {
    closeLightbox();
    return;
  }
  lbDrag = { x: ev.clientX - lbX, y: ev.clientY - lbY, id: ev.pointerId };
  lbStage.setPointerCapture?.(ev.pointerId);
});

lbStage.addEventListener("pointermove", (ev) => {
  if (!lbDrag || ev.pointerId !== lbDrag.id) return;
  lbX = ev.clientX - lbDrag.x;
  lbY = ev.clientY - lbDrag.y;
  applyLbTransform();
});

lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
});
lbStage.addEventListener("pointercancel", () => {
  lbDrag = null;
});

window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});
