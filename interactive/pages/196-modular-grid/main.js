// 196 模块化网格 — 主控脚本：联动开场积木拼版台、五原则微图解、01–07 全节交互与原海报放大器
import {
  GRID_PRESETS,
  GUTTER_PRESETS,
  BLOCK_DEFS,
  createBrokenState,
  createReferenceBlocks,
  clampBlocksToGrid,
  evaluateLayout,
  computeSpanFormula,
  solveGerstnerGrid,
  evaluateBaselineLock,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";

const DEF_MAP = Object.fromEntries(BLOCK_DEFS.map((d) => [d.id, d]));

// ==================== 全局开场单真源状态 ====================
let state = createBrokenState();
let evaluation = evaluateLayout(state);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// 缓存上一次 DOM 渲染快照，拖动帧中跳过未变化的 DOM/SVG 写入，确保慢手机软件渲染也能 50–60fps
const uiCache = {
  specimenKey: "",
  principleKeys: [],
  pillText: "",
  selKey: "",
  diagKey: "",
  metricsKey: "",
  controlsKey: "",
};

function setTextIfChanged(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

// 1. 渲染示范大标旁边的缩微 X×X 矩阵 SVG（仅粒度或缝隙变时重建）
function renderTitleSpecimen() {
  const key = `${state.cols}x${state.rows}:${state.gutterFrac}`;
  if (key === uiCache.specimenKey) return;
  uiCache.specimenKey = key;
  const svg = $("#title-grid-svg");
  const tag = $("#title-unit-tag");
  if (!svg || !tag) return;
  const n = state.cols <= 4 ? 2 : state.cols <= 6 ? 3 : 4;
  const g = Math.max(1.5, Math.round(state.gutterFrac * 18));
  const pad = 4;
  const cell = (64 - pad * 2 - (n - 1) * g) / n;
  let html = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = pad + c * (cell + g);
      const y = pad + r * (cell + g);
      const isUnit = r === 0 && c === 0;
      const isSpan = r === 1 && c >= 1 && c <= 2;
      const fill = isUnit ? "#342039" : isSpan ? "#EBC7A0" : "#FDF6E9";
      const stroke = isUnit ? "#342039" : "#D55A07";
      html += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-dasharray="${isUnit || isSpan ? "none" : "2 1.5"}"/>`;
      if (isUnit) {
        html += `<circle cx="${(x + cell / 2).toFixed(1)}" cy="${(y + cell / 2).toFixed(1)}" r="${Math.max(1.8, cell * 0.16).toFixed(1)}" fill="#FDF6E9"/>`;
      }
    }
  }
  svg.innerHTML = html;
  tag.textContent = `${state.cols}×${state.rows} · X`;
}

// 2. 渲染左侧原海报同款 5 枚动态微图解原则
function principleGlyphSVG(key, ok) {
  const accent = ok ? "#1C6B54" : "#D55A07";
  const dark = "#342039";
  const tan = "#EBC7A0";
  if (key === "system") {
    return `<svg class="p-glyph" viewBox="0 0 42 42" aria-hidden="true">
      <rect x="4" y="4" width="34" height="34" fill="#FDF6E9" stroke="${accent}" stroke-width="1.2" stroke-dasharray="3 2"/>
      <path d="M15.3 4V38M26.7 4V38M4 15.3H38M4 26.7H38" stroke="${accent}" stroke-width="1" stroke-dasharray="2.5 2"/>
      <rect x="${ok ? 4 : 7}" y="${ok ? 4 : 6}" width="11.3" height="11.3" fill="${dark}"/>
    </svg>`;
  }
  if (key === "repeat") {
    const gap = ok ? 3 : 0;
    return `<svg class="p-glyph" viewBox="0 0 42 42" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" fill="${dark}"/>
      <rect x="${19 + gap}" y="5" width="14" height="14" fill="${tan}"/>
      <rect x="5" y="${19 + gap}" width="14" height="14" fill="${tan}"/>
      <rect x="${19 + gap}" y="${19 + gap}" width="14" height="14" fill="${accent}"/>
    </svg>`;
  }
  if (key === "combine") {
    return ok
      ? `<svg class="p-glyph" viewBox="0 0 42 42" aria-hidden="true">
          <rect x="4" y="4" width="21" height="21" fill="${dark}"/>
          <rect x="27" y="4" width="11" height="10" fill="${tan}"/>
          <rect x="27" y="16" width="11" height="22" fill="${accent}"/>
          <rect x="4" y="27" width="21" height="11" fill="${tan}"/>
        </svg>`
      : `<svg class="p-glyph" viewBox="0 0 42 42" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" fill="${tan}" stroke="${accent}" stroke-width="1"/>
          <rect x="23" y="5" width="14" height="14" fill="${tan}" stroke="${accent}" stroke-width="1"/>
          <rect x="5" y="23" width="14" height="14" fill="${tan}" stroke="${accent}" stroke-width="1"/>
          <rect x="23" y="23" width="14" height="14" fill="${tan}" stroke="${accent}" stroke-width="1"/>
        </svg>`;
  }
  if (key === "adapt") {
    return `<svg class="p-glyph" viewBox="0 0 42 42" aria-hidden="true">
      <rect x="4" y="6" width="15" height="30" fill="#FDF6E9" stroke="#C8B298"/>
      <line x1="7" y1="12" x2="16" y2="12" stroke="${dark}" stroke-width="2"/>
      <line x1="7" y1="18" x2="16" y2="18" stroke="${dark}" stroke-width="1.6"/>
      <line x1="7" y1="24" x2="14" y2="24" stroke="${dark}" stroke-width="1.6"/>
      <rect x="22" y="6" width="16" height="30" fill="${tan}"/>
      <circle cx="28" cy="14" r="3" fill="${accent}"/>
      <path d="M22 36 L29 24 L38 36 Z" fill="${dark}"/>
    </svg>`;
  }
  return `<svg class="p-glyph" viewBox="0 0 42 42" aria-hidden="true">
    <line x1="5" y1="33" x2="37" y2="33" stroke="${dark}" stroke-width="2"/>
    <polygon points="21,33 17,39 25,39" fill="${accent}"/>
    <rect x="6" y="${ok ? 17 : 10}" width="13" height="${ok ? 14 : 21}" fill="${dark}"/>
    <rect x="23" y="21" width="12" height="10" fill="${tan}"/>
  </svg>`;
}

function renderHeroUI(isDragFrame = false) {
  evaluation = evaluateLayout(state);
  const { score, total, principles, diag, metrics } = evaluation;

  // 顶眉徽章（仅变时写）
  const pillText = score === total ? `${score} / ${total} 秩序成立` : `${score} / ${total} 待排块`;
  if (pillText !== uiCache.pillText) {
    uiCache.pillText = pillText;
    const pill = $("#hero-score-pill");
    pill.textContent = pillText;
    pill.classList.toggle("is-ok", score === total);
    pill.classList.toggle("is-err", score !== total);
  }

  // 示范大标缩微图（内部自带缓存）
  renderTitleSpecimen();

  // 5 条原则列表：首次建 DOM，之后仅差量更新变更项（拖动时几乎零 DOM 重排）
  const listEl = $("#principles-list");
  if (listEl.children.length !== principles.length) {
    listEl.innerHTML = principles
      .map(
        (p) => `<li class="p-item ${p.ok ? "is-ok" : "is-err"}">
          <span class="p-num">${p.ok ? "✓" : p.id}</span>
          <div class="p-body">
            <div class="p-top">
              <span class="p-title">${p.title}</span>
              <span class="p-state">${p.badge}</span>
            </div>
            <p class="p-desc">${p.desc}</p>
          </div>
          <span class="p-glyph-slot">${principleGlyphSVG(p.key, p.ok)}</span>
        </li>`
      )
      .join("");
    uiCache.principleKeys = principles.map((p) => `${p.ok}:${p.badge}`);
  } else {
    principles.forEach((p, idx) => {
      const k = `${p.ok}:${p.badge}`;
      if (uiCache.principleKeys[idx] === k) return;
      const prevOk = uiCache.principleKeys[idx]?.startsWith("true:");
      uiCache.principleKeys[idx] = k;
      const li = listEl.children[idx];
      li.classList.toggle("is-ok", p.ok);
      li.classList.toggle("is-err", !p.ok);
      setTextIfChanged(li.querySelector(".p-num"), p.ok ? "✓" : String(p.id));
      setTextIfChanged(li.querySelector(".p-state"), p.badge);
      if (prevOk !== p.ok) {
        li.querySelector(".p-glyph-slot").innerHTML = principleGlyphSVG(p.key, p.ok);
      }
    });
  }

  // 当前选中块信息
  const sel = state.blocks.find((b) => b.id === state.selectedId) || state.blocks[0];
  const selSpan = `${Number.isInteger(sel.w) ? sel.w : sel.w.toFixed(1)}×${Number.isInteger(sel.h) ? sel.h : sel.h.toFixed(1)} 格`;
  const selKey = `${sel.id}:${selSpan}`;
  if (selKey !== uiCache.selKey) {
    uiCache.selKey = selKey;
    setTextIfChanged($("#sel-name"), DEF_MAP[sel.id].name);
    setTextIfChanged($("#sel-span"), selSpan);
  }

  // 底部虚线 TIP 实测诊单带（拖动帧仅在诊断变化时写 DOM）
  const diagKey = `${diag.severity}|${diag.tag}|${diag.headline}`;
  if (diagKey !== uiCache.diagKey) {
    uiCache.diagKey = diagKey;
    const banner = $("#diag-banner");
    banner.classList.toggle("is-ok", diag.severity === "ok");
    banner.classList.toggle("is-err", diag.severity !== "ok");
    setTextIfChanged($("#diag-tag"), diag.tag);
    setTextIfChanged($("#diag-headline"), diag.headline);
    setTextIfChanged($("#diag-why"), diag.why);
    setTextIfChanged($("#diag-action"), diag.action);
  }

  // 实时物理读数（精确到 1 像素级变化再写）
  const offTxt = metrics.maxOff <= 0.06 ? "0.00X 齐" : `+${metrics.maxOff.toFixed(2)}X`;
  const ratioTxt = `${metrics.areaRatio.toFixed(1)}×`;
  const coverTxt = `${Math.round(metrics.coverage * 100)}% / ${Math.round(metrics.whitespace * 100)}%`;
  const centerTxt = `${Math.round(metrics.centerDist * 100)}%`;
  const mKey = `${offTxt}|${ratioTxt}|${coverTxt}|${centerTxt}`;
  if (mKey !== uiCache.metricsKey) {
    uiCache.metricsKey = mKey;
    setTextIfChanged($("#m-off"), offTxt);
    setTextIfChanged($("#m-ratio"), ratioTxt);
    setTextIfChanged($("#m-cover"), coverTxt);
    setTextIfChanged($("#m-center"), centerTxt);
  }

  // 同步按钮高亮态（拖动帧里粒度/缝隙/吸附不会变，跳过）
  if (isDragFrame) return;
  const ctrlKey = `${state.scene}|${state.cols}x${state.rows}|${state.gutterFrac}|${state.snap}`;
  if (ctrlKey === uiCache.controlsKey) return;
  uiCache.controlsKey = ctrlKey;

  $$("[data-scene]").forEach((btn) => {
    const active = btn.dataset.scene === state.scene;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  const gridId = `${state.cols}x${state.rows}`;
  $$("[data-grid]").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.grid === gridId));
  $$("[data-gutter]").forEach((btn) => {
    const preset = GUTTER_PRESETS.find((g) => g.id === btn.dataset.gutter);
    btn.classList.toggle("is-active", preset && Math.abs(preset.frac - state.gutterFrac) < 0.01);
  });

  const snapBtn = $("#btn-snap");
  snapBtn.textContent = state.snap ? "网格吸附：开" : "网格吸附：关";
  snapBtn.setAttribute("aria-pressed", String(state.snap));
  snapBtn.classList.toggle("is-on", state.snap);
  snapBtn.classList.toggle("is-warn", !state.snap);
}

// 挂载开场 2D Canvas
const heroCanvas = mountHeroCanvas(
  $("#hero-canvas"),
  () => state,
  () => evaluation,
  (mutator, isDragFrame = false) => {
    mutator(state);
    renderHeroUI(isDragFrame);
  }
);

function updateState(fn) {
  fn(state);
  renderHeroUI();
  heroCanvas.redraw();
}

// 绑定 Hero 控件
$$("[data-scene]").forEach((btn) =>
  btn.addEventListener("click", () => updateState((s) => (s.scene = btn.dataset.scene)))
);

$$("[data-grid]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const p = GRID_PRESETS.find((x) => x.id === btn.dataset.grid);
    if (!p) return;
    updateState((s) => {
      s.cols = p.cols;
      s.rows = p.rows;
      s.blocks = clampBlocksToGrid(s.blocks, s.cols, s.rows, s.snap);
    });
  })
);

$$("[data-gutter]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const p = GUTTER_PRESETS.find((x) => x.id === btn.dataset.gutter);
    if (!p) return;
    updateState((s) => (s.gutterFrac = p.frac));
  })
);

$("#btn-snap").addEventListener("click", () => {
  updateState((s) => {
    s.snap = !s.snap;
    if (s.snap) s.blocks = clampBlocksToGrid(s.blocks, s.cols, s.rows, true);
  });
});

$("#btn-ref").addEventListener("click", () => {
  updateState((s) => {
    if (s.cols * s.rows <= 12) {
      s.cols = 8;
      s.rows = 6;
    }
    s.snap = true;
    s.gutterFrac = 0.16;
    s.blocks = createReferenceBlocks(s.cols, s.rows);
  });
});

$("#btn-reset").addEventListener("click", () => {
  const curScene = state.scene;
  state = createBrokenState();
  state.scene = curScene;
  renderHeroUI();
  heroCanvas.redraw();
});

function adjustSelectedSpan(dw, dh) {
  updateState((s) => {
    const b = s.blocks.find((x) => x.id === s.selectedId);
    if (!b) return;
    const nw = Math.max(1, Math.min(s.cols, (s.snap ? Math.round(b.w) : b.w) + dw));
    const nh = Math.max(1, Math.min(s.rows, (s.snap ? Math.round(b.h) : b.h) + dh));
    b.w = +nw.toFixed(2);
    b.h = +nh.toFixed(2);
    if (b.x + b.w > s.cols) b.x = Math.max(0, s.cols - b.w);
    if (b.y + b.h > s.rows) b.y = Math.max(0, s.rows - b.h);
    if (s.snap) s.blocks = clampBlocksToGrid(s.blocks, s.cols, s.rows, true);
  });
}

$("#btn-w-dec").addEventListener("click", () => adjustSelectedSpan(-1, 0));
$("#btn-w-inc").addEventListener("click", () => adjustSelectedSpan(1, 0));
$("#btn-h-dec").addEventListener("click", () => adjustSelectedSpan(0, -1));
$("#btn-h-inc").addEventListener("click", () => adjustSelectedSpan(0, 1));
$("#btn-next-block").addEventListener("click", () => {
  updateState((s) => {
    const idx = s.blocks.findIndex((b) => b.id === s.selectedId);
    s.selectedId = s.blocks[(idx + 1) % s.blocks.length].id;
  });
});

renderHeroUI();
heroCanvas.redraw();

// ==================== 01 节：二维涂抹合并矩阵（Paint-to-Merge） ====================
(function initSpanMatrix() {
  const host = $("#span-matrix");
  const COLS = 8;
  const ROWS = 5;
  let sel = { c1: 1, r1: 1, c2: 3, r2: 2 };
  let anchor = null;

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sm-cell";
      btn.dataset.c = String(c);
      btn.dataset.r = String(r);
      btn.textContent = `${c + 1},${r + 1}`;
      btn.setAttribute("aria-label", `第 ${c + 1} 列第 ${r + 1} 行`);
      host.appendChild(btn);
      cells.push(btn);
    }
  }
  const overlay = document.createElement("div");
  overlay.className = "sm-overlay";
  host.appendChild(overlay);

  function updateMatrix() {
    const minC = Math.min(sel.c1, sel.c2);
    const maxC = Math.max(sel.c1, sel.c2);
    const minR = Math.min(sel.r1, sel.r2);
    const maxR = Math.max(sel.r1, sel.r2);
    cells.forEach((el) => {
      const c = +el.dataset.c;
      const r = +el.dataset.r;
      el.classList.toggle("is-sel", c >= minC && c <= maxC && r >= minR && r <= maxR);
    });

    const first = cells[minR * COLS + minC];
    const last = cells[maxR * COLS + maxC];
    if (first && last) {
      const hr = host.getBoundingClientRect();
      const fr = first.getBoundingClientRect();
      const lr = last.getBoundingClientRect();
      if (hr.width > 0 && fr.width > 0) {
        overlay.style.left = `${fr.left - hr.left - 2}px`;
        overlay.style.top = `${fr.top - hr.top - 2}px`;
        overlay.style.width = `${lr.right - fr.left + 4}px`;
        overlay.style.height = `${lr.bottom - fr.top + 4}px`;
      }
    }

    const spanW = maxC - minC + 1;
    const spanH = maxR - minR + 1;
    const f = computeSpanFormula(spanW, spanH, 64, 12);
    $("#f-span").textContent = `${f.spanW} 列 × ${f.spanH} 行（共 ${f.cells} 格）`;
    $("#f-w").textContent = f.formulaW;
    $("#f-h").textContent = f.formulaH;
    $("#f-note").textContent =
      f.eatenGutterX + f.eatenGutterY === 0
        ? "单格 1×1 不跨越任何缝隙；适合徽章、角标等最小元素，全部堆成 1×1 会陷入平权呆板。"
        : `合并后模块吞掉了横向 ${f.eatenGutterX} 道缝（+${f.eatenGutterX * 12}px）与纵向 ${f.eatenGutterY} 道缝（+${f.eatenGutterY * 12}px），外沿依然精准咬在整套矩阵线上。`;

    $$("[data-span-preset]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.spanPreset === `${spanW},${spanH}`);
    });
  }

  function cellAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !el.classList.contains("sm-cell")) return null;
    return { c: +el.dataset.c, r: +el.dataset.r };
  }

  host.addEventListener("pointerdown", (e) => {
    const target = e.target.closest(".sm-cell");
    if (!target) return;
    anchor = { c: +target.dataset.c, r: +target.dataset.r };
    sel = { c1: anchor.c, r1: anchor.r, c2: anchor.c, r2: anchor.r };
    host.setPointerCapture?.(e.pointerId);
    updateMatrix();
  });
  host.addEventListener("pointermove", (e) => {
    if (!anchor) return;
    const hit = cellAtPoint(e.clientX, e.clientY);
    if (hit) {
      sel.c2 = hit.c;
      sel.r2 = hit.r;
      updateMatrix();
    }
  });
  host.addEventListener("pointerup", () => (anchor = null));
  host.addEventListener("pointercancel", () => (anchor = null));

  $$("[data-span-preset]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const [w, h] = btn.dataset.spanPreset.split(",").map(Number);
      sel = { c1: 1, r1: 1, c2: Math.min(COLS - 1, w), r2: Math.min(ROWS - 1, h) };
      updateMatrix();
    })
  );

  new ResizeObserver(updateMatrix).observe(host);
  requestAnimationFrame(updateMatrix);
})();

// ==================== 02 节：格斯特纳 58 单位数学解算器 ====================
(function initGerstner() {
  let total = 58;
  let cols = 4;

  function render() {
    const res = solveGerstnerGrid(total, cols, 2);
    const host = $("#gerstner-ruler");
    let segs = "";
    const unitTypes = [];
    for (let i = 0; i < res.cols; i++) {
      const pct = (res.colWidth / res.totalUnits) * 100;
      segs += `<div class="g-seg is-col" style="width:${pct.toFixed(4)}%">${res.colWidth}格</div>`;
      for (let k = 0; k < res.colWidth; k++) unitTypes.push("col");
      if (i < res.cols - 1) {
        const gPct = (res.gutterUnits / res.totalUnits) * 100;
        segs += `<div class="g-seg is-gut" style="width:${gPct.toFixed(4)}%">2</div>`;
        for (let k = 0; k < res.gutterUnits; k++) unitTypes.push("gut");
      }
    }
    if (res.remainder > 0) {
      const rPct = (res.remainder / res.totalUnits) * 100;
      segs += `<div class="g-seg is-rem" style="width:${rPct.toFixed(4)}%">+${res.remainder}</div>`;
      for (let k = 0; k < res.remainder; k++) unitTypes.push("rem");
    }

    const ticks = unitTypes
      .map((t) => `<span class="g-tick ${t === "gut" ? "is-gut" : t === "rem" ? "is-rem" : ""}"></span>`)
      .join("");

    host.innerHTML = `<div class="g-bar">${segs}</div><div class="g-ticks" style="grid-template-columns:repeat(${res.totalUnits}, 1fr)">${ticks}</div>`;

    const badge = $("#g-status");
    badge.textContent = res.exact ? "严丝合缝" : `余 ${res.remainder} 格错位`;
    badge.classList.toggle("is-ok", res.exact);
    badge.classList.toggle("is-err", !res.exact);
    $("#g-eq").textContent = res.equation;

    $$("[data-total]").forEach((b) => b.classList.toggle("is-active", +b.dataset.total === total));
    $$("[data-gcols]").forEach((b) => b.classList.toggle("is-active", +b.dataset.gcols === cols));
  }

  $$("[data-total]").forEach((b) =>
    b.addEventListener("click", () => {
      total = +b.dataset.total;
      render();
    })
  );
  $$("[data-gcols]").forEach((b) =>
    b.addEventListener("click", () => {
      cols = +b.dataset.gcols;
      render();
    })
  );
  render();
})();

// ==================== 03 节：X 光透视滑幕 + 四积木高亮 ====================
(function initXray() {
  const range = $("#xray-range");
  const val = $("#xray-val");
  const trio = $("#arena-trio");
  range.addEventListener("input", () => {
    const v = Number(range.value);
    val.textContent = `${v}%`;
    trio.style.setProperty("--xray", (v / 100).toFixed(2));
  });
  $$("[data-hl]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const role = btn.dataset.hl;
      if (role === "all") trio.removeAttribute("data-hl");
      else trio.dataset.hl = role;
      $$("[data-hl]").forEach((b) => b.classList.toggle("is-active", b === btn));
    })
  );
})();

// ==================== 04 节：基线 × 横缝双轴咬合检视器 ====================
(function initBaselineLab() {
  let k = 4;
  let glines = 1;

  function render() {
    const res = evaluateBaselineLock(k, glines, 22);
    $("#base-k-val").textContent = `${k} 行`;
    $$("[data-glines]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.glines) === glines));

    const diag = $("#base-diag");
    diag.classList.toggle("is-ok", res.locked);
    diag.classList.toggle("is-err", !res.locked);
    diag.innerHTML = res.locked
      ? `<strong>图底与末行字脚严丝合缝（误差 0px）</strong><span>${res.formula}</span>`
      : `<strong>第 2 块正文基线错相 ${res.driftPx}px（差半行对不齐图底）</strong><span>${res.formula} — 把横缝调回整行（1 行或 2 行）立即咬齐。</span>`;

    // 精确绘制基线网格 + 左跨 2 块主图 + 右上下两块文字
    const svg = $("#baseline-svg");
    const padX = 22;
    const padY = 26;
    const totalLines = Math.ceil(2 * k + glines + 1.5);
    const lh = Math.min(22, (320 - padY * 2) / totalLines);
    const modH = k * lh;
    const gutH = glines * lh;
    const imgH = 2 * modH + gutH;
    const col1W = 194;
    const col2X = padX + col1W + 22;
    const col2W = 480 - col2X - padX;

    let linesMarkup = "";
    for (let i = 0; i <= totalLines; i++) {
      const y = padY + i * lh;
      linesMarkup += `<line x1="${padX}" y1="${y.toFixed(1)}" x2="${480 - padX}" y2="${y.toFixed(1)}" stroke="#E6D5BF" stroke-width="1"/>`;
    }

    // 右侧第 1 块文字（严格踩在 1..k 行基线）
    let text1 = "";
    const samples1 = ["小单元定下规矩，", "横缝必须等于整倍", "行距，跨区底边才", "不会差出半行。", "继续往下延伸时，", "整栏韵律依然稳。", "基线与框线合一。"];
    for (let i = 0; i < k; i++) {
      const ty = padY + (i + 1) * lh - 4;
      text1 += `<text x="${col2X + 8}" y="${ty.toFixed(1)}" fill="#26182B" font-size="11.5">${samples1[i % samples1.length]}</text>`;
    }

    // 右侧第 2 块：如果基线对齐，按整行落；若横缝非整行，展示模块框与被迫下移半行的文字末行错位
    const row2BoxY = padY + modH + gutH;
    const snappedLineStart = Math.ceil(k + glines);
    let text2 = "";
    const samples2 = ["第二块从横缝之下", "接续起排，一旦横", "缝不是整行，末行", "脚底就会冲破图底", "基准红线，视觉立", "刻显得一高一低。", "对齐需要双轴同算。"];
    for (let i = 0; i < k; i++) {
      const ty = padY + (snappedLineStart + i + 1) * lh - 4;
      text2 += `<text x="${col2X + 8}" y="${ty.toFixed(1)}" fill="${res.locked ? "#26182B" : "#B82914"}" font-size="11.5">${samples2[i % samples2.length]}</text>`;
    }

    const bottomImgY = padY + imgH;
    const bottomTextY = padY + (snappedLineStart + k) * lh;

    svg.innerHTML = `
      <rect x="0" y="0" width="480" height="320" fill="#FFFDF8"/>
      ${linesMarkup}
      <!-- 左栏：跨 2 块主图 -->
      <rect x="${padX}" y="${padY}" width="${col1W}" height="${imgH.toFixed(1)}" fill="#342039"/>
      <circle cx="${padX + 46}" cy="${padY + 42}" r="18" fill="#EBC7A0"/>
      <path d="M${padX} ${(padY + imgH).toFixed(1)} L${padX + 76} ${(padY + imgH * 0.45).toFixed(1)} L${padX + 132} ${(padY + imgH * 0.72).toFixed(1)} L${padX + 166} ${(padY + imgH * 0.54).toFixed(1)} L${padX + col1W} ${(padY + imgH).toFixed(1)} Z" fill="#D55A07" opacity="0.88"/>
      <text x="${padX + 10}" y="${padY + 18}" fill="#FDF6E9" font-size="11" font-weight="700">左栏跨 2 块主图</text>

      <!-- 右栏：块 1 与块 2 虚线框 -->
      <rect x="${col2X}" y="${padY}" width="${col2W}" height="${modH.toFixed(1)}" fill="rgba(235,199,160,0.28)" stroke="#BFA488" stroke-dasharray="4 3"/>
      <rect x="${col2X}" y="${row2BoxY.toFixed(1)}" width="${col2W}" height="${modH.toFixed(1)}" fill="rgba(235,199,160,0.28)" stroke="${res.locked ? "#1C6B54" : "#B82914"}" stroke-dasharray="4 3"/>
      <!-- 横缝高亮带 -->
      <rect x="${col2X}" y="${(padY + modH).toFixed(1)}" width="${col2W}" height="${gutH.toFixed(1)}" fill="${res.locked ? "rgba(28,107,84,0.16)" : "rgba(184,41,20,0.16)"}"/>
      <text x="${col2X + col2W - 6}" y="${(padY + modH + Math.max(10, gutH * 0.7)).toFixed(1)}" text-anchor="end" fill="${res.locked ? "#1C6B54" : "#B82914"}" font-size="10.5" font-weight="700">横缝 ${glines} 行</text>
      ${text1}
      ${text2}

      <!-- 底边对齐检验线 -->
      <line x1="${padX - 6}" y1="${bottomImgY.toFixed(1)}" x2="${480 - padX + 6}" y2="${bottomImgY.toFixed(1)}" stroke="${res.locked ? "#1C6B54" : "#D55A07"}" stroke-width="2"/>
      ${
        res.locked
          ? `<text x="${480 - padX}" y="${(bottomImgY + 16).toFixed(1)}" text-anchor="end" fill="#1C6B54" font-size="11.5" font-weight="700">✓ 底边与末行基线齐平</text>`
          : `<line x1="${col2X}" y1="${bottomTextY.toFixed(1)}" x2="${480 - padX + 6}" y2="${bottomTextY.toFixed(1)}" stroke="#B82914" stroke-width="2" stroke-dasharray="4 2"/>
             <text x="${480 - padX}" y="${(bottomTextY + 15).toFixed(1)}" text-anchor="end" fill="#B82914" font-size="11.5" font-weight="700">× 末行超出图底 ${res.driftPx}px</text>`
      }
    `;
  }

  $("#base-k-dec").addEventListener("click", () => {
    k = Math.max(3, k - 1);
    render();
  });
  $("#base-k-inc").addEventListener("click", () => {
    k = Math.min(7, k + 1);
    render();
  });
  $$("[data-glines]").forEach((b) =>
    b.addEventListener("click", () => {
      glines = Number(b.dataset.glines);
      render();
    })
  );
  render();
})();

// ==================== 05 节：四场景「硬套 vs 对路」对比卡 ====================
(function initAntiCases() {
  const CASES = [
    {
      id: "novel",
      title: "长篇小说内页",
      preferModular: false,
      modText: "硬切成 6 块方格后，段落被反复截断，眼睛每隔四行就被迫换格重找入口。",
      altText: "改用 194 手稿网格：单一宽裕版心配大方留白，连续读二十页也不累眼。",
      svgMod: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="10" y="10" width="66" height="46" fill="#F2D5B3"/><rect x="84" y="10" width="66" height="46" fill="#F2D5B3"/><rect x="10" y="64" width="66" height="46" fill="#F2D5B3"/><rect x="84" y="64" width="66" height="46" fill="#F2D5B3"/><path d="M18 22H68M18 30H64M18 38H58M92 22H142M92 30H136M18 76H68M18 84H60M92 76H142M92 84H132" stroke="#342039" stroke-width="2.5"/></svg>`,
      svgAlt: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="28" y="14" width="104" height="90" fill="#FDF6E9" stroke="#C8B298" stroke-dasharray="3 2"/><path d="M38 28H122M38 38H122M38 48H122M38 58H116M38 72H122M38 82H122M38 92H104" stroke="#342039" stroke-width="2.5"/></svg>`,
    },
    {
      id: "drama",
      title: "先锋戏剧海报",
      preferModular: false,
      modText: "大斜角冲突主题被切进四个工整方盒，情绪张力瞬间像工作周报一样泄气。",
      altText: "改用 210 破格 / 200 非对称：让核心斜线穿破画幅，只留底角一点冷静文字收口。",
      svgMod: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="10" y="10" width="66" height="46" fill="#342039"/><rect x="84" y="10" width="66" height="46" fill="#EBC7A0"/><rect x="10" y="64" width="66" height="46" fill="#EBC7A0"/><rect x="84" y="64" width="66" height="46" fill="#D55A07"/></svg>`,
      svgAlt: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="0" y="0" width="160" height="120" fill="#342039"/><polygon points="0,120 112,0 160,0 70,120" fill="#D55A07"/><circle cx="116" cy="84" r="18" fill="#EBC7A0"/></svg>`,
    },
    {
      id: "catalog",
      title: "商品与作品目录",
      preferModular: true,
      modText: "正好对路！每件商品共享同一单元步长，主打款跨 2×2 突出，其余 1×1 整齐扫读。",
      altText: "丢掉模块随意乱摆后，图片高低参差、价签各飘各的，买家根本没法横向比对。",
      svgMod: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="10" y="10" width="68" height="100" fill="#342039"/><rect x="86" y="10" width="64" height="46" fill="#EBC7A0"/><rect x="86" y="64" width="28" height="46" fill="#D55A07"/><rect x="122" y="64" width="28" height="46" fill="#EBC7A0"/></svg>`,
      svgAlt: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="8" y="18" width="54" height="62" fill="#342039"/><rect x="70" y="8" width="44" height="58" fill="#EBC7A0"/><rect x="118" y="34" width="34" height="72" fill="#D55A07"/><rect x="40" y="86" width="66" height="26" fill="#EBC7A0"/></svg>`,
    },
    {
      id: "dash",
      title: "多维业务看板",
      preferModular: true,
      modText: "正好对路！KPI 卡片、趋势图与占比环严格对齐双轴缝隙，新加指标模块也能直接拼入。",
      altText: "没有模块化约束时，卡片宽窄随机、数字基线上下漂移，高密度信息一眼就乱。",
      svgMod: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="10" y="10" width="42" height="32" fill="#EBC7A0"/><rect x="59" y="10" width="42" height="32" fill="#EBC7A0"/><rect x="108" y="10" width="42" height="32" fill="#D55A07"/><rect x="10" y="50" width="91" height="60" fill="#342039"/><rect x="108" y="50" width="42" height="60" fill="#F2D5B3"/></svg>`,
      svgAlt: `<svg class="case-svg" viewBox="0 0 160 120"><rect x="10" y="10" width="58" height="36" fill="#EBC7A0"/><rect x="78" y="18" width="70" height="24" fill="#D55A07"/><rect x="16" y="54" width="68" height="56" fill="#342039"/><rect x="94" y="48" width="56" height="62" fill="#F2D5B3"/></svg>`,
    },
  ];

  const host = $("#anti-cases");
  const mode = Object.fromEntries(CASES.map((c) => [c.id, true])); // true = 显示模块化版

  function render() {
    host.innerHTML = CASES.map((c) => {
      const showingMod = mode[c.id];
      const isGood = showingMod ? c.preferModular : !c.preferModular;
      return `<article class="case-card">
        <div class="case-top">
          <h4>${c.title}</h4>
          <span class="case-verdict ${isGood ? "is-good" : "is-bad"}">${showingMod ? (c.preferModular ? "模块对路" : "硬套翻车") : c.preferModular ? "无格混乱" : "换法更佳"}</span>
        </div>
        ${showingMod ? c.svgMod : c.svgAlt}
        <p class="case-desc">${showingMod ? c.modText : c.altText}</p>
        <button type="button" class="case-toggle" data-case-id="${c.id}">${showingMod ? "切换对照版" : "切回模块版"}</button>
      </article>`;
    }).join("");

    $$("[data-case-id]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = btn.dataset.caseId;
        mode[id] = !mode[id];
        render();
      })
    );
  }
  render();
})();

// ==================== 06 节：四选一盲测练习（中性标签 A/B/C/D） ====================
(function initQuiz() {
  // 统一 8×6 网格基础坐标：ox=16, oy=14, cell=21, gap=4 -> step=25, totalW=196, totalH=146 (viewBox 228×174)
  function gridBG() {
    let s = "";
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        s += `<rect x="${16 + c * 25}" y="${14 + r * 25}" width="21" height="21" fill="#FDF6E9" stroke="#DFCBB2" stroke-width="0.8" stroke-dasharray="2 2"/>`;
      }
    }
    return s;
  }
  function box(c, r, w, h, fill, label, textFill = "#FDF6E9") {
    const x = 16 + c * 25;
    const y = 14 + r * 25;
    const bw = w * 21 + (w - 1) * 4;
    const bh = h * 21 + (h - 1) * 4;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${fill}"/>
      <text x="${x + 6}" y="${y + 15}" fill="${textFill}" font-size="9.5" font-weight="700">${label}</text>`;
  }

  const OPTIONS = [
    {
      id: "A",
      correct: false,
      svg: `<svg class="quiz-svg" viewBox="0 0 228 174">${gridBG()}
        ${box(0, 0, 4, 3, "#342039", "主视觉")}
        ${box(4, 0, 4, 3, "#EBC7A0", "导语", "#26182B")}
        ${box(0, 3, 4, 3, "#D55A07", "68% 数据")}
        ${box(4, 3, 4, 3, "#F2D5B3", "脚注", "#26182B")}
      </svg>`,
      reason: "方案 A：四块虽然严守网格与缝隙，但被平分成四个一模一样的 4×3 大方格（面积比 1:1），脚注和主视觉一样大，彻底失去层级主次。",
    },
    {
      id: "B",
      correct: false,
      svg: `<svg class="quiz-svg" viewBox="0 0 228 174">${gridBG()}
        ${box(0, 0, 5, 4, "#342039", "主视觉")}
        ${box(5, 0, 3, 2, "#EBC7A0", "导语", "#26182B")}
        <rect x="${16 + 5.38 * 25}" y="${14 + 2.34 * 25}" width="62" height="44" fill="#D55A07"/>
        <text x="${16 + 5.38 * 25 + 6}" y="${14 + 2.34 * 25 + 15}" fill="#FDF6E9" font-size="9.5" font-weight="700">68% 数据</text>
        ${box(0, 4.42, 5, 1.15, "#F2D5B3", "脚注", "#26182B")}
      </svg>`,
      reason: "方案 B：有大小主次且无重叠，但右列数据块左缘脱格偏移 0.38 格、上下横缝一宽一窄，脚注也落在半格缝上，统一对齐基准破功。",
    },
    {
      id: "C",
      correct: true,
      svg: `<svg class="quiz-svg" viewBox="0 0 228 174">${gridBG()}
        ${box(0, 0, 5, 4, "#342039", "主视觉")}
        ${box(5, 0, 3, 2, "#EBC7A0", "导语", "#26182B")}
        ${box(5, 2, 3, 2, "#D55A07", "68% 数据")}
        ${box(0, 5, 5, 1, "#F2D5B3", "脚注", "#26182B")}
      </svg>`,
      reason: "方案 C（最稳）：同一套 8×6 等缝矩阵下，主视觉占 5×4 压稳重心、右列 3×2 导语与 3×2 数据齐边承接、底行隔出 1 行呼吸白再落 5×1 脚注，主次清晰、对齐严密、透气平衡。",
    },
    {
      id: "D",
      correct: false,
      svg: `<svg class="quiz-svg" viewBox="0 0 228 174">${gridBG()}
        ${box(0, 0, 5, 4, "#342039", "主视觉")}
        ${box(5, 0, 3, 2, "#EBC7A0", "导语", "#26182B")}
        ${box(5, 2, 3, 2, "#D55A07", "68% 数据")}
        ${box(0, 4, 5, 2, "#F2D5B3", "脚注", "#26182B")}
        ${box(5, 4, 3, 2, "#6F5975", "补满色块")}
      </svg>`,
      reason: "方案 D：为了「不留空格」硬加装饰色块把 48 格填成 100% 满铺，零呼吸留白导致边界互相顶撞，主视觉反被闷在框里。",
    },
  ];

  const host = $("#quiz-grid");
  const fb = $("#quiz-feedback");
  let picked = null;

  function render() {
    host.innerHTML = OPTIONS.map((o) => {
      const cls =
        picked === o.id ? (o.correct ? "is-picked-ok" : "is-picked-err") : picked && o.correct ? "is-picked-ok" : "";
      const mark =
        picked == null ? "" : o.correct ? "✓ 最佳" : picked === o.id ? "× 偏弱" : "";
      return `<button type="button" class="quiz-opt ${cls}" data-q="${o.id}" role="radio" aria-checked="${picked === o.id}">
        <div class="quiz-opt-head">
          <span class="quiz-code">方案 ${o.id}</span>
          <span class="quiz-mark">${mark}</span>
        </div>
        ${o.svg}
      </button>`;
    }).join("");

    $$("[data-q]").forEach((btn) =>
      btn.addEventListener("click", () => {
        picked = btn.dataset.q;
        const chosen = OPTIONS.find((x) => x.id === picked);
        fb.hidden = false;
        fb.classList.toggle("is-ok", chosen.correct);
        fb.classList.toggle("is-err", !chosen.correct);
        $("#qf-title").textContent = chosen.correct
          ? "选对了！方案 C 在层级、对齐与留白之间最稳"
          : `你选了方案 ${chosen.id} —— 再对照一下方案 C 的结构`;
        $("#qf-body").textContent = chosen.reason;
        $("#qf-all").innerHTML = OPTIONS.map((x) => `<div>${x.reason}</div>`).join("");
        render();
      })
    );
  }
  render();
})();

// ==================== 07 节：原海报放大、拖动与 Esc 关闭 ====================
(function initLightbox() {
  const poster = $("#poster");
  const openBtn = $("#poster-zoom-btn");
  const lb = $("#lightbox");
  const lbImg = $("#lb-img");
  const lbStage = $("#lb-stage");
  const lbScale = $("#lb-scale");
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLB() {
    lbImg.src = poster.currentSrc || poster.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    lb.hidden = false;
    applyTransform();
    $("#lb-close").focus();
  }

  function closeLB() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", openLB);
  $("#lb-close").addEventListener("click", closeLB);
  $("#lb-in").addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  $("#lb-out").addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    applyTransform();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) {
      closeLB();
      return;
    }
    pan = { x: e.clientX - tx, y: e.clientY - ty, id: e.pointerId };
    lbStage.classList.add("is-panning");
    lbStage.setPointerCapture?.(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    applyTransform();
  });
  lbStage.addEventListener("pointerup", () => {
    pan = null;
    lbStage.classList.remove("is-panning");
  });
  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLB();
  });
})();
