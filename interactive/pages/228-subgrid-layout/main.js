import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  AXIS_MODES,
  CHEAT_LINES,
  COPY_PRESETS,
  FR_MAX,
  FR_MIN,
  INITIAL_HERO_STATE,
  QUIZ_OPTIONS,
  TIMELINE_ITEMS,
  clampFr,
  diagnoseHero,
  formatFr,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ==================== 1. 开场双层穿轨实验室 ==================== */
const heroState = { ...INITIAL_HERO_STATE };
const benchViewport = $("#bench-viewport");
const benchGrid = $("#bench-grid");
const benchCanvas = $("#bench-canvas");
const benchCtx = benchCanvas.getContext("2d");
const ratioRail = $("#ratio-rail");
const railFill = $("#rail-fill");
const railKnob = $("#rail-knob");
const knobVal = $("#knob-val");
const formulaReadout = $("#formula-readout");
const pgW2 = $("#pg-w2");
const pgW4 = $("#pg-w4");
const chipColDrift = $("#chip-col-drift");
const chipRowDrift = $("#chip-row-drift");

let canvasDirty = true;
let pulseUntil = 0;
let lastScore = 0;
let lastPreset = "";
let lastButtonsKey = "";
let lastRenderedFr = null;
let pendingFrRaf = 0;
let lastMetrics = { colDriftPx: 0, rowDriftPx: 0, overlapCount: 0, geom: null };

const setText = (el, val) => { if (el && el.textContent !== val) el.textContent = val; };

function relRect(el, origin) {
  const r = el.getBoundingClientRect();
  return {
    left: r.left - origin.left,
    right: r.right - origin.left,
    top: r.top - origin.top,
    bottom: r.bottom - origin.top,
    width: r.width,
    height: r.height,
  };
}

function rectsOverlapY(a, b) {
  return Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 6;
}

function measureBench() {
  const host = benchViewport.getBoundingClientRect();
  const a1 = relRect($("#pg-a1"), host);
  const a2 = relRect($("#pg-a2"), host);
  const b1 = relRect($("#pg-b1"), host);
  const b2 = relRect($("#pg-b2"), host);
  const modD = relRect($("#mod-d"), host);
  const modE = relRect($("#mod-e"), host);
  const d1 = relRect($("#d1"), host);
  const d2 = relRect($("#d2"), host);
  const d3 = relRect($("#d3"), host);
  const d4 = relRect($("#d4"), host);
  const e1 = relRect($("#e1"), host);
  const e2 = relRect($("#e2"), host);
  const e3 = relRect($("#e3"), host);
  const e4 = relRect($("#e4"), host);

  // 父网格列 1|2 与 列 3|4 的真实左起边（A2.left / B2.left）对照子网格内列起边（D2.left / E2.left）
  const dColErr = Math.abs(d2.left - a2.left);
  const eColErr = Math.abs(e2.left - b2.left);
  const colDriftPx = Math.max(dColErr, eColErr);

  // 兄弟模块 D 与 E 之间第 2 行与第 3 行的真实水平错位
  const row2Err = Math.abs(d3.top - e3.top);
  const row3Err = Math.abs(d4.top - e4.top);
  const rowDriftPx = Math.max(row2Err, row3Err);

  // 真实检测 span 1 / span 2 导致的子项压叠
  let overlapCount = 0;
  if (rectsOverlapY(d2, d3)) overlapCount++;
  if (rectsOverlapY(d3, d4)) overlapCount++;
  if (rectsOverlapY(e2, e3)) overlapCount++;
  if (rectsOverlapY(e3, e4)) overlapCount++;

  return {
    colDriftPx,
    rowDriftPx,
    overlapCount,
    geom: { host, a1, a2, b1, b2, modD, modE, d1, d2, d3, d4, e1, e2, e3, e4 },
  };
}

function applyHeroDom() {
  const frStr = formatFr(heroState.wideFr);
  if (lastRenderedFr !== heroState.wideFr) {
    lastRenderedFr = heroState.wideFr;
    benchGrid.style.setProperty("--wide-fr", frStr);
    const pct = ((heroState.wideFr - FR_MIN) / (FR_MAX - FR_MIN)) * 100;
    railFill.style.transform = `scaleX(${pct / 100})`;
    railKnob.style.left = `${pct}%`;
    setText(knobVal, `1 : ${frStr}`);
    ratioRail.setAttribute("aria-valuenow", String(heroState.wideFr));
    setText(formulaReadout, `1fr : ${frStr} : 1fr : ${frStr}`);
    setText(pgW2, frStr);
    setText(pgW4, frStr);
  }

  const btnKey = `${heroState.colMode}|${heroState.rowMode}|${heroState.rowSpan}|${heroState.subGap}|${heroState.copyPreset}`;
  if (lastButtonsKey !== btnKey) {
    lastButtonsKey = btnKey;
    benchGrid.dataset.colMode = heroState.colMode;
    benchGrid.dataset.rowMode = heroState.rowMode;
    benchGrid.dataset.rowSpan = String(heroState.rowSpan);
    benchGrid.dataset.subGap = heroState.subGap;
    benchGrid.dataset.collapsed = String(heroState.rowMode === "subgrid" && heroState.rowSpan < 3);

    if (lastPreset !== heroState.copyPreset) {
      lastPreset = heroState.copyPreset;
      const preset = COPY_PRESETS[heroState.copyPreset];
      $("#d2-title").innerHTML = preset.dTitle.replace(/\n/g, "<br>");
      setText($("#d3-body"), preset.dBody);
      $("#e2-title").innerHTML = preset.eTitle.replace(/\n/g, "<br>");
      setText($("#e3-body"), preset.eBody);
    }

    for (const btn of $$("[data-ctrl]")) {
      const key = btn.dataset.ctrl;
      const active = String(heroState[key]) === btn.dataset.val;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
  }
}

function updateHeroReadout() {
  lastMetrics = measureBench();
  const diag = diagnoseHero(heroState, lastMetrics);

  const diagCard = $("#diag-card");
  if (diagCard.dataset.level !== diag.level) diagCard.dataset.level = diag.level;
  setText($("#diag-tag"), diag.tag);
  setText($("#diag-score"), `${diag.score} / 4`);
  setText($("#diag-headline"), diag.headline);
  setText($("#diag-body"), diag.body);
  setText($("#diag-tip"), diag.nextTip);
  setText($("#diag-css"), diag.cssPreview);

  const colOk = heroState.colMode === "subgrid" && diag.colDrift <= 2;
  const rowOk = heroState.rowMode === "subgrid" && heroState.rowSpan === 3 && diag.rowDrift <= 2 && diag.overlaps === 0;
  setText(chipColDrift, colOk ? "列偏 Δ0px" : `列偏 Δ${diag.colDrift}px`);
  chipColDrift.classList.toggle("is-ok", colOk);
  setText(
    chipRowDrift,
    heroState.rowMode === "subgrid" && heroState.rowSpan < 3
      ? `压叠 ${Math.max(1, diag.overlaps)} 处`
      : rowOk
        ? "行偏 Δ0px"
        : `行偏 Δ${diag.rowDrift}px`
  );
  chipRowDrift.classList.toggle("is-ok", rowOk);

  const labels = {
    inherit: diag.badges.inherit ? "双轴通" : "待连",
    align: diag.badges.align ? "0px 齐" : "错位",
    nested: diag.badges.nested ? "span 3" : heroState.rowMode === "subgrid" && heroState.rowSpan < 3 ? "坍塌" : "断层",
    coord: diag.badges.coord ? "已协同" : `${diag.score}/4`,
  };
  for (const key of Object.keys(labels)) {
    const li = $(`.hb-item[data-badge="${key}"]`);
    if (li) li.classList.toggle("is-lit", diag.badges[key]);
    setText($(`#bs-${key}`), labels[key]);
  }

  if (diag.score === 4 && lastScore < 4 && !reducedMotion.matches) {
    pulseUntil = performance.now() + 750;
  }
  lastScore = diag.score;
  canvasDirty = true;
}

function drawBenchOverlay(t, dt, { still }) {
  const pulsing = !still && performance.now() < pulseUntil;
  if (!canvasDirty && !pulsing) return;
  canvasDirty = false;

  const g = lastMetrics.geom;
  if (!g || g.host.width < 10 || g.host.height < 10) return;

  const dpr = window.innerWidth <= 640 ? pixelRatio(1.5) : pixelRatio(2);
  const w = Math.round(g.host.width);
  const h = Math.round(g.host.height);
  const cw = Math.round(w * dpr);
  const ch = Math.round(h * dpr);
  if (benchCanvas.width !== cw || benchCanvas.height !== ch) {
    benchCanvas.width = cw;
    benchCanvas.height = ch;
  }
  const ctx = benchCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const colOk = heroState.colMode === "subgrid" && lastMetrics.colDriftPx <= 2;
  const collapsed = heroState.rowMode === "subgrid" && heroState.rowSpan < 3;
  const rowOk = heroState.rowMode === "subgrid" && heroState.rowSpan === 3 && lastMetrics.rowDriftPx <= 2;

  const topY = Math.max(4, g.a1.top - 7);
  const botY = Math.min(h - 4, Math.max(g.modD.bottom, g.modE.bottom) + 6);

  // 1. 父网格 5 条核心垂直轨道虚线（合并单路径一次 stroke）
  const parentXs = [g.a1.left, g.a2.left, g.b1.left, g.b2.left, g.b2.right];
  ctx.save();
  ctx.strokeStyle = colOk ? "rgba(17, 108, 84, 0.72)" : "rgba(17, 108, 84, 0.45)";
  ctx.lineWidth = colOk ? 1.5 : 1.1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (const x of parentXs) {
    ctx.moveTo(x, topY);
    ctx.lineTo(x, botY);
  }
  ctx.stroke();
  ctx.restore();

  // 2. 原海报标志性实心松绿轨道交点 ●（合并单路径一次 fill，大幅降低软件渲染绘制调用）
  const rowYs = [g.a1.top, g.a1.bottom, g.d3.top, g.d4.top];
  const pulseBoost = pulsing ? Math.sin(((pulseUntil - performance.now()) / 750) * Math.PI) * 2.5 : 0;
  const dotR = 3.2 + (colOk && rowOk ? pulseBoost * 0.5 : 0);
  ctx.save();
  ctx.fillStyle = colOk && rowOk ? "#116c54" : "#1f6e59";
  ctx.beginPath();
  for (const x of parentXs) {
    for (const y of rowYs) {
      ctx.moveTo(x + dotR, y);
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.restore();

  // 3. 若列轨未继承导致真实偏离，画珊瑚红错位标注与 Δpx 标尺
  if (lastMetrics.colDriftPx > 2.5) {
    const pairs = [
      { px: g.a2.left, cx: g.d2.left, y: g.d2.top + g.d2.height * 0.5 },
      { px: g.b2.left, cx: g.e2.left, y: g.e2.top + g.e2.height * 0.5 },
    ];
    ctx.save();
    for (const p of pairs) {
      const diff = Math.round(Math.abs(p.cx - p.px));
      if (diff <= 2) continue;
      // 子列实际分界珊瑚虚线
      ctx.strokeStyle = "#b53d24";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(p.cx, g.modD.top);
      ctx.lineTo(p.cx, g.modD.bottom);
      ctx.stroke();

      // 水平误差括号
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.px, p.y);
      ctx.lineTo(p.cx, p.y);
      ctx.stroke();

      // Δpx 标签胶囊（置于列线顶沿附近避免压住标题字）
      const midX = (p.px + p.cx) / 2;
      const lbl = `偏${diff}px`;
      ctx.font = '600 10.5px "IBM Plex Mono", "Noto Sans SC", monospace';
      const tw = ctx.measureText(lbl).width + 9;
      const bx = Math.max(4, Math.min(w - tw - 4, midX - tw / 2));
      const by = Math.max(4, g.modD.top + 3);
      ctx.fillStyle = "#a93820";
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, 16, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, bx + tw / 2, by + 8.5);
    }
    ctx.restore();
  }

  // 4. 水平行轨对准线 / 错位折线
  if (collapsed) {
    // span 不足折叠斜纹警示
    ctx.save();
    for (const mod of [g.modD, g.modE]) {
      ctx.strokeStyle = "#b53d24";
      ctx.lineWidth = 2;
      ctx.strokeRect(mod.left + 1, mod.top + 1, mod.width - 2, mod.height - 2);
      const badge = `span ${heroState.rowSpan} 压叠!`;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      const bw = ctx.measureText(badge).width + 12;
      ctx.fillStyle = "#a93820";
      ctx.beginPath();
      ctx.roundRect(mod.left + mod.width / 2 - bw / 2, mod.top + 4, bw, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badge, mod.left + mod.width / 2, mod.top + 13.5);
    }
    ctx.restore();
  } else if (lastMetrics.rowDriftPx > 2.5) {
    // 兄弟行线错开：在 D3.top 与 E3.top 之间画珊瑚阶梯折线
    const midX = (g.modD.right + g.modE.left) / 2;
    ctx.save();
    ctx.strokeStyle = "#b53d24";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(g.d3.left + 4, g.d3.top);
    ctx.lineTo(midX, g.d3.top);
    ctx.lineTo(midX, g.e3.top);
    ctx.lineTo(g.e3.right - 4, g.e3.top);
    ctx.stroke();

    const lbl = `行差${Math.round(lastMetrics.rowDriftPx)}px`;
    ctx.setLineDash([]);
    ctx.font = '600 10.5px "IBM Plex Mono", "Noto Sans SC", monospace';
    const tw = ctx.measureText(lbl).width + 9;
    const by = Math.max(4, Math.min(g.d3.top, g.e3.top) - 18);
    ctx.fillStyle = "#a93820";
    ctx.beginPath();
    ctx.roundRect(Math.max(4, Math.min(w - tw - 4, midX - tw / 2)), by, tw, 17, 4);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(lbl, Math.max(4 + tw / 2, Math.min(w - 4 - tw / 2, midX)), by + 9);
    ctx.restore();
  } else if (rowOk) {
    // 行轨对齐：画贯通松绿水平对齐线
    ctx.save();
    ctx.strokeStyle = "rgba(17, 108, 84, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    for (const y of [g.d3.top, g.d4.top]) {
      ctx.beginPath();
      ctx.moveTo(g.a1.left, y);
      ctx.lineTo(g.b2.right, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const benchLoop = loop(benchViewport, drawBenchOverlay);

function syncHero() {
  applyHeroDom();
  updateHeroReadout();
  benchLoop.draw();
}

// 顶沿父轨比例尺交互：支持鼠标、触屏（含 perf.mjs 的 touch 事件）与键盘 ←/→
// 将高频拖动合帧到 rAF 中执行，避免软件渲染下单帧多次同步重排
function setFrFromClientX(clientX) {
  const r = ratioRail.getBoundingClientRect();
  const pad = 18;
  const ratio = Math.max(0, Math.min(1, (clientX - (r.left + pad)) / Math.max(1, r.width - pad * 2)));
  const next = clampFr(FR_MIN + ratio * (FR_MAX - FR_MIN));
  heroState.wideFr = next;
  if (!pendingFrRaf) {
    pendingFrRaf = requestAnimationFrame(() => {
      pendingFrRaf = 0;
      applyHeroDom();
      updateHeroReadout();
      benchLoop.draw();
    });
  }
}

let draggingRail = false;
ratioRail.addEventListener("pointerdown", (e) => {
  draggingRail = true;
  ratioRail.setPointerCapture?.(e.pointerId);
  setFrFromClientX(e.clientX);
});
ratioRail.addEventListener("pointermove", (e) => {
  if (!draggingRail) return;
  setFrFromClientX(e.clientX);
});
ratioRail.addEventListener("pointerup", () => { draggingRail = false; });
ratioRail.addEventListener("pointercancel", () => { draggingRail = false; });

// 兼容直接派发 TouchEvent 的自动化测帧脚本
ratioRail.addEventListener("touchstart", (e) => {
  if (e.touches[0]) setFrFromClientX(e.touches[0].clientX);
}, { passive: true });
ratioRail.addEventListener("touchmove", (e) => {
  if (e.touches[0]) setFrFromClientX(e.touches[0].clientX);
}, { passive: true });

ratioRail.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    heroState.wideFr = clampFr(heroState.wideFr - 0.1);
    syncHero();
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    heroState.wideFr = clampFr(heroState.wideFr + 0.1);
    syncHero();
  }
});

for (const btn of $$("[data-ctrl]")) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.ctrl;
    const val = btn.dataset.val;
    heroState[key] = key === "rowSpan" ? Number(val) : val;
    syncHero();
  });
}

$("#hero-reset").addEventListener("click", () => {
  Object.assign(heroState, INITIAL_HERO_STATE);
  syncHero();
});

/* ==================== 2. 01 节：实景剖幕对照 ==================== */
const S1_COPIES = {
  short: [
    { h: "模块 A", p: "简短说明文字。", f: "1fr · 对齐" },
    { h: "模块 B", p: "简短说明文字。", f: "1fr · 对齐" },
    { h: "模块 C", p: "简短说明文字。", f: "1fr · 对齐" },
  ],
  real: [
    { h: "轨道继承", p: "单行短标题卡片的摘要。", f: "查看详情" },
    { h: "跨层级嵌套子网格<br>严格对齐多端规范", p: "标题折成两行，独立网格下会直接顶偏下方基准线。", f: "查看详情" },
    { h: "协同排版", p: "右侧卡片单行标题。", f: "查看详情" },
  ],
  extreme: [
    { h: "概览", p: "一句话摘要。", f: "进入" },
    { h: "多端自适应组件库<br>嵌套卡片双轴子网格<br>同步排版与容错规范", p: "超长标题折成三行后，普通嵌套网格的参差感会被急剧放大。", f: "进入" },
    { h: "指标", p: "一句话摘要。", f: "进入" },
  ],
};

let s1Copy = "real";
let s1Pos = 52;
const s1Good = $("#s1-cards-good");
const s1Bad = $("#s1-cards-bad");
const s1RawLayer = $("#curtain-raw-layer");
const s1Divider = $("#curtain-divider");
const s1Range = $("#s1-range");
const s1RangeVal = $("#s1-range-val");

function renderS1Cards() {
  const list = S1_COPIES[s1Copy];
  const html = list
    .map((c) => `<article class="demo-card"><h3 class="dc-h">${c.h}</h3><p class="dc-p">${c.p}</p><div class="dc-f">${c.f}</div></article>`)
    .join("");
  s1Good.innerHTML = html;
  s1Bad.innerHTML = html;

  requestAnimationFrame(() => {
    const measureDrift = (root) => {
      const ps = $$(".dc-p", root).map((el) => el.getBoundingClientRect().top);
      return ps.length ? Math.round(Math.max(...ps) - Math.min(...ps)) : 0;
    };
    const goodD = measureDrift(s1Good);
    const badD = measureDrift(s1Bad);
    $("#s1-good-drift").textContent = `行差 ${goodD}px`;
    $("#s1-bad-drift").textContent = `行差 ${badD}px`;
    $("#s1-readout").textContent =
      badD === 0
        ? "三张卡字数完全一样时，普通嵌套网格也能碰巧齐平——切换「真实长短不一」或「极端长标题」，才能立刻看出 subgrid 的威力。"
        : `实测结果：未用子网格时，三张卡的正文起点高低错开 ${badD}px；底层开启 grid-template-rows: subgrid 后，误差立刻压回 ${goodD}px。`;
  });
}

function setS1Split(pct) {
  s1Pos = Math.max(10, Math.min(90, Math.round(pct)));
  s1RawLayer.style.clipPath = `inset(0 ${100 - s1Pos}% 0 0)`;
  s1Divider.style.left = `${s1Pos}%`;
  s1Range.value = String(s1Pos);
  s1RangeVal.textContent = `${s1Pos}%`;
}

s1Range.addEventListener("input", () => setS1Split(Number(s1Range.value)));
const curtainStage = $("#curtain-stage");
let draggingCurtain = false;
curtainStage.addEventListener("pointerdown", (e) => {
  draggingCurtain = true;
  curtainStage.setPointerCapture?.(e.pointerId);
  const r = curtainStage.getBoundingClientRect();
  setS1Split(((e.clientX - r.left) / r.width) * 100);
});
curtainStage.addEventListener("pointermove", (e) => {
  if (!draggingCurtain) return;
  const r = curtainStage.getBoundingClientRect();
  setS1Split(((e.clientX - r.left) / r.width) * 100);
});
curtainStage.addEventListener("pointerup", () => { draggingCurtain = false; });
curtainStage.addEventListener("pointercancel", () => { draggingCurtain = false; });

for (const btn of $$("[data-s1-copy]")) {
  btn.addEventListener("click", () => {
    s1Copy = btn.dataset.s1Copy;
    for (const b of $$("[data-s1-copy]")) {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    renderS1Cards();
  });
}

/* ==================== 3. 02 节：单轴与双轴 2×2 矩阵 ==================== */
const axisStage = $("#axis-stage");
function setAxisMode(mode) {
  const info = AXIS_MODES[mode];
  axisStage.dataset.axis = mode;
  $("#ax-title").textContent = info.title;
  $("#ax-note").textContent = info.note;
  $("#ax-code").textContent = info.code;
  $("#ax-status").textContent = `${info.colLocked ? "纵线锁齐" : "纵线自由"} · ${info.rowLocked ? "横线锁齐" : "横线自由"}`;

  for (const btn of $$("[data-axis]")) {
    if (btn === axisStage) continue;
    const on = btn.dataset.axis === mode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }

  requestAnimationFrame(() => {
    const pCol2 = $(".ax-parent-r.b", axisStage).getBoundingClientRect().left;
    const lTitle = $("#ax-mod-l .c-title").getBoundingClientRect().left;
    const lBody = $("#ax-mod-l .c-body").getBoundingClientRect().top;
    const rBody = $("#ax-mod-r .c-body").getBoundingClientRect().top;
    const colD = Math.round(Math.abs(lTitle - pCol2));
    const rowD = Math.round(Math.abs(lBody - rBody));
    $("#ax-m-col").textContent = info.colLocked ? `0px（继承父列）` : `${colD}px（各自 1fr 1fr）`;
    $("#ax-m-row").textContent = info.rowLocked ? `0px（共享父行）` : `${rowD}px（独立行高）`;
  });
}

for (const btn of $$(".ax-btn[data-axis]")) {
  btn.addEventListener("click", () => setAxisMode(btn.dataset.axis));
}

/* ==================== 4. 03 节：反向撑大与沟槽继承 ==================== */
const S3_TITLES = [
  "团队协作版",
  "团队协作版<br>含全套网格规范工具",
  "团队协作版<br>含全套网格规范工具<br>与跨层子网格检查器",
  "团队协作版<br>含全套网格规范工具<br>与跨层子网格检查器<br>支持多团队设计令牌同步",
];
let s3Lines = 2;
let s3Gap = "inherit";
let s3Pad = 12;
const s3Grid = $("#s3-grid");

function renderS3() {
  $("#s3-c2-title").innerHTML = S3_TITLES[s3Lines - 1];
  $("#s3-lines-val").textContent = `${s3Lines} 行`;
  $("#s3-minus").disabled = s3Lines <= 1;
  $("#s3-plus").disabled = s3Lines >= 4;
  s3Grid.dataset.s3Gap = s3Gap;
  s3Grid.style.setProperty("--s3-pad", `${s3Pad}px`);

  for (const b of $$("[data-s3-gap]")) {
    const on = b.dataset.s3Gap === s3Gap;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of $$("[data-s3-pad]")) {
    const on = Number(b.dataset.s3Pad) === s3Pad;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }

  requestAnimationFrame(() => {
    const h1 = Math.round($("#s3-c1 .bc-h").getBoundingClientRect().height);
    const h2 = Math.round($("#s3-c1 .bc-p").getBoundingClientRect().height);
    const tops = [$("#s3-c1 .bc-p"), $("#s3-c2 .bc-p"), $("#s3-c3 .bc-p")].map((el) => el.getBoundingClientRect().top);
    const diff = Math.round(Math.max(...tops) - Math.min(...tops));
    $("#s3-r1").textContent = `${h1}px`;
    $("#s3-r2").textContent = `${h2}px`;
    $("#s3-diff").textContent = `${diff}px`;
    $("#s3-explain").textContent =
      s3Gap === "0"
        ? `当前 2 号卡标题 ${s3Lines} 行，把三张卡的第 1 条父行轨同步撑至 ${h1}px；同时你覆写了 row-gap: 0px，卡片内各行紧贴在一起，但三张卡之间依然共享同一组行线（横线误差 ${diff}px）。`
        : `当前 2 号卡标题 ${s3Lines} 行 + 卡壳内边距 ${s3Pad}px，已反向将父网格第 1 条行轨撑大到 ${h1}px；1 号卡与 3 号卡虽然标题只有一行，底线依然同步齐平（桌面三列误差 ${diff}px）。`;
  });
}

$("#s3-minus").addEventListener("click", () => { if (s3Lines > 1) { s3Lines--; renderS3(); } });
$("#s3-plus").addEventListener("click", () => { if (s3Lines < 4) { s3Lines++; renderS3(); } });
for (const b of $$("[data-s3-gap]")) b.addEventListener("click", () => { s3Gap = b.dataset.s3Gap; renderS3(); });
for (const b of $$("[data-s3-pad]")) b.addEventListener("click", () => { s3Pad = Number(b.dataset.s3Pad); renderS3(); });

/* ==================== 5. 04 节：交互时间轴 ==================== */
function setTimeline(idx) {
  const item = TIMELINE_ITEMS[idx] || TIMELINE_ITEMS[4];
  $("#tl-badge").textContent = item.badge;
  $("#tl-date").textContent = item.date;
  $("#tl-title").textContent = item.title;
  $("#tl-body").textContent = item.body;
  $("#tl-hack").textContent = item.hack;
  for (const b of $$("[data-tl]")) {
    const on = Number(b.dataset.tl) === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }
}

for (const b of $$("[data-tl]")) {
  b.addEventListener("click", () => setTimeline(Number(b.dataset.tl)));
}

/* ==================== 6. 05 节：反例诊断台 ==================== */
const TRAP_TEXT = {
  ok: "正常状态：卡片声明 grid-row: span 3，内部正好 3 项，卡壳的实线边框与绿底完好无损，两卡三层严格对齐。",
  overflow: "踩坑了！塞进 5 项动态评论后，因为 subgrid 不会创建隐式行轨，第 04、05 项全被强行钳制叠压在第 3 条轨道里互相遮挡。动态列表不要硬锁行子网格！",
  contents: "换成 display: contents 后，两个 .trap-card 外壳从渲染盒树里被拆掉了——外框、圆角、绿底与整卡阴影全部消失，只剩下裸散的 6 个零散格子。",
};

const trapStage = $("#trap-stage");
for (const b of $$("[data-trap]")) {
  if (b === trapStage) continue;
  b.addEventListener("click", () => {
    const mode = b.dataset.trap;
    trapStage.dataset.trap = mode;
    $("#trap-verdict").textContent = TRAP_TEXT[mode];
    for (const btn of $$(".trap-tabs [data-trap]")) {
      const on = btn === b;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
  });
}

/* ==================== 7. 06 节：命名线与 CSS 速查联动 ==================== */
const cheatSvg = $("#cheat-svg");
function setCheatLine(id) {
  const item = CHEAT_LINES.find((x) => x.id === id) || CHEAT_LINES[0];
  cheatSvg.dataset.hl = item.zone;
  $("#ce-title").textContent = item.title;
  $("#ce-desc").textContent = item.desc;
  for (const row of $$("[data-cl]")) {
    const on = row.dataset.cl === item.id;
    row.classList.toggle("is-active", on);
    row.setAttribute("aria-selected", String(on));
  }
}

for (const row of $$("[data-cl]")) {
  row.addEventListener("click", () => setCheatLine(row.dataset.cl));
}

/* ==================== 8. 07 节：小练习 ==================== */
const quizGrid = $("#quiz-grid");
for (const btn of $$(".quiz-opt")) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.opt;
    const item = QUIZ_OPTIONS[key];
    quizGrid.classList.add("is-revealed");
    for (const o of $$(".quiz-opt")) {
      const k = o.dataset.opt;
      const picked = o === btn;
      o.setAttribute("aria-pressed", String(picked));
      o.classList.toggle("is-picked", picked);
      o.classList.toggle("is-correct", QUIZ_OPTIONS[k].correct);
      o.classList.toggle("is-wrong", picked && !QUIZ_OPTIONS[k].correct);
    }
    $("#qv-title").textContent = item.title;
    $("#qv-body").textContent = item.detail;
  });
}

/* ==================== 9. 08 节：原海报放大灯箱（拖移 + Esc） ==================== */
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const posterOpen = $("#poster-open");
const lbClose = $("#lb-close");
let pan = { x: 0, y: 0, dragging: false, sx: 0, sy: 0 };

function openLightbox() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  pan = { x: 0, y: 0, dragging: false, sx: 0, sy: 0 };
  lbImg.style.transform = "translate(0px, 0px) scale(1.18)";
  lightbox.hidden = false;
  lbClose.focus();
}
function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lbStage) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  pan.dragging = true;
  pan.sx = e.clientX - pan.x;
  pan.sy = e.clientY - pan.y;
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!pan.dragging) return;
  pan.x = Math.max(-320, Math.min(320, e.clientX - pan.sx));
  pan.y = Math.max(-320, Math.min(320, e.clientY - pan.sy));
  lbImg.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(1.18)`;
});
lbStage.addEventListener("pointerup", () => {
  pan.dragging = false;
  lbStage.classList.remove("is-dragging");
});
lbStage.addEventListener("pointercancel", () => {
  pan.dragging = false;
  lbStage.classList.remove("is-dragging");
});

/* ==================== 初始化与视口重算 ==================== */
let lastViewportW = window.innerWidth;
window.addEventListener("resize", () => {
  if (Math.abs(window.innerWidth - lastViewportW) < 2) return;
  lastViewportW = window.innerWidth;
  updateHeroReadout();
  benchLoop.draw();
  renderS3();
});

syncHero();
renderS1Cards();
setS1Split(52);
setAxisMode("row");
renderS3();
setTimeline(4);
setCheatLine("parent-cols");

document.fonts?.ready.then(() => {
  syncHero();
  renderS1Cards();
  setAxisMode(axisStage.dataset.axis || "row");
  renderS3();
});
