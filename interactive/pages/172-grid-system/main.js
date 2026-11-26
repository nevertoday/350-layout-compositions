// 172 网格系统 — 主入口：单真源状态管理 + 控件绑定 + 全节初始化
import {
  createBrokenState,
  applyPreset,
  clamp,
  colMetricsNorm,
  snapBlockToGrid,
} from "./model.js";
import { initHeroCanvas } from "./hero-canvas.js";
import {
  renderHeroMinis,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

let state = createBrokenState("poster");

const canvas = document.getElementById("hero-canvas");
const sealEl = document.getElementById("hero-seal");
const probeAlign = document.getElementById("probe-alignment");
const probeOrder = document.getElementById("probe-order");
const probeRhythm = document.getElementById("probe-rhythm");

const gutterInput = document.getElementById("ctrl-gutter");
const gutterOut = document.getElementById("out-gutter");
const snapBtn = document.getElementById("ctrl-snap");
const xrayBtn = document.getElementById("ctrl-xray");
const colBtns = [...document.querySelectorAll("[data-cols]")];
const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

const auditBadge = document.getElementById("audit-badge");
const auditHeadline = document.getElementById("audit-headline");
const auditWhy = document.getElementById("audit-why");
const auditHow = document.getElementById("audit-how");
const btnFix = document.getElementById("btn-fix");
const btnReset = document.getElementById("btn-reset");
const laHead = document.getElementById("la-head");
const laSub = document.getElementById("la-sub");
const btnFixLand = document.getElementById("btn-fix-land");
const btnResetLand = document.getElementById("btn-reset-land");

const mPosture = document.getElementById("m-posture");
const mColDrift = document.getElementById("m-col-drift");
const mHangDrift = document.getElementById("m-hang-drift");
const mGutter = document.getElementById("m-gutter");
const mHierarchy = document.getElementById("m-hierarchy");
const mAxes = document.getElementById("m-axes");

const selName = document.getElementById("sel-name");
const selSpan = document.getElementById("sel-span");
const btnSpanDec = document.getElementById("btn-span-dec");
const btnSpanInc = document.getElementById("btn-span-inc");
const btnSnapOne = document.getElementById("btn-snap-one");

let lastFixAction = "fixAlign";
let lastAuditKey = "";
let lastMiniKey = "";

function syncControlsFromState() {
  gutterInput.value = String(state.gutter);
  gutterOut.textContent = `${state.gutter}px`;

  snapBtn.classList.toggle("is-active", state.snap);
  snapBtn.setAttribute("aria-pressed", String(state.snap));
  snapBtn.textContent = state.snap ? "吸附：开" : "吸附：关";

  xrayBtn.classList.toggle("is-active", state.xray);
  xrayBtn.setAttribute("aria-pressed", String(state.xray));
  xrayBtn.textContent = state.xray ? "透视网格：开" : "透视网格：关";

  colBtns.forEach((b) => {
    const on = Number(b.dataset.cols) === state.cols;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  specimenBtns.forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  const sel = state.blocks.find((b) => b.id === state.selectedId) || state.blocks[0];
  selName.textContent = sel.name;
  selSpan.textContent = `跨 ${sel.colSpan} 列`;
}

function updateAuditUI(audit) {
  const isOk = audit.score === 4;
  lastFixAction = audit.issue.fixAction;

  // 仅当读数或微缩图语义发生变化时更新 DOM，拖动过程中杜绝无意义 DOM/SVG 重建
  const auditKey = `${audit.score}|${audit.issue.code}|${audit.issue.shortTag}|${audit.overlaps.length}|${audit.maxColDriftPx}|${audit.maxHangDriftPx}|${audit.gutterPx}|${audit.hierarchyRatio.toFixed(1)}|${audit.fillPct}|${audit.uniqueAxes}|${state.xray}`;
  if (auditKey === lastAuditKey) return;
  lastAuditKey = auditKey;

  sealEl.textContent = `${audit.score}/4 · ${audit.issue.shortTag}`;
  sealEl.classList.toggle("is-ok", isOk);
  sealEl.classList.toggle("is-err", !isOk);

  // 原海报右侧三枚关键词探针
  const setProbe = (el, info) => {
    if (!el) return;
    el.textContent = info.badge;
    el.classList.toggle("is-ok", info.ok);
    el.classList.toggle("is-err", !info.ok);
  };
  setProbe(probeAlign, audit.spine.alignment);
  setProbe(probeOrder, audit.spine.order);
  setProbe(probeRhythm, audit.spine.rhythm);

  // 支柱 1：白话诊单
  auditBadge.textContent = `${audit.score}/4`;
  auditBadge.classList.toggle("is-ok", isOk);
  auditHeadline.textContent = audit.issue.headline;
  auditWhy.textContent = audit.issue.why;
  auditHow.textContent = `怎么改：${audit.issue.how}`;
  btnFix.textContent = audit.issue.fixLabel;
  if (laHead) laHead.textContent = audit.issue.headline;
  if (laSub) laSub.textContent = audit.issue.how;
  if (btnFixLand) btnFixLand.textContent = audit.issue.fixLabel;

  // 支柱 2：实测指标（全部来自 model.js 单真源）
  mPosture.textContent = audit.posture;
  mColDrift.textContent = audit.overlaps.length > 0 ? `撞块 ${audit.overlaps.length}处` : `${audit.maxColDriftPx}px`;
  mColDrift.className = `metric-v ${audit.pCols ? "is-ok" : "is-err"}`;

  mHangDrift.textContent = `${audit.maxHangDriftPx}px`;
  mHangDrift.className = `metric-v ${audit.pHang ? "is-ok" : "is-err"}`;

  mGutter.textContent = `${audit.gutterPx}px · ${audit.gutterRatio.toFixed(1)}×`;
  mGutter.className = `metric-v ${audit.pGutter ? "is-ok" : "is-err"}`;

  mHierarchy.textContent = `${audit.hierarchyRatio.toFixed(1)}× · 占${audit.fillPct}%`;
  mHierarchy.className = `metric-v ${audit.pRhythm ? "is-ok" : "is-err"}`;

  mAxes.textContent = `实测纵轴 ${audit.uniqueAxes} 条`;

  // 三枚原海报活体微缩图（按状态键缓存）
  const miniKey = `${state.cols}|${state.gutter}|${audit.pCols}|${audit.pHang}|${audit.pGutter}|${audit.pRhythm}`;
  if (miniKey !== lastMiniKey) {
    lastMiniKey = miniKey;
    renderHeroMinis(state, audit);
  }
}

const heroStage = initHeroCanvas(
  canvas,
  () => state,
  (next, isDragging = false) => {
    state = next;
    if (!isDragging) syncControlsFromState();
    heroStage.redraw(isDragging);
  },
  updateAuditUI
);

function setStateAndDraw(next) {
  state = next;
  syncControlsFromState();
  heroStage.redraw();
}

// 切换列数时，自动把块重映射到新列数对应的合理轨道（不丢失当前对齐/偏移语义）
colBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextCols = Number(btn.dataset.cols);
    if (nextCols === state.cols) return;
    const geom = heroStage.getGeom();
    const { starts } = colMetricsNorm(nextCols, state.gutter, geom.innerW);
    const scale = nextCols / state.cols;
    const nextBlocks = state.blocks.map((b) => {
      const nextSpan = clamp(Math.round(b.colSpan * scale), 1, Math.min(nextCols, Math.max(2, Math.floor(nextCols / 2))));
      const colIdx = clamp(Math.round(b.u * nextCols), 0, nextCols - nextSpan);
      return { ...b, colSpan: nextSpan, u: starts[colIdx] };
    });
    setStateAndDraw({ ...state, cols: nextCols, blocks: nextBlocks });
  });
});

gutterInput.addEventListener("input", () => {
  const nextGutter = Number(gutterInput.value);
  const geom = heroStage.getGeom();
  // 如果当前吸附开着，改栏距时同步让已齐线的块保持紧贴列轨
  let nextBlocks = state.blocks;
  if (state.snap) {
    const { starts } = colMetricsNorm(state.cols, nextGutter, geom.innerW);
    nextBlocks = state.blocks.map((b, i) => {
      const gb = geom.blocks[i];
      if (gb && gb.colDriftRefPx <= 5) {
        const idx = clamp(gb.nearestCol.index, 0, state.cols - b.colSpan);
        return { ...b, u: starts[idx] };
      }
      return b;
    });
  }
  setStateAndDraw({ ...state, gutter: nextGutter, blocks: nextBlocks });
});

snapBtn.addEventListener("click", () => {
  setStateAndDraw({ ...state, snap: !state.snap });
});

xrayBtn.addEventListener("click", () => {
  setStateAndDraw({ ...state, xray: !state.xray });
});

specimenBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    setStateAndDraw({ ...state, specimen: btn.dataset.specimen });
  });
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const geom = heroStage.getGeom();
    setStateAndDraw(applyPreset(state, btn.dataset.preset, geom.innerW));
  });
});

btnReset.addEventListener("click", () => {
  setStateAndDraw(createBrokenState(state.specimen));
});
if (btnResetLand) btnResetLand.addEventListener("click", () => btnReset.click());
if (btnFixLand) btnFixLand.addEventListener("click", () => btnFix.click());

// 单步情境纠偏按钮（严格按照当前首要诊断执行对应修复）
btnFix.addEventListener("click", () => {
  const geom = heroStage.getGeom();
  if (lastFixAction === "fixAlign") {
    // 贴合列轨、解开重叠并开启吸附
    const clean = applyPreset(state, state.cols === 8 ? "swiss8" : "classic6", geom.innerW);
    // 保留用户当前栏距（除非栏距本来也在坏态？单步修复先解撞块与脱轨，让用户能看清下一步修栏距！）
    if (state.gutter < 10 || state.gutter > 38) {
      const { starts } = colMetricsNorm(clean.cols, state.gutter, geom.innerW);
      const colIdxs = clean.cols === 8 ? [0, 3, 3, 6, 6, 0, 4, 6] : [0, 2, 2, 5, 4, 0, 2, 4];
      clean.gutter = state.gutter;
      clean.blocks = clean.blocks.map((b, i) => ({ ...b, u: starts[colIdxs[i]] }));
    }
    setStateAndDraw(clean);
  } else if (lastFixAction === "fixHang") {
    const nextBlocks = state.blocks.map((b, i) => {
      const gb = geom.blocks[i];
      return gb && gb.nearestHang ? { ...b, v: gb.nearestHang.v } : b;
    });
    setStateAndDraw({ ...state, snap: true, blocks: nextBlocks });
  } else if (lastFixAction === "fixGutter") {
    const nextGutter = 20;
    const { starts } = colMetricsNorm(state.cols, nextGutter, geom.innerW);
    const nextBlocks = state.blocks.map((b, i) => {
      const gb = geom.blocks[i];
      const idx = clamp(gb ? gb.nearestCol.index : 0, 0, state.cols - b.colSpan);
      return { ...b, u: starts[idx] };
    });
    setStateAndDraw({ ...state, gutter: nextGutter, snap: true, blocks: nextBlocks });
  } else if (lastFixAction === "fixHierarchy" || lastFixAction === "fixClassic") {
    setStateAndDraw(applyPreset(state, "classic6", geom.innerW));
  } else if (lastFixAction === "toggleXray") {
    setStateAndDraw({ ...state, xray: !state.xray });
  }
});

// 选中模块跨列微调与单块贴格
function changeSelectedSpan(delta) {
  const geom = heroStage.getGeom();
  const nextBlocks = state.blocks.map((b) => {
    if (b.id !== state.selectedId) return b;
    const maxSpan = Math.min(state.cols, 4);
    const nextSpan = clamp(b.colSpan + delta, 1, maxSpan);
    const { starts } = colMetricsNorm(state.cols, state.gutter, geom.innerW);
    const curCol = clamp(Math.round(b.u * state.cols), 0, state.cols - nextSpan);
    return { ...b, colSpan: nextSpan, u: state.snap ? starts[curCol] : clamp(b.u, 0, starts[state.cols - nextSpan]) };
  });
  setStateAndDraw({ ...state, blocks: nextBlocks });
}

btnSpanDec.addEventListener("click", () => changeSelectedSpan(-1));
btnSpanInc.addEventListener("click", () => changeSelectedSpan(1));
btnSnapOne.addEventListener("click", () => {
  const geom = heroStage.getGeom();
  const gb = geom.blocks.find((b) => b.id === state.selectedId);
  if (!gb) return;
  const snapped = snapBlockToGrid(gb, geom);
  const nextBlocks = state.blocks.map((b) => (b.id === gb.id ? { ...b, ...snapped } : b));
  setStateAndDraw({ ...state, blocks: nextBlocks });
});

// 初始化全部章节与首次绘制
syncControlsFromState();
heroStage.redraw();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
