import { loop, reducedMotion } from "../../lib/stage.js";
import {
  CAL_PRESETS,
  computeHeadlineFontSize,
  diagnoseCalibrator,
  evaluateRange,
  FLAWS,
  gridMetrics,
  GROUPING_MODES,
  HEADLINE_LENGTHS,
  presetsForCols,
  QUIZ,
  rangeForCols,
  SCENARIOS,
  snapRange,
} from "./model.js";

const $ = (id) => document.getElementById(id);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// =========================================================
// 1. 开场「全幅报刊活字跨栏台」
//    支持栏格轨扫抹、左/右双活字夹拉跨、左偏跨 / 右偏跨 / 全通栏 / 单栏
// =========================================================
const broadsheet = $("broadsheet");
const sheet = $("sheet");
const sheetGrid = $("sheet-grid");
const sheetCols = $("sheet-cols");
const sheetKicker = $("sheet-kicker");
const spanStage = $("span-stage");
const spanBox = $("span-box");
const spanChip = $("span-chip");
const spanHeadline = $("span-headline");
const spanDeck = $("span-deck");
const clampL = $("clamp-l");
const clampR = $("clamp-r");
const intrudeLeft = $("intrude-left");
const ilTag = $("il-tag");
const ilTitle = $("il-title");
const ilBody = $("il-body");
const intrudeRight = $("intrude-right");
const irTag = $("ir-tag");
const irTitle = $("ir-title");
const irBody = $("ir-body");
const ruleTrack = $("rule-track");
const ruleBeam = $("rule-beam");
const flowSvg = $("flow-svg");
const flowPaths = $("flow-paths");
const qsBtns = $("qs-btns");
const spanRail = $("span-rail");
const railTrack = $("rail-track");
const railCells = $("rail-cells");
const railBeam = $("rail-beam");
const railReadout = $("rail-readout");

const isNarrowInit = window.matchMedia("(max-width: 599px)").matches;
const initCols = isNarrowInit ? 2 : 3;

const wb = {
  cols: initCols,
  scene: "broadsheet",
  hlen: "medium",
  targetU0: 0,
  targetU1: 1,
  shownU0: 0,
  shownU1: reducedMotion.matches ? 1 : gridMetrics(initCols).edges[0].right,
  dragging: false,
  deck: true,
  guides: true,
  flow: true,
  introPhase: !reducedMotion.matches,
  introDone: reducedMotion.matches,
  lastPaintedKey: "",
  lastHlKey: "",
  lastStatusKey: "",
  lastLabelKey: "",
  lastSideKey: "",
  metrics: null,
};

function evalCurrent(u0, u1) {
  const text = SCENARIOS[wb.scene].headlines[wb.hlen];
  return evaluateRange(u0, u1, wb.cols, {
    hlen: wb.hlen,
    chars: text.length,
    deck: wb.deck,
  });
}

// 持久化 SVG 节点：拖动全程零 innerHTML 重解析、零强制回流
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

const flowNodes = {
  dotStart: svgEl("circle", { r: 3.5, fill: "#ed420c", opacity: 0.9 }),
  arrowLine: svgEl("line", {
    stroke: "#ed420c",
    "stroke-width": 2,
    "stroke-dasharray": "5 4",
    "marker-end": "url(#arr-o)",
    opacity: 0.88,
  }),
  warnL: svgEl("line", { stroke: "#ed420c", "stroke-width": 1.8, "stroke-dasharray": "5 4", opacity: 0 }),
  warnR: svgEl("line", { stroke: "#ed420c", "stroke-width": 1.8, "stroke-dasharray": "5 4", opacity: 0 }),
  colGroup: svgEl("g"),
  colMarks: [],
};
flowPaths.append(flowNodes.dotStart, flowNodes.arrowLine, flowNodes.warnL, flowNodes.warnR, flowNodes.colGroup);

function rebuildFlowColMarks() {
  flowNodes.colGroup.textContent = "";
  flowNodes.colMarks = [];
  for (let i = 0; i < wb.cols; i++) {
    const dot = svgEl("circle", { r: 4, fill: "#0e39d3" });
    const tick = svgEl("line", { "stroke-width": 1.6, stroke: "#0e39d3", opacity: 0.72 });
    flowNodes.colGroup.append(dot, tick);
    flowNodes.colMarks.push({ dot, tick });
  }
}

// 仅在初始化、栏数变化或视口缩放时测量 DOM 尺寸，拖动全程零 getBoundingClientRect
function measureSheet() {
  const sr = sheet.getBoundingClientRect();
  if (sr.width < 10 || sr.height < 10) return;
  const stageR = spanStage.getBoundingClientRect();
  const chipR = spanChip.getBoundingClientRect();
  const ruleR = ruleTrack.getBoundingClientRect();
  const colsR = sheetCols.getBoundingClientRect();
  const trackR = railTrack.getBoundingClientRect();
  const m = gridMetrics(wb.cols);
  const colLeft = colsR.left - sr.left;
  const colCenters = m.edges.map((e) => Math.round(colLeft + ((e.left + e.right) / 2) * colsR.width));

  wb.metrics = {
    W: Math.round(sr.width),
    H: Math.round(sr.height),
    stageLeft: stageR.left - sr.left,
    stageW: stageR.width,
    boxTop: Math.round(stageR.top - sr.top),
    arrowY: Math.round(chipR.top - sr.top + chipR.height / 2),
    clampLW: clampL.offsetWidth || 20,
    chipOffsetL: Math.round((clampL.offsetWidth || 20) + 12 + Math.max(chipR.width, 76) + 12),
    clampRW: clampR.offsetWidth || 38,
    ruleY: Math.round(ruleR.top - sr.top + 1),
    ruleW: ruleR.width,
    colCenters,
    trackW: trackR.width || 300,
    trackLeft: trackR.left,
  };

  flowSvg.setAttribute("viewBox", `0 0 ${wb.metrics.W} ${wb.metrics.H}`);
  flowNodes.dotStart.setAttribute("cy", String(wb.metrics.arrowY));
  flowNodes.arrowLine.setAttribute("y1", String(wb.metrics.arrowY));
  flowNodes.arrowLine.setAttribute("y2", String(wb.metrics.arrowY));
  flowNodes.warnL.setAttribute("y1", String(wb.metrics.boxTop));
  flowNodes.warnL.setAttribute("y2", String(wb.metrics.H - 12));
  flowNodes.warnR.setAttribute("y1", String(wb.metrics.boxTop));
  flowNodes.warnR.setAttribute("y2", String(wb.metrics.H - 12));
  flowNodes.colMarks.forEach(({ dot, tick }, i) => {
    const cx = String(wb.metrics.colCenters[i]);
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", String(wb.metrics.ruleY));
    tick.setAttribute("x1", cx);
    tick.setAttribute("x2", cx);
    tick.setAttribute("y1", String(wb.metrics.ruleY + 4));
    tick.setAttribute("y2", String(wb.metrics.ruleY + 13));
  });
}

function buildSheetStructure() {
  const m = gridMetrics(wb.cols);
  const gapPct = `${(m.gutter * 100).toFixed(2)}%`;
  broadsheet.dataset.cols = String(wb.cols);
  sheet.style.setProperty("--sheet-cols", String(wb.cols));
  sheet.style.setProperty("--sheet-gap", gapPct);

  // 底层栏网
  sheetGrid.style.gridTemplateColumns = `repeat(${wb.cols}, 1fr)`;
  sheetGrid.style.gap = gapPct;
  sheetGrid.innerHTML = Array.from({ length: wb.cols }, (_, i) => `<i class="sg-col" data-n="C${i + 1}"></i>`).join("");

  // 顶部栏格跨栏轨
  railCells.style.gridTemplateColumns = `repeat(${wb.cols}, 1fr)`;
  railCells.style.gap = gapPct;
  railCells.innerHTML = Array.from({ length: wb.cols }, (_, i) => `<i><span lang="en">C${i + 1}</span> · 第 ${i + 1} 栏</i>`).join("");

  // 文案与多栏正文
  const sc = SCENARIOS[wb.scene];
  sheetKicker.textContent = sc.kicker;
  spanHeadline.textContent = sc.headlines[wb.hlen];
  spanDeck.textContent = sc.deck;
  spanDeck.hidden = !wb.deck;

  sheetCols.innerHTML = sc.columns
    .slice(0, wb.cols)
    .map(
      (txt, i) =>
        `<div class="sheet-col" data-col="${i + 1}"><div class="col-head"><span class="col-cap" lang="en">COL 0${i + 1}</span><span class="col-role">统领</span></div><p>${txt}</p></div>`
    )
    .join("");

  // 快捷跨栏预设按钮（支持左跨、右跨、单栏、全通）
  const presets = presetsForCols(wb.cols);
  qsBtns.innerHTML = presets
    .map(
      (p) =>
        `<button type="button" class="pill" data-start="${p.start}" data-end="${p.end}" aria-pressed="false">${p.label}</button>`
    )
    .join("");
  qsBtns.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      wb.introPhase = false;
      wb.introDone = true;
      const r = rangeForCols(+btn.dataset.start, +btn.dataset.end, wb.cols);
      wb.targetU0 = r.u0;
      wb.targetU1 = r.u1;
      if (reducedMotion.matches) {
        wb.shownU0 = wb.targetU0;
        wb.shownU1 = wb.targetU1;
      }
      updateWorkbenchMeta(true);
      wbLoop.draw();
    });
  });

  clampR.setAttribute("aria-valuemax", String(wb.cols));
  wb.lastHlKey = "";
  wb.lastStatusKey = "";
  wb.lastLabelKey = "";
  wb.lastSideKey = "";
  rebuildFlowColMarks();
  measureSheet();
}

function paintFlowOverlay(ev) {
  const mt = wb.metrics;
  if (!mt) return;
  const boxL = Math.round(mt.stageLeft + ev.u0 * mt.stageW);
  const boxR = Math.round(mt.stageLeft + ev.u1 * mt.stageW);
  const xStart = boxL + mt.chipOffsetL;
  const xEnd = boxR - mt.clampRW - 14;
  const showArrow = xEnd - xStart > 26;

  flowNodes.dotStart.setAttribute("cx", String(xStart));
  flowNodes.dotStart.setAttribute("opacity", showArrow ? "0.9" : "0");
  flowNodes.arrowLine.setAttribute("x1", String(xStart + 4));
  flowNodes.arrowLine.setAttribute("x2", String(Math.max(xStart + 8, xEnd)));
  flowNodes.arrowLine.setAttribute("opacity", showArrow ? "0.88" : "0");

  const showWarnL = !ev.leftAligned;
  const showWarnR = !ev.rightAligned || ev.status === "single";
  flowNodes.warnL.setAttribute("opacity", showWarnL ? "0.82" : "0");
  if (showWarnL) {
    flowNodes.warnL.setAttribute("x1", String(boxL));
    flowNodes.warnL.setAttribute("x2", String(boxL));
  }
  flowNodes.warnR.setAttribute("opacity", showWarnR ? "0.82" : "0");
  if (showWarnR) {
    flowNodes.warnR.setAttribute("x1", String(boxR));
    flowNodes.warnR.setAttribute("x2", String(boxR));
  }

  // 仅在覆盖栏位集合变化时更新下方各栏圆点与角色标签
  const statusKey = `${ev.status}:${ev.covered.join(",")}`;
  if (statusKey !== wb.lastStatusKey) {
    wb.lastStatusKey = statusKey;
    const covSet = new Set(ev.covered);
    flowNodes.colMarks.forEach(({ dot, tick }, i) => {
      const col = i + 1;
      const inside = covSet.has(col);
      if (ev.status === "full" || ev.status === "sparse") {
        dot.setAttribute("fill", "#0e39d3");
        dot.setAttribute("stroke", "none");
        tick.setAttribute("stroke", "#0e39d3");
        tick.setAttribute("opacity", "0.75");
      } else if (ev.status === "partial") {
        dot.setAttribute("fill", inside ? "#0e39d3" : "#f7f3ef");
        dot.setAttribute("stroke", inside ? "none" : "#9f968d");
        dot.setAttribute("stroke-width", "1.5");
        tick.setAttribute("stroke", "#0e39d3");
        tick.setAttribute("opacity", inside ? "0.72" : "0");
      } else {
        dot.setAttribute("fill", inside ? "#ed420c" : "#f7f3ef");
        dot.setAttribute("stroke", "#ed420c");
        dot.setAttribute("stroke-width", "1.6");
        tick.setAttribute("opacity", "0");
      }
    });

    sheetCols.querySelectorAll(".sheet-col").forEach((colEl) => {
      const c = +colEl.dataset.col;
      const inside = covSet.has(c);
      colEl.classList.toggle("is-covered", inside);
      colEl.classList.toggle("is-free", !inside);
      const roleEl = colEl.querySelector(".col-role");
      if (roleEl) roleEl.textContent = inside ? (ev.status === "single" ? "单栏" : "已统领") : "独立顶头";
    });
  }
}

function paintSheet(u0, u1) {
  const ev = evalCurrent(u0, u1);
  const mt = wb.metrics;
  const m = gridMetrics(wb.cols);

  // 顶部栏格轨滑条与分界蓝线走纯 transform（软件渲染下零回流）
  if (mt) {
    railBeam.style.setProperty("--rail-x", `${(ev.u0 * mt.trackW).toFixed(1)}px`);
    railBeam.style.setProperty("--rail-w", `${Math.max(44, ev.width * mt.trackW).toFixed(1)}px`);
    ruleBeam.style.setProperty("--rule-x", `${(ev.u0 * mt.ruleW).toFixed(1)}px`);
    ruleBeam.style.setProperty("--rule-sx", ev.width.toFixed(4));
  }

  // 跨栏标题块以流内相对定位随内容自适应高度，margin-left / width 紧跟起止栏位
  spanBox.style.setProperty("--span-left", `${(ev.u0 * 100).toFixed(2)}%`);
  spanBox.style.setProperty("--span-width", `${(ev.width * 100).toFixed(2)}%`);

  // 按「跨度可用宽 ÷ 字数」计算字号（1–2 行过梁），2px 量化步进兼顾明显缩放与帧率
  const headlineText = SCENARIOS[wb.scene].headlines[wb.hlen];
  const stageW = Math.max(mt ? mt.stageW : 600, 260);
  const clampLW = mt ? mt.clampLW : 20;
  const clampRW = mt ? mt.clampRW : 38;
  const innerPadX = stageW < 520 ? 16 : 26;
  const innerW = Math.max(96, ev.width * stageW - clampLW - clampRW - innerPadX);
  const rawPx = computeHeadlineFontSize(innerW, headlineText.length, stageW);
  const stepPx = Math.max(14, Math.round(rawPx / 2) * 2);
  const hlKey = `${stepPx}:${wb.hlen}`;
  if (hlKey !== wb.lastHlKey) {
    wb.lastHlKey = hlKey;
    spanBox.style.setProperty("--hl-size", `${stepPx}px`);
  }

  if (broadsheet.dataset.status !== ev.status) broadsheet.dataset.status = ev.status;

  const labelKey = `${ev.rangeLabel}:${ev.pct}:${ev.status}`;
  if (labelKey !== wb.lastLabelKey) {
    wb.lastLabelKey = labelKey;
    const spanTxt = `SPAN ${ev.rangeLabel}`;
    railReadout.textContent = `${ev.rangeLabel} · ${ev.pct}%`;
    spanChip.textContent = spanTxt;
  }

  // 左右未跨到的栏顶头伴随块（仅在空出足够宽度时显露）
  const gapPx = m.gutter * 100;
  const showLeft = ev.u0 > m.colW * 0.65;
  const showRight = 1 - ev.u1 > m.colW * 0.65;
  const leftW = Math.max(0, ev.u0 * 100 - gapPx * 0.85);
  const rightW = Math.max(0, (1 - ev.u1) * 100 - gapPx * 0.85);
  if (showLeft) intrudeLeft.style.width = `${leftW.toFixed(2)}%`;
  if (showRight) intrudeRight.style.width = `${rightW.toFixed(2)}%`;

  const sideKey = `${showLeft}:${showRight}:${wb.scene}:${ev.status}`;
  if (sideKey !== wb.lastSideKey) {
    wb.lastSideKey = sideKey;
    intrudeLeft.hidden = !showLeft;
    intrudeRight.hidden = !showRight;
    const briefs = SCENARIOS[wb.scene].sideBriefs;
    if (showLeft) {
      ilTag.textContent = briefs[0].tag;
      ilTitle.textContent = briefs[0].title;
      ilBody.textContent = briefs[0].body;
    }
    if (showRight) {
      const b = ev.status === "single" ? briefs[1] : briefs[2];
      irTag.textContent = ev.status === "single" ? "脱离统领" : b.tag;
      irTitle.textContent = ev.status === "single" ? "右侧栏直接顶头" : b.title;
      irBody.textContent = b.body;
    }
  }

  paintFlowOverlay(ev);
}

let lastMetaKey = "";
function updateWorkbenchMeta(force = false) {
  const ev = evalCurrent(wb.targetU0, wb.targetU1);
  const metaKey = `${wb.cols}:${wb.hlen}:${wb.deck}:${ev.status}:${ev.startCol ?? ""}:${ev.endCol ?? ""}:${ev.pct}`;
  if (!force && metaKey === lastMetaKey) return;
  lastMetaKey = metaKey;

  const badge = $("ro-badge");
  if (badge.textContent !== ev.badge) badge.textContent = ev.badge;
  badge.classList.toggle("warn", ev.status === "single" || ev.status === "drift" || ev.status === "sparse");
  $("ro-pct").textContent = `${ev.pct}% WIDTH`;
  if ($("ro-verdict").textContent !== ev.verdict) $("ro-verdict").textContent = ev.verdict;
  if ($("ro-eye").textContent !== ev.eyeNote) $("ro-eye").textContent = ev.eyeNote;

  const currentVal = ev.aligned ? ev.spanCount : Number(ev.approxCols.toFixed(1));
  clampR.setAttribute("aria-valuenow", String(currentVal));
  clampR.setAttribute("aria-valuetext", `${ev.badge}，占版心 ${ev.pct}%`);

  qsBtns.querySelectorAll("button").forEach((btn) => {
    const match = ev.aligned && ev.startCol === +btn.dataset.start && ev.endCol === +btn.dataset.end;
    btn.classList.toggle("is-active", match);
    btn.setAttribute("aria-pressed", String(match));
  });
}

// 用 lib/stage.js 的 loop() 跑平滑开场与拖动缓动（严格尊重 still / reducedMotion）
const wbLoop = loop(sheet, (t, dt, { still }) => {
  if (still) {
    wb.introPhase = false;
    wb.introDone = true;
    wb.shownU0 = wb.targetU0;
    wb.shownU1 = wb.targetU1;
    paintSheet(wb.shownU0, wb.shownU1);
    return;
  }

  // 开场 0.0s -> 1.05s：标题从 C1 流畅摊开成全通 C1–C3，每一刻都稳妥清晰
  if (wb.introPhase && !wb.dragging) {
    const m = gridMetrics(wb.cols);
    const startU1 = m.edges[0].right;
    const dur = 1.05;
    const p = clamp(t / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    wb.shownU0 = 0;
    wb.shownU1 = startU1 + (1 - startU1) * eased;
    paintSheet(wb.shownU0, wb.shownU1);
    if (p >= 1) {
      wb.introPhase = false;
      wb.introDone = true;
      wb.targetU0 = 0;
      wb.targetU1 = 1;
      wb.shownU0 = 0;
      wb.shownU1 = 1;
      updateWorkbenchMeta(true);
    }
    return;
  }

  const d0 = wb.targetU0 - wb.shownU0;
  const d1 = wb.targetU1 - wb.shownU1;
  const key = `${wb.shownU0.toFixed(4)}:${wb.shownU1.toFixed(4)}`;
  if (Math.abs(d0) > 0.0005 || Math.abs(d1) > 0.0005 || key !== wb.lastPaintedKey) {
    const k = wb.dragging ? 1 : dt ? 1 - Math.exp(-dt * 14) : 1;
    wb.shownU0 += d0 * k;
    wb.shownU1 += d1 * k;
    if (Math.abs(wb.targetU0 - wb.shownU0) <= 0.0005) wb.shownU0 = wb.targetU0;
    if (Math.abs(wb.targetU1 - wb.shownU1) <= 0.0005) wb.shownU1 = wb.targetU1;
    wb.lastPaintedKey = `${wb.shownU0.toFixed(4)}:${wb.shownU1.toFixed(4)}`;
    paintSheet(wb.shownU0, wb.shownU1);
    if (wb.dragging) updateWorkbenchMeta();
  }
});

// ---------------------------------------------------------
// 交互驱动：顶部栏格轨扫抹 + 标题左/右活字夹直接拖拉
// ---------------------------------------------------------
let activeDrag = null;

function applyDragX(clientX, drag) {
  const m = gridMetrics(wb.cols);
  const minW = m.colW * 0.78;
  const u = clamp((clientX + drag.offsetX - drag.left) / Math.max(drag.width, 1), 0, 1);

  if (drag.mode === "right") {
    wb.targetU1 = clamp(u, wb.targetU0 + minW, 1);
  } else if (drag.mode === "left") {
    wb.targetU0 = clamp(u, 0, wb.targetU1 - minW);
  } else if (drag.mode === "rail") {
    // 顶部栏格轨：按住后左右扫抹，自动伸缩右缘（按在最左 18% 且已跨多栏时可拖左缘！）
    if (drag.sub === "left") {
      wb.targetU0 = clamp(u, 0, wb.targetU1 - minW);
    } else {
      wb.targetU1 = clamp(u, wb.targetU0 + minW, 1);
    }
  }

  if (reducedMotion.matches) {
    wb.shownU0 = wb.targetU0;
    wb.shownU1 = wb.targetU1;
    paintSheet(wb.shownU0, wb.shownU1);
    updateWorkbenchMeta();
  }
}

function beginDrag(el, refEl, mode, e) {
  e.preventDefault();
  try {
    el.setPointerCapture(e.pointerId);
  } catch {}
  if (el === clampL || el === clampR) el.focus({ preventScroll: true });
  measureSheet();
  wb.introPhase = false;
  wb.introDone = true;
  wb.dragging = true;

  const r = refEl.getBoundingClientRect();
  let offsetX = 0;
  let sub = "right";
  if (mode === "right") {
    offsetX = spanBox.getBoundingClientRect().right - e.clientX;
  } else if (mode === "left") {
    offsetX = spanBox.getBoundingClientRect().left - e.clientX;
  } else if (mode === "rail") {
    const downU = clamp((e.clientX - r.left) / Math.max(r.width, 1), 0, 1);
    const m = gridMetrics(wb.cols);
    // 按在当前左缘附近且当前跨度大于 1 栏时拖左缘，否则直接拉右缘（全通时从中央左右扫正好平滑展开收缩）
    if (Math.abs(downU - wb.targetU0) < 0.14 && wb.targetU1 - wb.targetU0 > m.colW * 1.25 && downU < 0.32) {
      sub = "left";
    } else {
      sub = "right";
    }
  }

  activeDrag = { mode, sub, left: r.left, width: r.width, offsetX, pointerId: e.pointerId };
  broadsheet.classList.add("dragging");
  $("wb-readout").setAttribute("aria-live", "off");
  if (mode === "rail") applyDragX(e.clientX, activeDrag);
}

clampL.addEventListener("pointerdown", (e) => beginDrag(clampL, spanStage, "left", e));
clampR.addEventListener("pointerdown", (e) => beginDrag(clampR, spanStage, "right", e));
spanRail.addEventListener("pointerdown", (e) => beginDrag(spanRail, railTrack, "rail", e));

window.addEventListener("pointermove", (e) => {
  if (!wb.dragging || !activeDrag) return;
  applyDragX(e.clientX, activeDrag);
});

function finishDrag() {
  if (!wb.dragging) return;
  wb.dragging = false;
  activeDrag = null;
  broadsheet.classList.remove("dragging");
  $("wb-readout").setAttribute("aria-live", "polite");
  const snapped = snapRange(wb.targetU0, wb.targetU1, wb.cols);
  wb.targetU0 = snapped.u0;
  wb.targetU1 = snapped.u1;
  if (reducedMotion.matches) {
    wb.shownU0 = wb.targetU0;
    wb.shownU1 = wb.targetU1;
  }
  updateWorkbenchMeta(true);
  wbLoop.draw();
}
window.addEventListener("pointerup", finishDrag);
window.addEventListener("pointercancel", finishDrag);

new ResizeObserver(() => {
  const w = Math.round(sheet.clientWidth);
  const h = Math.round(sheet.clientHeight);
  if (wb.metrics && wb.metrics.W === w && wb.metrics.H === h) return;
  measureSheet();
  paintSheet(wb.shownU0, wb.shownU1);
}).observe(sheet);

// 键盘操作：方向键步进右缘/左缘，Shift 细调看半栏悬空，[ / ] 切换起栏，1-4 快捷跨栏
function onClampKeydown(edgeSide, e) {
  const m = gridMetrics(wb.cols);
  const ev = evalCurrent(wb.targetU0, wb.targetU1);
  let nextU0 = wb.targetU0;
  let nextU1 = wb.targetU1;
  let handled = false;

  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    handled = true;
    if (e.shiftKey) {
      if (edgeSide === "left") nextU0 = clamp(wb.targetU0 - 0.06, 0, wb.targetU1 - m.colW * 0.8);
      else nextU1 = clamp(wb.targetU1 - 0.06, wb.targetU0 + m.colW * 0.8, 1);
    } else if (edgeSide === "left") {
      const curS = ev.aligned ? ev.startCol : Math.max(1, ev.covered[0]);
      const targetS = Math.max(1, curS - 1);
      nextU0 = m.edges[targetS - 1].left;
    } else {
      const curS = ev.aligned ? ev.startCol : ev.covered[0];
      const curE = ev.aligned ? ev.endCol : ev.covered[ev.covered.length - 1];
      const targetE = Math.max(curS, curE - 1);
      nextU1 = m.edges[targetE - 1].right;
    }
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    handled = true;
    if (e.shiftKey) {
      if (edgeSide === "left") nextU0 = clamp(wb.targetU0 + 0.06, 0, wb.targetU1 - m.colW * 0.8);
      else nextU1 = clamp(wb.targetU1 + 0.06, wb.targetU0 + m.colW * 0.8, 1);
    } else if (edgeSide === "left") {
      const curS = ev.aligned ? ev.startCol : ev.covered[0];
      const curE = ev.aligned ? ev.endCol : ev.covered[ev.covered.length - 1];
      const targetS = Math.min(curE, curS + 1);
      nextU0 = m.edges[targetS - 1].left;
    } else {
      const curE = ev.aligned ? ev.endCol : ev.covered[ev.covered.length - 1];
      const targetE = Math.min(wb.cols, curE + 1);
      nextU1 = m.edges[targetE - 1].right;
    }
  } else if (e.key === "[") {
    handled = true;
    const curS = ev.aligned ? ev.startCol : ev.covered[0];
    const targetS = Math.max(1, curS - 1);
    nextU0 = m.edges[targetS - 1].left;
  } else if (e.key === "]") {
    handled = true;
    const curS = ev.aligned ? ev.startCol : ev.covered[0];
    const curE = ev.aligned ? ev.endCol : ev.covered[ev.covered.length - 1];
    const targetS = Math.min(curE, curS + 1);
    nextU0 = m.edges[targetS - 1].left;
  } else if (/^[1-4]$/.test(e.key)) {
    const n = Math.min(wb.cols, +e.key);
    handled = true;
    const r = rangeForCols(1, n, wb.cols);
    nextU0 = r.u0;
    nextU1 = r.u1;
  }

  if (!handled) return;
  e.preventDefault();
  wb.introPhase = false;
  wb.introDone = true;
  wb.targetU0 = nextU0;
  wb.targetU1 = nextU1;
  if (reducedMotion.matches) {
    wb.shownU0 = wb.targetU0;
    wb.shownU1 = wb.targetU1;
  }
  updateWorkbenchMeta(true);
  wbLoop.draw();
}

clampL.addEventListener("keydown", (e) => onClampKeydown("left", e));
clampR.addEventListener("keydown", (e) => onClampKeydown("right", e));

// 顶眉报社工具栏按钮绑定
function bindPillGroup(containerId, attr, onSelect) {
  const box = $(containerId);
  box.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.querySelectorAll("button").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      onSelect(btn.dataset[attr]);
    });
  });
}

bindPillGroup("ctl-cols", "cols", (val) => {
  wb.introPhase = false;
  wb.introDone = true;
  wb.cols = +val;
  wb.targetU0 = 0;
  wb.targetU1 = 1;
  wb.shownU0 = 0;
  wb.shownU1 = 1;
  buildSheetStructure();
  updateWorkbenchMeta(true);
  paintSheet(wb.shownU0, wb.shownU1);
});

bindPillGroup("ctl-hlen", "hlen", (val) => {
  wb.hlen = val;
  spanHeadline.textContent = SCENARIOS[wb.scene].headlines[wb.hlen];
  wb.lastHlKey = "";
  updateWorkbenchMeta(true);
  paintSheet(wb.shownU0, wb.shownU1);
  measureSheet();
  paintSheet(wb.shownU0, wb.shownU1);
});

bindPillGroup("ctl-scene", "scene", (val) => {
  wb.scene = val;
  buildSheetStructure();
  updateWorkbenchMeta(true);
  paintSheet(wb.shownU0, wb.shownU1);
});

$("ctl-deck").addEventListener("change", (e) => {
  wb.deck = e.target.checked;
  spanDeck.hidden = !wb.deck;
  updateWorkbenchMeta(true);
  measureSheet();
  paintSheet(wb.shownU0, wb.shownU1);
});
$("ctl-guides").addEventListener("change", (e) => {
  wb.guides = e.target.checked;
  broadsheet.dataset.guides = wb.guides ? "on" : "off";
});
$("ctl-flow").addEventListener("change", (e) => {
  wb.flow = e.target.checked;
  broadsheet.dataset.flow = wb.flow ? "on" : "off";
});

// 初始化栏数按钮高亮（<600px 默认 2 栏，避免极窄微栏）
$("ctl-cols")
  .querySelectorAll("button")
  .forEach((b) => {
    const on = +b.dataset.cols === wb.cols;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

buildSheetStructure();
updateWorkbenchMeta(true);
paintSheet(wb.shownU0, wb.shownU1);
measureSheet();
paintSheet(wb.shownU0, wb.shownU1);

// =========================================================
// 2. 第 01 节：统领 vs 割裂 SVG 对比实验
// =========================================================
const grpSvg = $("grp-svg");
const grpTag = $("grp-tag");
const grpText = $("grp-text");

function renderGrouping(mode) {
  const info = GROUPING_MODES[mode];
  grpTag.textContent = info.tag;
  grpTag.classList.toggle("warn", info.tone === "warn");
  grpText.textContent = info.text;

  const cols = [
    { x: 40, w: 184 },
    { x: 248, w: 184 },
    { x: 456, w: 184 },
  ];

  const lines = (x, y, count) =>
    Array.from({ length: count }, (_, i) => {
      const w = i === count - 1 ? 126 : 168 - (i % 2) * 14;
      return `<rect x="${x + 8}" y="${y + i * 14}" width="${w}" height="5" fill="#5c5650" opacity="0.75"/>`;
    }).join("");

  let inner = `<rect x="0" y="0" width="680" height="260" fill="#f0eae5"/>`;
  for (const c of cols) {
    inner += `<rect x="${c.x}" y="22" width="${c.w}" height="214" fill="#f7f3ef" stroke="#c8c0b8" stroke-width="1"/>`;
  }

  if (mode === "spanning") {
    inner += `<path d="M40 18 V11 H640 V18" fill="none" stroke="#0e39d3" stroke-width="2"/>`;
    inner += `<rect x="40" y="24" width="600" height="44" fill="#0e39d3"/>`;
    inner += `<text x="56" y="53" font-family="Noto Sans SC, sans-serif" font-size="22" font-weight="900" fill="#ffffff">通栏标题横跨三栏，把它们捆成一篇文章</text>`;
    inner += `<line x1="40" y1="80" x2="640" y2="80" stroke="#0e39d3" stroke-width="1.5"/>`;
    for (const c of cols) {
      inner += lines(c.x, 96, 9);
      inner += `<circle cx="${c.x + c.w / 2}" cy="80" r="4" fill="#ed420c"/>`;
    }
  } else if (mode === "trapped") {
    inner += `<path d="M40 18 V11 H224 V18" fill="none" stroke="#ed420c" stroke-width="2"/>`;
    inner += `<path d="M248 18 V11 H640 V18" fill="none" stroke="#9f968d" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    inner += `<rect x="40" y="24" width="184" height="72" fill="#ed420c"/>`;
    inner += `<text x="50" y="48" font-family="Noto Sans SC, sans-serif" font-size="16" font-weight="900" fill="#ffffff">标题被困在</text>`;
    inner += `<text x="50" y="69" font-family="Noto Sans SC, sans-serif" font-size="16" font-weight="900" fill="#ffffff">第一栏里面</text>`;
    inner += `<text x="50" y="88" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700" fill="#ffffff" opacity="0.85">折成三行窄条</text>`;
    inner += lines(cols[0].x, 110, 8);
    inner += lines(cols[1].x, 36, 13);
    inner += lines(cols[2].x, 36, 13);
    inner += `<line x1="236" y1="20" x2="236" y2="240" stroke="#ed420c" stroke-width="2" stroke-dasharray="6 4"/>`;
  } else {
    const titles = ["焦点一：街道", "焦点二：建筑", "焦点三：社区"];
    cols.forEach((c, idx) => {
      inner += `<path d="M${c.x} 18 V11 H${c.x + c.w} V18" fill="none" stroke="#ed420c" stroke-width="1.8"/>`;
      inner += `<rect x="${c.x}" y="24" width="${c.w}" height="32" fill="${idx === 1 ? "#ed420c" : "#0e39d3"}"/>`;
      inner += `<text x="${c.x + 12}" y="45" font-family="Noto Sans SC, sans-serif" font-size="14" font-weight="900" fill="#ffffff">${titles[idx]}</text>`;
      inner += lines(c.x, 72, 10);
    });
  }

  grpSvg.innerHTML = inner;
}

$("grp-btns").querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    $("grp-btns").querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderGrouping(btn.dataset.grp);
  });
});
renderGrouping("spanning");

// =========================================================
// 3. 第 02 节：CSS column-span vs CSS Grid 实时演示
// =========================================================
const cssPreview = $("css-preview");
const cssCode = $("css-code");
const cssNote = $("css-note");
const cssState = { engine: "multicol", span: "3" };

function updateCssDemo() {
  cssPreview.dataset.engine = cssState.engine;
  cssPreview.dataset.span = cssState.span;

  if (cssState.engine === "multicol") {
    if (cssState.span === "3") {
      cssCode.innerHTML = `<code>.article { column-count: 3; column-gap: 20px; }\n.article h3 { column-span: all; }</code>`;
      cssNote.innerHTML = `使用 <code lang="en">column-span: all</code> 时，标题直接打穿全部三栏；浏览器会自动平衡其前后的分栏文字流。`;
    } else if (cssState.span === "1") {
      cssCode.innerHTML = `<code>.article { column-count: 3; column-gap: 20px; }\n.article h3 { column-span: none; } /* 留在首栏 */</code>`;
      cssNote.innerHTML = `<code lang="en">column-span: none</code> 是默认值：标题被关在第一栏内，右侧各栏正文直接顶到最上方。`;
    } else {
      cssCode.innerHTML = `<code>/* CSS Multi-column Level 1 尚不支持按数字跨 2 栏 */\n.article h3 { column-span: 2; /* 草案阶段，当前回退为 none */ }</code>`;
      cssNote.innerHTML = `这就是规范的现实边界：主流浏览器里的 <code lang="en">column-span</code> 只支持 <code lang="en">none</code> 或 <code lang="en">all</code>，想跨 3 栏里的前 2 栏，请切换到右侧的 <code lang="en">CSS Grid</code>。`;
    }
  } else {
    const rule = cssState.span === "3" ? "1 / -1" : `1 / span ${cssState.span}`;
    cssCode.innerHTML = `<code>.article { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }\n.article h3 { grid-column: ${rule}; }</code>`;
    cssNote.innerHTML =
      cssState.span === "2"
        ? `用 <code lang="en">grid-column: 1 / span 2</code> 就能精准跨越前 2 栏，把第 3 栏自然空出来当边注或留白，这是网格布局的拿手好戏。`
        : cssState.span === "3"
          ? `<code lang="en">grid-column: 1 / -1</code> 让标题从第一条网格线一直贯通到最后一条线，栏数增减时不必改数字。`
          : `<code lang="en">grid-column: 1 / span 1</code> 只占第 1 栏，适合卡片标题，但在长文里无法统领后两栏。`;
  }
}

document.querySelectorAll('input[name="css-engine"]').forEach((inp) => {
  inp.addEventListener("change", () => {
    if (!inp.checked) return;
    cssState.engine = inp.value;
    updateCssDemo();
  });
});
document.querySelectorAll('input[name="css-span"]').forEach((inp) => {
  inp.addEventListener("change", () => {
    if (!inp.checked) return;
    cssState.span = inp.value;
    updateCssDemo();
  });
});
updateCssDemo();

// =========================================================
// 4. 第 03 节：跨栏结构调音台
// =========================================================
const calState = { ratio: 2.8, gap: 20, lengthKey: "medium", spanCols: 3, hasDeck: true, hasRule: true };
const calPage = $("cal-page");

function updateCalibrator() {
  const len = HEADLINE_LENGTHS[calState.lengthKey];
  calPage.style.setProperty("--ratio", String(calState.ratio));
  calPage.style.setProperty("--cal-gap", `${calState.gap}px`);
  calPage.dataset.span = String(calState.spanCols);

  $("cal-ratio-out").textContent = `${calState.ratio.toFixed(1)}×`;
  $("cal-gap-out").textContent = `${calState.gap}px`;
  $("cal-title").textContent = len.text;
  $("cal-deck-txt").hidden = !calState.hasDeck;
  $("cal-side-note").hidden = calState.spanCols !== 2;
  $("cal-divider").classList.toggle("no-line", !calState.hasRule);

  const d = diagnoseCalibrator(calState);
  const tag = $("cal-tag");
  tag.textContent = d.tag;
  tag.classList.toggle("warn", d.tone === "warn");
  $("cal-msg").textContent = d.text;

  // 同步四条设计要点预设按钮的高亮状态
  const presetBox = $("cal-presets");
  if (presetBox) {
    presetBox.querySelectorAll("button[data-preset]").forEach((btn) => {
      const p = CAL_PRESETS[btn.dataset.preset]?.state;
      const match =
        !!p &&
        Math.abs(calState.ratio - p.ratio) < 0.05 &&
        calState.gap === p.gap &&
        calState.lengthKey === p.lengthKey &&
        calState.spanCols === p.spanCols &&
        calState.hasDeck === p.hasDeck &&
        calState.hasRule === p.hasRule;
      btn.classList.toggle("is-active", match);
      btn.setAttribute("aria-pressed", String(match));
    });
  }
}

function applyCalPreset(key) {
  const p = CAL_PRESETS[key]?.state;
  if (!p) return;
  Object.assign(calState, p);
  $("cal-ratio").value = String(calState.ratio);
  $("cal-gap").value = String(calState.gap);
  document.querySelectorAll('input[name="cal-len"]').forEach((inp) => {
    inp.checked = inp.value === calState.lengthKey;
  });
  document.querySelectorAll('input[name="cal-span"]').forEach((inp) => {
    inp.checked = +inp.value === calState.spanCols;
  });
  $("cal-deck").checked = calState.hasDeck;
  $("cal-rule").checked = calState.hasRule;
  updateCalibrator();
}

const calPresetsEl = $("cal-presets");
if (calPresetsEl) {
  calPresetsEl.querySelectorAll("button[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => applyCalPreset(btn.dataset.preset));
  });
}

$("cal-ratio").addEventListener("input", (e) => {
  calState.ratio = parseFloat(e.target.value);
  updateCalibrator();
});
$("cal-gap").addEventListener("input", (e) => {
  calState.gap = parseInt(e.target.value, 10);
  updateCalibrator();
});
document.querySelectorAll('input[name="cal-len"]').forEach((inp) => {
  inp.addEventListener("change", () => {
    if (!inp.checked) return;
    calState.lengthKey = inp.value;
    updateCalibrator();
  });
});
document.querySelectorAll('input[name="cal-span"]').forEach((inp) => {
  inp.addEventListener("change", () => {
    if (!inp.checked) return;
    calState.spanCols = +inp.value;
    updateCalibrator();
  });
});
$("cal-deck").addEventListener("change", (e) => {
  calState.hasDeck = e.target.checked;
  updateCalibrator();
});
$("cal-rule").addEventListener("change", (e) => {
  calState.hasRule = e.target.checked;
  updateCalibrator();
});
updateCalibrator();

// =========================================================
// 5. 第 04 节：四种常见翻车与修复
// =========================================================
const flawState = { kind: "offset", fixed: false };
const flawSvg = $("flaw-svg");
const flawToggle = $("flaw-toggle");

function renderFlaw() {
  const f = FLAWS[flawState.kind];
  const fixed = flawState.fixed;

  const tag = $("flaw-tag");
  tag.textContent = fixed ? f.fixedTag : f.brokenTag;
  tag.classList.toggle("warn", !fixed);
  $("flaw-text").textContent = fixed ? f.fixedText : f.brokenText;
  flawToggle.setAttribute("aria-pressed", String(fixed));
  flawToggle.textContent = fixed ? "← 看回翻车版" : "切换到修复版 →";

  const cols = [44, 238, 432];
  const cw = 164;
  const barLines = (x, y, n, h = 5) =>
    Array.from({ length: n }, (_, i) => {
      const w = i === n - 1 ? cw * 0.65 : cw - (i % 2) * 14;
      return `<rect x="${x}" y="${y + i * 14}" width="${w}" height="${h}" fill="#5c5650" opacity="0.72"/>`;
    }).join("");

  let s = `<rect width="640" height="290" fill="#f0eae5"/>`;
  for (const x of cols) {
    s += `<rect x="${x}" y="18" width="${cw}" height="254" fill="#f7f3ef" stroke="#c8c0b8" stroke-width="1"/>`;
  }

  if (flawState.kind === "offset") {
    const hx = fixed ? 44 : 80;
    const hw = fixed ? 552 : 504;
    s += `<line x1="44" y1="10" x2="44" y2="280" stroke="${fixed ? "#0e39d3" : "#ed420c"}" stroke-width="1.8" stroke-dasharray="4 3"/>`;
    if (!fixed) {
      s += `<line x1="80" y1="10" x2="80" y2="96" stroke="#ed420c" stroke-width="1.5"/>`;
      s += `<text x="62" y="20" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" font-weight="500" fill="#ed420c">+36px</text>`;
    }
    s += `<rect x="${hx}" y="28" width="${hw}" height="44" fill="${fixed ? "#0e39d3" : "#ed420c"}"/>`;
    s += `<text x="${hx + 14}" y="58" font-family="Noto Sans SC, sans-serif" font-size="22" font-weight="900" fill="#fff">标题左缘必须锁死在首栏线上</text>`;
    s += `<line x1="44" y1="86" x2="596" y2="86" stroke="#0e39d3" stroke-width="1.4"/>`;
    for (const x of cols) s += barLines(x + 6, 102, 10);
  } else if (flawState.kind === "chopped") {
    s += `<rect x="44" y="24" width="552" height="36" fill="#0e39d3"/>`;
    s += `<text x="58" y="49" font-family="Noto Sans SC, sans-serif" font-size="19" font-weight="900" fill="#fff">主标题在页顶统领全局即可</text>`;
    if (!fixed) {
      for (const x of cols) s += barLines(x + 6, 74, 3);
      s += `<rect x="44" y="122" width="552" height="24" fill="#ed420c"/>`;
      s += `<text x="58" y="139" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700" fill="#fff">中途硬插第一道跨栏小标（水流被拦腰切断）</text>`;
      for (const x of cols) s += barLines(x + 6, 156, 3);
      s += `<rect x="44" y="202" width="552" height="24" fill="#ed420c"/>`;
      s += `<text x="58" y="219" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700" fill="#fff">又插第二道跨栏小标（读者迷失阅读方向）</text>`;
      for (const x of cols) s += barLines(x + 6, 236, 2);
    } else {
      s += barLines(cols[0] + 6, 74, 5);
      s += `<rect x="${cols[0] + 6}" y="150" width="144" height="20" fill="#0e39d3" opacity="0.14"/>`;
      s += `<text x="${cols[0] + 12}" y="164" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="900" fill="#0e39d3">二级小标留在栏内</text>`;
      s += barLines(cols[0] + 6, 180, 5);

      s += barLines(cols[1] + 6, 74, 12);
      s += `<rect x="${cols[2] + 6}" y="74" width="144" height="20" fill="#0e39d3" opacity="0.14"/>`;
      s += `<text x="${cols[2] + 12}" y="88" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="900" fill="#0e39d3">另一小节自然承接</text>`;
      s += barLines(cols[2] + 6, 104, 10);
    }
  } else if (flawState.kind === "widow") {
    if (!fixed) {
      s += `<rect x="44" y="24" width="552" height="72" fill="#f7f3ef" stroke="#ed420c" stroke-width="1.5"/>`;
      s += `<text x="56" y="54" font-family="Noto Sans SC, sans-serif" font-size="22" font-weight="900" fill="#0a0908">当一座百年老城重新把林荫街道交还给步行的</text>`;
      s += `<text x="56" y="84" font-family="Noto Sans SC, sans-serif" font-size="22" font-weight="900" fill="#ed420c">人</text>`;
      s += `<rect x="86" y="68" width="496" height="20" fill="#ed420c" opacity="0.12" stroke="#ed420c" stroke-dasharray="4 3"/>`;
      s += `<text x="334" y="82" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700" fill="#ed420c">孤字吊尾：下方拉出一长条失衡空洞</text>`;
    } else {
      s += `<rect x="44" y="24" width="552" height="72" fill="#f7f3ef" stroke="#0e39d3" stroke-width="1.5"/>`;
      s += `<text x="56" y="54" font-family="Noto Sans SC, sans-serif" font-size="22" font-weight="900" fill="#0a0908">当一座百年老城重新出发，</text>`;
      s += `<text x="56" y="84" font-family="Noto Sans SC, sans-serif" font-size="22" font-weight="900" fill="#0e39d3">把林荫街道稳稳交还给步行的人</text>`;
    }
    s += `<line x1="44" y1="110" x2="596" y2="110" stroke="#0e39d3" stroke-width="1.4"/>`;
    for (const x of cols) s += barLines(x + 6, 126, 9);
  } else {
    s += `<rect x="44" y="24" width="552" height="42" fill="#0e39d3"/>`;
    s += `<text x="58" y="53" font-family="Noto Sans SC, sans-serif" font-size="21" font-weight="900" fill="#fff">通栏之下，三栏正文应从同一基线起步</text>`;
    const ys = fixed ? [104, 104, 104] : [84, 124, 98];
    s += `<line x1="34" y1="104" x2="606" y2="104" stroke="${fixed ? "#0e39d3" : "#ed420c"}" stroke-width="1.6" stroke-dasharray="5 3"/>`;
    cols.forEach((x, i) => {
      if (!fixed && i === 1) {
        s += `<rect x="${x + 6}" y="84" width="152" height="28" fill="#ed420c" opacity="0.16" stroke="#ed420c" stroke-dasharray="3 3"/>`;
        s += `<text x="${x + 82}" y="102" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#ed420c">错位空档</text>`;
      }
      s += barLines(x + 6, ys[i], fixed ? 10 : 9);
    });
  }

  flawSvg.innerHTML = s;
}

document.querySelectorAll('input[name="flaw"]').forEach((inp) => {
  inp.addEventListener("change", () => {
    if (!inp.checked) return;
    flawState.kind = inp.value;
    flawState.fixed = false;
    renderFlaw();
  });
});
flawToggle.addEventListener("click", () => {
  flawState.fixed = !flawState.fixed;
  renderFlaw();
});
renderFlaw();

// =========================================================
// 6. 第 06 节：小练习四选一
// =========================================================
const quizGrid = $("quiz-grid");
const quizVerdict = $("quiz-verdict");
const qvTitle = $("qv-title");
const qvText = $("qv-text");

quizGrid.querySelectorAll(".qcard").forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.q;
    const item = QUIZ[key];
    quizGrid.classList.add("revealed");
    quizGrid.querySelectorAll(".qcard").forEach((c) => {
      const k = c.dataset.q;
      const picked = k === key;
      c.setAttribute("aria-pressed", String(picked));
      c.classList.toggle("is-picked", picked);
      c.classList.toggle("is-good", QUIZ[k].ok);
      c.classList.toggle("is-bad", picked && !QUIZ[k].ok);
    });
    quizVerdict.classList.toggle("is-warn", !item.ok);
    qvTitle.textContent = item.title;
    qvText.textContent = item.text;
  });
});

// =========================================================
// 7. 第 07 节：原海报放大查看（缩放、拖动、Esc 关）
// =========================================================
function initPosterZoom() {
  const poster = $("poster");
  const dialog = $("zoom");
  const view = $("zoom-view");
  const img = $("zoom-img");
  const level = $("zoom-level");
  let k = 1;

  const setZoom = (next, cx = 0.5, cy = 0.5) => {
    const fx = (view.scrollLeft + view.clientWidth * cx) / Math.max(view.scrollWidth, 1);
    const fy = (view.scrollTop + view.clientHeight * cy) / Math.max(view.scrollHeight, 1);
    k = clamp(next, 1, 4);
    img.style.setProperty("--k", String(k));
    level.textContent = `${Math.round(k * 100)}%`;
    view.scrollLeft = fx * view.scrollWidth - view.clientWidth * cx;
    view.scrollTop = fy * view.scrollHeight - view.clientHeight * cy;
  };

  const open = () => {
    if (!img.src) img.src = poster.src;
    dialog.showModal();
    setZoom(1);
  };

  $("poster-open").addEventListener("click", open);
  $("zoom-in").addEventListener("click", () => setZoom(k * 1.5));
  $("zoom-out").addEventListener("click", () => setZoom(k / 1.5));
  $("zoom-close").addEventListener("click", () => dialog.close());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) dialog.close();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  img.addEventListener("click", (e) => {
    const r = view.getBoundingClientRect();
    setZoom(k >= 3.5 ? 1 : k * 2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  let pan = null;
  view.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || k <= 1) return;
    pan = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop, moved: false };
  });
  view.addEventListener("pointermove", (e) => {
    if (!pan) return;
    pan.moved ||= Math.hypot(e.clientX - pan.x, e.clientY - pan.y) > 4;
    view.scrollLeft = pan.l - (e.clientX - pan.x);
    view.scrollTop = pan.t - (e.clientY - pan.y);
  });
  view.addEventListener(
    "click",
    (e) => {
      if (pan?.moved) e.stopPropagation();
      pan = null;
    },
    true
  );
  view.addEventListener("pointerup", () => setTimeout(() => (pan = null), 0));
}
initPosterZoom();

// =========================================================
// 8. 滚入显现（尊重 reducedMotion）
// =========================================================
const reveals = document.querySelectorAll(".reveal");
if (reducedMotion.matches) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08 }
  );
  reveals.forEach((el) => io.observe(el));
}
