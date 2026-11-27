// 183 矩形绕排 · 主入口：单真源状态绑定 + 全页交互装配
import {
  INITIAL_STATE,
  SOLUTIONS,
  FAULT_PRESETS,
  evaluateWrap,
  normalizeState,
  TOTAL_ROWS,
} from "./model.js";
import { createHeroStage, updateSchematicSVG } from "./hero-stage.js";
import {
  initReturnEdgeComparator,
  initStandoffLoupe,
  initModularGridBoard,
  initHistoryRail,
  initSqueezeStressTest,
  initPracticeQuiz,
  initPosterLightbox,
} from "./sections.js";

let state = normalizeState(INITIAL_STATE);
let currentEval = evaluateWrap(state);

const canvas = document.getElementById("hero-canvas");
const stage = createHeroStage(
  canvas,
  () => currentEval,
  (patch) => setState(patch)
);

// DOM 引用
const els = {
  topBadge: document.getElementById("top-status-badge"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagTier: document.getElementById("diag-tier"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagFix: document.getElementById("diag-fix"),
  ctxCaption: document.getElementById("ctx-caption"),
  // 滑轨与读数
  rngW: document.getElementById("rng-bw"),
  valW: document.getElementById("val-bw"),
  rngSX: document.getElementById("rng-sx"),
  valSX: document.getElementById("val-sx"),
  rngSY: document.getElementById("rng-sy"),
  valSY: document.getElementById("val-sy"),
  // 快捷按钮
  btnAlign: document.getElementById("btn-align"),
  btnBase: document.getElementById("btn-baseline"),
  btnFix: document.getElementById("btn-calibrate"),
  btnReset: document.getElementById("btn-reset-fault"),
  btnScan: document.getElementById("btn-scan"),
  btnTopScan: document.getElementById("btn-top-scan"),
  // 底部五词探针
  kwBar: document.getElementById("hero-kw-bar"),
  // 刊头自示范微型矩形块
  titleDemoBlock: document.getElementById("title-demo-block"),
};

const ctxBtns = [...document.querySelectorAll("[data-ctx]")];
const modeBtns = [...document.querySelectorAll("[data-mode]")];
const solBtns = [...document.querySelectorAll("[data-sol]")];
const faultBtns = [...document.querySelectorAll("[data-fault]")];

// 预建五词探针节点，拖动期间原地更新文本与类名，避免高频重建 DOM
let kwNodes = null;
function syncKeywords(list) {
  if (!kwNodes) {
    els.kwBar.innerHTML = list
      .map(
        (k, i) => `
      <span class="kw-item" data-kw-idx="${i}">
        <span class="kw-dot" aria-hidden="true"></span>
        <span class="kw-word">${k.word}</span>
        <span class="kw-read"></span>
      </span>
      ${i < list.length - 1 ? `<span class="kw-sep" aria-hidden="true">/</span>` : ""}
    `
      )
      .join("");
    kwNodes = [...els.kwBar.querySelectorAll(".kw-item")].map((el) => ({
      el,
      read: el.querySelector(".kw-read"),
    }));
  }
  for (let i = 0; i < list.length; i++) {
    const k = list[i];
    const node = kwNodes[i];
    node.el.className = `kw-item ${k.ok ? "is-ok" : "is-err"}`;
    if (node.read.textContent !== k.reading) node.read.textContent = k.reading;
  }
}

function syncUI() {
  const ev = currentEval;
  const s = ev.state;

  // 顶部与诊单状态
  els.topBadge.textContent = ev.statusShort;
  els.topBadge.className = `status-pill ${ev.passed ? "is-ok" : "is-err"}`;

  els.diagCard.classList.toggle("is-pass", ev.passed);
  els.diagBadge.textContent = ev.statusShort;
  els.diagBadge.className = `diag-badge ${ev.passed ? "is-ok" : "is-err"}`;
  els.diagTier.textContent = `秩序档位：${ev.orderTier}（示意）`;
  els.diagTitle.textContent = ev.headline;
  els.diagWhy.textContent = ev.explanation;
  els.diagFix.textContent = ev.actionHint;
  els.ctxCaption.textContent = ev.ctx.caption;

  // 滑轨与实时值
  els.rngW.value = String(Math.round(s.bw * 100));
  els.valW.textContent = `${ev.blockWidthPct}%`;
  els.rngSX.value = String(s.standoffX);
  els.valSX.textContent = `${s.standoffX}px`;
  els.rngSY.value = String(s.standoffY);
  els.valSY.textContent = `${s.standoffY}px`;

  // 语境 / 模式 / 开关按钮状态
  ctxBtns.forEach((b) => {
    const on = b.dataset.ctx === s.context;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  modeBtns.forEach((b) => {
    const on = b.dataset.mode === s.mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  els.btnAlign.textContent = s.align === "left" ? "对齐：左齐 176" : "对齐：两端 179";
  els.btnAlign.classList.toggle("is-warn", ev.hasJustifyRiver);
  els.btnAlign.setAttribute("aria-pressed", String(s.align === "justify"));

  els.btnBase.textContent = s.baselineLock ? "基线网锁：开" : "基线网锁：关";
  els.btnBase.classList.toggle("is-active", s.baselineLock);
  els.btnBase.classList.toggle("is-warn", !ev.baselineAligned);
  els.btnBase.setAttribute("aria-pressed", String(s.baselineLock));

  // 自示范刊头小金块随图块宽度与通过态呼应微调
  if (els.titleDemoBlock) {
    els.titleDemoBlock.style.width = `${Math.round(14 + s.bw * 26)}px`;
    els.titleDemoBlock.classList.toggle("is-ok", ev.passed);
  }

  // 1:1 联动原海报右侧「绕排示意」SVG
  updateSchematicSVG(ev);

  // 底部 5 个原海报关键词实时探针（原地更新零 DOM 重建）
  syncKeywords(ev.keywordsStatus);

  stage.redraw();
}

function setState(patch) {
  state = normalizeState({ ...state, ...patch });
  currentEval = evaluateWrap(state);
  syncUI();
}

// 绑定开场全部控件
ctxBtns.forEach((b) => b.addEventListener("click", () => setState({ context: b.dataset.ctx })));
modeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const mode = b.dataset.mode;
    const patch = { mode };
    // 切到贴边单侧时若正好在正中，默认轻靠向右缘以便立刻看到单侧直缘效果
    if (mode === "single" && Math.abs(state.bx - 0.5) < 0.08) {
      patch.bx = 1 - state.bw / 2;
    }
    if (mode === "twocol" || mode === "jump") {
      patch.bx = 0.5;
    }
    setState(patch);
  });
});

els.rngW.addEventListener("input", () => setState({ bw: +els.rngW.value / 100 }));
els.rngSX.addEventListener("input", () => setState({ standoffX: +els.rngSX.value }));
els.rngSY.addEventListener("input", () => setState({ standoffY: +els.rngSY.value }));

els.btnAlign.addEventListener("click", () =>
  setState({ align: state.align === "left" ? "justify" : "left" })
);
els.btnBase.addEventListener("click", () =>
  setState({ baselineLock: !state.baselineLock })
);

els.btnFix.addEventListener("click", () => setState(SOLUTIONS.rightFlush.patch));
els.btnReset.addEventListener("click", () => setState({ ...INITIAL_STATE, context: state.context }));

const fireScan = () => stage.triggerScan();
els.btnScan.addEventListener("click", fireScan);
els.btnTopScan.addEventListener("click", fireScan);

solBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const sol = SOLUTIONS[b.dataset.sol];
    if (sol) setState(sol.patch);
  });
});

faultBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const fp = FAULT_PRESETS[b.dataset.fault];
    if (fp) setState(fp.patch);
  });
});

// 键盘操作：方向键微调图块位置，Space 发射视线绕行验真（聚焦在按钮/滑轨时不劫持）
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (e.code === "Space" && tag !== "BUTTON" && tag !== "A") {
    e.preventDefault();
    fireScan();
    return;
  }
  const stepX = 0.04;
  const stepY = 1 / TOTAL_ROWS;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setState({ bx: state.bx - stepX });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setState({ bx: state.bx + stepX });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setState({ by: state.by - stepY });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setState({ by: state.by + stepY });
  }
});

// 首次渲染与 01–07 节装配
syncUI();
initReturnEdgeComparator();
initStandoffLoupe();
initModularGridBoard();
initHistoryRail();
initSqueezeStressTest();
initPracticeQuiz();
initPosterLightbox();
