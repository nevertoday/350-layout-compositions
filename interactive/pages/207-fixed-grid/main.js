// 207 固定网格 FIXED GRID · 主控脚本（开场拼版台 + 01–07 全部互动与灯箱）
import {
  createInitialState,
  applyPreset,
  buildPageBlocks,
  evaluate,
  solveIntegerMargins,
  computeGrid,
  spanWidth,
} from "./model.js";
import { createGridStage } from "./canvas-stage.js";

let state = createInitialState();
let stage = null;

// ================= 开场主控同步（全部来自 model.js 单真源） =================
const $ = (id) => document.getElementById(id);

function syncHeroUI() {
  const ev = evaluate(state);
  const { grid, pillars } = ev;

  // 顶部状态胶囊
  const pill = $("hero-status-pill");
  pill.textContent = ev.tag;
  pill.className = `status-pill ${ev.score === 4 ? "is-ok" : "is-err"}`;

  // 定义诊单盒
  const diagBox = $("diag-box");
  diagBox.classList.toggle("is-ok", ev.score === 4);
  $("diag-score").textContent = `${ev.score}/4`;
  $("diag-tag").textContent = `单真源标尺诊单 · ${ev.tag}`;
  $("diag-formula").textContent = ev.formulaText;
  $("diag-headline").textContent = ev.headline;
  $("diag-body").textContent = ev.body;
  $("diag-tip").textContent = ev.tip;

  // 定义盒里的小井字格 SVG 徽章实时变形（错态偏斜，达标正交）
  const skew = ev.score === 4 ? 0 : (ev.score === 0 ? 4 : 2);
  $("dg-v1").setAttribute("x1", String(18 - skew));
  $("dg-v1").setAttribute("x2", String(18 + skew));
  $("dg-v2").setAttribute("x1", String(30 + skew));
  $("dg-v2").setAttribute("x2", String(30 - skew));
  $("dg-h1").setAttribute("y1", String(18 + skew * 0.6));
  $("dg-h1").setAttribute("y2", String(18 - skew * 0.6));
  $("dg-h2").setAttribute("y1", String(30 - skew * 0.6));
  $("dg-h2").setAttribute("y2", String(30 + skew * 0.6));

  const fixBtn = $("diag-fix-btn");
  if (ev.fixAction) {
    fixBtn.hidden = false;
    fixBtn.textContent = ev.fixAction.label;
    fixBtn.dataset.fixType = ev.fixAction.type;
  } else {
    fixBtn.hidden = true;
  }

  // 尺规控件值同步
  document.querySelectorAll("[data-cols]").forEach((b) => {
    const on = Number(b.dataset.cols) === state.cols;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-width]").forEach((b) => {
    const on = Number(b.dataset.width) === state.totalWidth;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-theme]").forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-page]").forEach((b) => {
    const on = Number(b.dataset.page) === state.pageNo;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  $("ctrl-gutter").value = String(state.gutter);
  $("val-gutter").textContent = `${state.gutter}px`;
  $("ctrl-leading").value = state.leadingRatio.toFixed(2);
  $("val-leading").textContent = `${state.leadingRatio.toFixed(2)}×`;
  $("ctrl-viewport").value = String(state.viewportW);
  $("val-viewport").textContent = `${state.viewportW}px`;

  $("btn-snap").classList.toggle("is-active", state.snap);
  $("btn-snap").setAttribute("aria-pressed", String(state.snap));
  $("btn-snap").textContent = `磁吸格线：${state.snap ? "开" : "关"}`;

  $("btn-baseline").classList.toggle("is-active", state.showBaseline);
  $("btn-baseline").setAttribute("aria-pressed", String(state.showBaseline));
  $("btn-baseline").textContent = `基线细纹：${state.showBaseline ? "开" : "关"}`;

  const sel = state.blocks.find((b) => b.id === state.selectedId) || state.blocks[0];
  if (sel) $("val-sel-span").textContent = `${sel.span} 列`;

  $("met-aligned").textContent = `${ev.alignedCount}/${ev.rects.length}`;
  $("met-balance").textContent = `${ev.balanceShiftPct >= 0 ? "+" : ""}${ev.balanceShiftPct}%`;
  $("met-overflow").textContent = `${ev.overflowPx}px`;

  // 四大核心优势实时胶囊
  for (const key of ["stability", "repeatability", "baseline", "collaboration"]) {
    const el = $(`badge-${key}`);
    el.textContent = pillars[key].badge;
    el.className = `ben-badge ${pillars[key].ok ? "is-ok" : "is-err"}`;
  }
}

function updateAndDraw(nextState) {
  state = nextState;
  syncHeroUI();
  stage?.draw();
}

function initHero() {
  stage = createGridStage({
    canvas: $("grid-canvas"),
    getState: () => state,
    setState: (s) => { state = s; },
    onChange: syncHeroUI,
  });

  // 题材切换
  document.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateAndDraw({ ...state, theme: btn.dataset.theme });
    });
  });

  // 跨页复验（换内容不换尺子）
  document.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = Number(btn.dataset.page);
      const next = { ...state, pageNo: p };
      next.blocks = buildPageBlocks(next, p);
      updateAndDraw(next);
    });
  });

  // 预设解 & 试错
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateAndDraw(applyPreset(state, btn.dataset.preset));
    });
  });

  // 列数切换（保留当前错/对参数，但自动重算合适块宽）
  document.querySelectorAll("[data-cols]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cols = Number(btn.dataset.cols);
      const next = { ...state, cols };
      // 保持页内模块跨度合法
      const m = solveIntegerMargins(next.totalWidth, cols, next.gutter);
      if (m !== null && state.marginLeft === state.marginRight) {
        next.marginLeft = m;
        next.marginRight = m;
      }
      next.blocks = buildPageBlocks(next, next.pageNo);
      updateAndDraw(next);
    });
  });

  // 容器总宽切换
  document.querySelectorAll("[data-width]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const totalWidth = Number(btn.dataset.width);
      const next = { ...state, totalWidth };
      if (state.marginLeft === state.marginRight) {
        const m = solveIntegerMargins(totalWidth, next.cols, next.gutter);
        if (m !== null) {
          next.marginLeft = m;
          next.marginRight = m;
        }
      }
      next.blocks = buildPageBlocks(next, next.pageNo);
      updateAndDraw(next);
    });
  });

  // 栏距、行高、模拟视口滑块
  $("ctrl-gutter").addEventListener("input", (e) => {
    const gutter = Number(e.target.value);
    const next = { ...state, gutter };
    const gNew = computeGrid(next);
    // 保持已落格模块的列号不变，未落格的保持相对偏差
    const evOld = evaluate(state);
    next.blocks = state.blocks.map((b) => {
      const r = evOld.rects.find((x) => x.id === b.id);
      if (r && r.snapped) {
        const c = Math.min(r.bestCol, next.cols - b.span);
        return { ...b, x: +gNew.colStarts[c].toFixed(1) };
      }
      return b;
    });
    updateAndDraw(next);
  });

  $("ctrl-leading").addEventListener("input", (e) => {
    updateAndDraw({ ...state, leadingRatio: Number(e.target.value) });
  });

  $("ctrl-viewport").addEventListener("input", (e) => {
    updateAndDraw({ ...state, viewportW: Number(e.target.value) });
  });

  // 开关按钮
  $("btn-snap").addEventListener("click", () => updateAndDraw({ ...state, snap: !state.snap }));
  $("btn-baseline").addEventListener("click", () => updateAndDraw({ ...state, showBaseline: !state.showBaseline }));
  $("btn-span-toggle").addEventListener("click", () => {
    const sel = state.blocks.find((b) => b.id === state.selectedId) || state.blocks[0];
    if (!sel) return;
    const maxSpan = Math.min(3, state.cols);
    const nextSpan = sel.span >= maxSpan ? 1 : sel.span + 1;
    const grid = computeGrid(state);
    const nextW = spanWidth(grid, nextSpan);
    const blocks = state.blocks.map((b) =>
      b.id === sel.id
        ? { ...b, span: nextSpan, x: +Math.min(b.x, grid.W - grid.mR - nextW).toFixed(1) }
        : b
    );
    updateAndDraw({ ...state, blocks });
  });

  // 诊单「一步修正这一项」按钮（逐项修，不剥夺探索）
  $("diag-fix-btn").addEventListener("click", (e) => {
    const type = e.currentTarget.dataset.fixType;
    const next = { ...state };
    if (type === "fix-viewport") {
      next.viewportW = Math.max(next.totalWidth + 64, 1024);
    } else if (type === "fix-gutter") {
      next.gutter = next.cols === 12 ? 20 : 24;
      const m = solveIntegerMargins(next.totalWidth, next.cols, next.gutter);
      if (m !== null) { next.marginLeft = m; next.marginRight = m; }
    } else if (type === "fix-ruler") {
      if (next.totalWidth === 740) next.totalWidth = 720;
      next.gutter = next.cols === 12 ? 20 : 24;
      const m = solveIntegerMargins(next.totalWidth, next.cols, next.gutter) ?? 24;
      next.marginLeft = m;
      next.marginRight = m;
      // 保留模块偏轨状态（让用户继续亲手拖进列线！）
      const gNew = computeGrid(next);
      const evOld = evaluate(state);
      next.blocks = state.blocks.map((b) => {
        const r = evOld.rects.find((x) => x.id === b.id);
        if (!r) return b;
        if (r.snapped) {
          const c = Math.min(r.bestCol, next.cols - b.span);
          return { ...b, x: +gNew.colStarts[c].toFixed(1), y: gNew.rowStarts[r.bestRow] };
        }
        return { ...b, x: +Math.min(b.x, gNew.W - spanWidth(gNew, b.span) - 10).toFixed(1) };
      });
    } else if (type === "fix-align") {
      next.blocks = buildPageBlocks(next, next.pageNo);
    } else if (type === "fix-baseline") {
      next.leadingRatio = 1.50;
    }
    updateAndDraw(next);
  });

  syncHeroUI();
}

// ================= 01 节：跨页复验杂志模板 =================
const SPREADS = [
  {
    caption: "第 1 页专题导读：左侧 2 列放导语与页码，右侧 4 列放跨栏主图与副栏正文。列宽 92px、栏距 24px、边距 24px 丝毫不改。",
    blocks: [
      { c: 0, sp: 2, y: 24, h: 72, fill: "#651834", label: "专题导读 · 2列", light: true },
      { c: 0, sp: 2, y: 112, h: 174, fill: "#F8EAE8", stroke: "#8B5B6D", lines: 6 },
      { c: 2, sp: 4, y: 24, h: 152, fill: "#651834", label: "主图跨 4 列", light: true, dot: true },
      { c: 2, sp: 2, y: 192, h: 94, fill: "#FFF9F8", stroke: "#8B5B6D", lines: 3 },
      { c: 4, sp: 2, y: 192, h: 94, fill: "#FFF9F8", stroke: "#8B5B6D", lines: 3 },
    ],
  },
  {
    caption: "第 2 页人物专访：左 1 列窄边栏注脚 + 中 3 列核心问答正文 + 右 2 列人物肖像框与引文。同样 6 列尺子，一眼即识同一本杂志。",
    blocks: [
      { c: 0, sp: 1, y: 24, h: 262, fill: "#F8EAE8", stroke: "#C9A7B0", lines: 4 },
      { c: 1, sp: 3, y: 24, h: 52, fill: "#651834", label: "专访标题 · 3列", light: true },
      { c: 1, sp: 3, y: 92, h: 194, fill: "#FFF9F8", stroke: "#8B5B6D", lines: 7 },
      { c: 4, sp: 2, y: 24, h: 168, fill: "#651834", label: "人物图 · 2列", light: true, dot: true },
      { c: 4, sp: 2, y: 208, h: 78, fill: "#FB391F", label: "核心引语 · 2列", light: true },
    ],
  },
  {
    caption: "第 3 页摄影图集：三组 2 列等宽画幅齐头并排，下方各配三行图注。因为 6 能被 2 和 3 同时整除，三栏切换毫无余数。",
    blocks: [
      { c: 0, sp: 2, y: 24, h: 166, fill: "#651834", label: "图 01 · 2列", light: true },
      { c: 2, sp: 2, y: 24, h: 166, fill: "#FB391F", label: "图 02 · 2列", light: true },
      { c: 4, sp: 2, y: 24, h: 166, fill: "#651834", label: "图 03 · 2列", light: true },
      { c: 0, sp: 2, y: 206, h: 80, fill: "#FFF9F8", stroke: "#8B5B6D", lines: 3 },
      { c: 2, sp: 2, y: 206, h: 80, fill: "#FFF9F8", stroke: "#8B5B6D", lines: 3 },
      { c: 4, sp: 2, y: 206, h: 80, fill: "#FFF9F8", stroke: "#8B5B6D", lines: 3 },
    ],
  },
];

function initSpreadLab() {
  let active = 0;
  let showGrid = true;
  const svg = $("spread-svg");
  const cap = $("spread-caption");

  function render() {
    // 720px = 2*24 + 6*92 + 5*24
    const m = 24, cW = 92, g = 24;
    const colX = (i) => m + i * (cW + g);
    const spanW = (sp) => sp * cW + (sp - 1) * g;

    let out = `<rect x="0" y="0" width="720" height="310" fill="#FFF9F8"/>`;
    if (showGrid) {
      for (let i = 0; i < 6; i++) {
        out += `<rect x="${colX(i)}" y="0" width="${cW}" height="310" fill="#FBD8D9" opacity="0.58"/>`;
        out += `<text x="${colX(i) + cW / 2}" y="15" text-anchor="middle" font-family="Space Mono, monospace" font-size="10" font-weight="700" fill="#651834">C${i + 1}</text>`;
      }
      out += `<line x1="${m}" y1="0" x2="${m}" y2="310" stroke="#8B5B6D" stroke-dasharray="4 3"/>`;
      out += `<line x1="${720 - m}" y1="0" x2="${720 - m}" y2="310" stroke="#8B5B6D" stroke-dasharray="4 3"/>`;
    }
    for (const b of SPREADS[active].blocks) {
      const x = colX(b.c), w = spanW(b.sp);
      out += `<rect x="${x}" y="${b.y}" width="${w}" height="${b.h}" fill="${b.fill}" ${b.stroke ? `stroke="${b.stroke}" stroke-width="1.2"` : ""}/>`;
      if (b.dot) {
        out += `<circle cx="${x + w - 34}" cy="${b.y + b.h / 2}" r="22" fill="#FB391F"/>`;
      }
      if (b.label) {
        out += `<text x="${x + 14}" y="${b.y + 30}" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700" fill="${b.light ? "#FFF9F8" : "#150F12"}">${b.label}</text>`;
      }
      if (b.lines) {
        for (let k = 0; k < b.lines; k++) {
          const ly = b.y + 20 + k * 22;
          if (ly < b.y + b.h - 10) {
            const lw = (w - 28) * (k === b.lines - 1 ? 0.62 : 0.92);
            out += `<rect x="${x + 14}" y="${ly}" width="${lw}" height="4" fill="#651834" opacity="0.65"/>`;
          }
        }
      }
    }
    svg.innerHTML = out;
    cap.textContent = SPREADS[active].caption;
  }

  document.querySelectorAll("[data-spread]").forEach((btn) => {
    btn.addEventListener("click", () => {
      active = Number(btn.dataset.spread);
      document.querySelectorAll("[data-spread]").forEach((b) => {
        const on = Number(b.dataset.spread) === active;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      render();
    });
  });

  $("spread-grid-toggle").addEventListener("click", (e) => {
    showGrid = !showGrid;
    e.currentTarget.classList.toggle("is-active", showGrid);
    e.currentTarget.setAttribute("aria-pressed", String(showGrid));
    e.currentTarget.textContent = `透视 6 列固定尺：${showGrid ? "开" : "关"}`;
    render();
  });

  render();
}

// ================= 02 节：960 整除魔数切片计算矩阵 =================
function initDivisorLab() {
  let dw = 960;
  let dg = 20;
  let dm = 10;
  const candidates = [2, 3, 4, 5, 6, 8, 12, 16];
  const gridEl = $("divisor-grid");
  const sumEl = $("divisor-summary");

  function render() {
    let intCols = [];
    gridEl.innerHTML = candidates.map((n) => {
      const colW = (dw - 2 * dm - (n - 1) * dg) / n;
      const isInt = colW > 0 && Math.abs(colW - Math.round(colW)) < 0.001;
      if (isInt) intCols.push(`${n}列(${Math.round(colW)}px)`);
      return `
        <div class="div-cell ${isInt ? "is-int" : "is-frac"}" role="listitem">
          <div class="div-cell-top">
            <span class="div-col-num">${n} 列</span>
            <span class="div-tag">${isInt ? "整除" : "亚像素"}</span>
          </div>
          <div class="div-val">${isInt ? `${Math.round(colW)}px` : `${colW.toFixed(2)}px`}</div>
          <div class="div-sub">${n - 1} 道缝共 ${(n - 1) * dg}px</div>
        </div>
      `;
    }).join("");
    sumEl.textContent = intCols.length
      ? `总宽 ${dw}px（栏距 ${dg}px、单侧边距 ${dm}px）下，可切出 ${intCols.length} 组纯整数列宽：${intCols.join("、")}。`
      : `总宽 ${dw}px（栏距 ${dg}px、单侧边距 ${dm}px）下，这 8 种常见列数全部出现小数余数——实际项目需要微调边距或栏距才能对齐整数像素。`;
  }

  document.querySelectorAll("[data-dw]").forEach((btn) => {
    btn.addEventListener("click", () => {
      dw = Number(btn.dataset.dw);
      document.querySelectorAll("[data-dw]").forEach((b) => {
        const on = Number(b.dataset.dw) === dw;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  document.querySelectorAll("[data-dg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [g, m] = btn.dataset.dg.split(",").map(Number);
      dg = g; dm = m;
      document.querySelectorAll("[data-dg]").forEach((b) => {
        const on = b.dataset.dg === btn.dataset.dg;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  render();
}

// ================= 03 节：Ag 基线秩序与双栏行高验视台 =================
function initBaselineLab() {
  let fontSize = 15;
  let ratio = 1.50;
  let lockHead = true;

  const preview = $("dual-preview");
  const h4 = $("dc-h4");
  const p1 = $("dc-p1");
  const p2 = $("dc-p2");
  const verdict = $("bl-verdict");
  const mark = $("ag-leading-mark");

  function render() {
    const lhPx = Math.round(fontSize * ratio);
    const headFont = Math.round(fontSize * 1.35);
    const headLh = lockHead ? lhPx * 2 : Math.round(headFont * 1.18);

    $("val-bl-size").textContent = `${fontSize}px`;
    $("val-bl-ratio").textContent = `${ratio.toFixed(2)}× (${lhPx}px)`;

    preview.style.setProperty("--bl-step", `${lhPx}px`);
    h4.style.fontSize = `${headFont}px`;
    h4.style.lineHeight = `${headLh}px`;
    p1.style.fontSize = `${fontSize}px`;
    p1.style.lineHeight = `${lhPx}px`;
    p2.style.fontSize = `${fontSize}px`;
    p2.style.lineHeight = `${lhPx}px`;

    // 同步左侧 Ag 标尺括号伸缩（示意行高松紧）
    const spanY = Math.max(82, Math.min(168, 72 + (ratio - 1.1) * 105));
    const y1 = 154 - spanY;
    mark.innerHTML = `
      <line x1="316" y1="${y1.toFixed(1)}" x2="316" y2="154" stroke="#FF7A66" stroke-width="2"/>
      <line x1="308" y1="${y1.toFixed(1)}" x2="324" y2="${y1.toFixed(1)}" stroke="#FF7A66" stroke-width="2"/>
      <line x1="308" y1="154" x2="324" y2="154" stroke="#FF7A66" stroke-width="2"/>
      <text x="328" y="${((y1 + 154) / 2 + 4).toFixed(1)}" font-family="Space Mono, monospace" font-size="11" fill="#FF7A66">${ratio.toFixed(2)}×</text>
    `;

    const inRange = ratio >= 1.40 && ratio <= 1.60;
    const drift = lockHead ? 0 : Math.abs(headLh % lhPx);
    if (!lockHead) {
      verdict.className = "base-verdict is-err";
      verdict.textContent = `左栏标题占高 ${headLh}px，不是正文行高 ${lhPx}px 的整数倍（偏移 ${drift}px）：仔细看横虚线，左右两栏从正文第一行起便全程错位。`;
    } else if (!inRange) {
      verdict.className = "base-verdict is-err";
      verdict.textContent = ratio < 1.40
        ? `当前行高 ${ratio.toFixed(2)}×（${lhPx}px）低于 1.4–1.6× 经验带：上下行字形过于贴近，长段阅读容易串行。`
        : `当前行高 ${ratio.toFixed(2)}×（${lhPx}px）高于 1.4–1.6× 经验带：行间空白发散，整段文字失去凝聚感。`;
    } else {
      verdict.className = "base-verdict";
      verdict.textContent = `标题总行高 ${headLh}px = 2 × ${lhPx}px，正落在 1.4–1.6× 舒适经验带内：左右两栏每一行文字都稳稳踩在同一条红色基线上。`;
    }
  }

  $("bl-size").addEventListener("input", (e) => { fontSize = Number(e.target.value); render(); });
  $("bl-ratio").addEventListener("input", (e) => { ratio = Number(e.target.value); render(); });
  $("bl-lock-btn").addEventListener("click", (e) => {
    lockHead = !lockHead;
    e.currentTarget.classList.toggle("is-active", lockHead);
    e.currentTarget.setAttribute("aria-pressed", String(lockHead));
    e.currentTarget.textContent = `标题行高锁基线倍数：${lockHead ? "开" : "关"}`;
    render();
  });

  render();
}

// ================= 04 节：典型场景规格抽屉 =================
const USE_SPECS = {
  magazine: {
    badge: "印刷固定开本",
    formula: "A4 (210×297mm) · 6 列 · 栏距 4mm · 基线 12pt",
    detail: "纸张裁切尺寸在印前已经绝对确定，固定网格在这里没有「屏幕变窄」的顾虑。一本 120 页的期刊用同一套 6 列或 12 列毫米网格，既能排 2 栏深度报道，也能无缝切到 3 栏资讯与 6 栏图注，跨页翻阅高度统一。",
  },
  webui: {
    badge: "桌面断点容器（配响应式）",
    formula: "容器 1200px · 12 列 × 74px · 栏距 24px · 边距 24px",
    detail: "在桌面端（如 ≥1280px）设定最大固定容器宽与 12 列规范，能让导航、表单、卡片和定价栏像素级严丝合缝；但必须配合断点在平板/手机端切换列数或改用流体百分比，不能把 1200px 硬塞进手机屏幕。",
  },
  report: {
    badge: "固定比例投屏与报表",
    formula: "16:9 (1920×1080px) · 12 列 × 116px · 栏距 24px · 边距 132px",
    detail: "演示文稿和 PDF 财务年报的画幅比例固定不变。用固定网格锁死左侧目录脊、图表区与页脚标注后，哪怕一份报告由五位同事并行制作，合并起来依然像出自同一位资深设计师之手。",
  },
};

function initUseCards() {
  const render = (key) => {
    const d = USE_SPECS[key];
    $("spec-badge").textContent = d.badge;
    $("spec-formula").textContent = d.formula;
    $("spec-detail").textContent = d.detail;
    document.querySelectorAll("[data-use]").forEach((btn) => {
      const on = btn.dataset.use === key;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  };
  document.querySelectorAll("[data-use]").forEach((btn) => {
    btn.addEventListener("click", () => render(btn.dataset.use));
  });
  render("magazine");
}

// ================= 05 节：设备视口拉伸双轨压力测试 =================
function initStressLab() {
  let sw = 390;
  const fixedW = 960;
  const range = $("stress-range");
  const valW = $("val-stress-w");
  const fVp = $("st-fixed-vp");
  const flVp = $("st-fluid-vp");
  const fContent = $("st-fixed-content");
  const fStatus = $("st-fixed-status");
  const flStatus = $("st-fluid-status");
  const cap = $("stress-caption");

  function render() {
    valW.textContent = `${sw}px`;
    range.value = String(sw);
    document.querySelectorAll("[data-sw]").forEach((b) => {
      const on = Number(b.dataset.sw) === sw;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    // 把 360..2200 映射到轨道可视宽度 22%..100%
    const vpPct = Math.max(22, Math.min(100, (sw / 2200) * 100));
    fVp.style.width = `${vpPct.toFixed(1)}%`;
    flVp.style.width = `${vpPct.toFixed(1)}%`;

    // 固定 960px 相对于当前视口宽 sw 的比例
    const relPct = (fixedW / sw) * 100;
    fContent.style.width = `${relPct.toFixed(1)}%`;
    const overflow = sw < fixedW;
    const tooWide = sw >= 1600;
    fContent.classList.toggle("is-overflow", overflow);
    fContent.classList.toggle("is-centered", !overflow);

    if (overflow) {
      fStatus.className = "st-status is-err";
      fStatus.textContent = `右侧溢出 +${fixedW - sw}px`;
      flStatus.className = "st-status is-ok";
      flStatus.textContent = `占宽 92% · 零溢出`;
      cap.textContent = `在 ${sw}px 屏幕上，960px 固定网格超出窗口 ${fixedW - sw}px，右侧内容直接被裁出屏幕，逼出横向滚动条；下方流体比例对照则自动收缩在窗口内。`;
    } else if (tooWide) {
      const deadPct = Math.round(((sw - fixedW) / sw) * 100);
      fStatus.className = "st-status is-warn";
      fStatus.textContent = `两侧空置 ${deadPct}%`;
      flStatus.className = "st-status is-ok";
      flStatus.textContent = `占宽 92% · 饱满利用`;
      cap.textContent = `在 ${sw}px 超宽屏上，960px 固定网格虽然整齐，却只用了屏幕宽度的 ${100 - deadPct}%，两侧留下大片无意义空白（因此现代网站常在超宽屏设更高断点容器）。`;
    } else {
      const padEach = Math.round((sw - fixedW) / 2);
      fStatus.className = "st-status is-ok";
      fStatus.textContent = `恰好容纳 · 每侧留白 ${padEach}px`;
      flStatus.className = "st-status is-ok";
      flStatus.textContent = `占宽 92% · 零溢出`;
      cap.textContent = `${sw}px 正是 960px 固定网格最舒服的甜点区间：既无横向溢出，左右留白（每侧 ${padEach}px）又克制平衡。`;
    }
  }

  range.addEventListener("input", (e) => { sw = Number(e.target.value); render(); });
  document.querySelectorAll("[data-sw]").forEach((btn) => {
    btn.addEventListener("click", () => { sw = Number(btn.dataset.sw); render(); });
  });
  render();
}

// ================= 06 节：四选一单一变量小练习 =================
const QUIZ_ITEMS = [
  {
    id: "A",
    ok: false,
    tagAfter: "右栏基线错行",
    reason: "A 的列边界与栏距都对了，但右栏正文行高比左栏密了一截（未共享同一把基线尺），导致左右两栏文字越往下读越错位，页底一高一低。",
  },
  {
    id: "B",
    ok: true,
    tagAfter: "正确答案 · 全规守住",
    reason: "B 严格守住了固定网格的全部四条规则：6 列整数齐线、统一清晰栏距、左右对称边距，且左右两栏正文末行严丝合缝落在同一条水平基线上。",
  },
  {
    id: "C",
    ok: false,
    tagAfter: "主图骑缝脱轨",
    reason: "C 的基线与边距都整齐，但上方主图向右多伸出了半个栏距，直接踩断第 4 与第 5 列之间的空白缝隙，破坏了右侧竖向对齐脊。",
  },
  {
    id: "D",
    ok: false,
    tagAfter: "栏距压死 0px",
    reason: "D 虽然块体落在齐线上，却把栏距压成了 0px：相邻图块与左右两栏正文直接粘死撞在一起，失去视觉呼吸与分栏边界。",
  },
];

function drawQuizSvg(id, revealed) {
  // 画布 300×196，标准 6 列：m=18, g=10, colW=35.67 -> 取精确 m=18, g=12, colW=34 -> 36 + 204 + 60 = 300！纯整数！
  const m = 18;
  const g = id === "D" ? 0 : 12;
  const colW = id === "D" ? 44 : 34; // D: 36 + 6*44 = 300
  const colX = (i) => m + i * (colW + g);
  const spW = (sp) => sp * colW + (sp - 1) * g;

  let s = `<rect x="0" y="0" width="300" height="196" fill="#FFF9F8"/>`;
  // 揭晓后浮现樱粉固定列带与基线
  if (revealed) {
    for (let i = 0; i < 6; i++) {
      s += `<rect x="${colX(i)}" y="0" width="${colW}" height="196" fill="#FBD8D9" opacity="0.55"/>`;
    }
    for (let y = 114; y <= 174; y += 15) {
      s += `<line x1="12" y1="${y}" x2="288" y2="${y}" stroke="#651834" stroke-opacity="0.28" stroke-dasharray="3 2"/>`;
    }
  }

  // 上排左主图（占 4 列）+ 右标块（占 2 列）
  const heroW = spW(4) + (id === "C" ? 7 : 0); // C 唯一变量：主图右伸 +7px 压进栏缝
  s += `<rect x="${colX(0)}" y="18" width="${heroW}" height="74" fill="#651834"/>`;
  s += `<circle cx="${colX(0) + 38}" cy="55" r="16" fill="#FB391F"/>`;
  s += `<rect x="${colX(4)}" y="18" width="${spW(2)}" height="74" fill="#F4BDC0"/>`;
  s += `<rect x="${colX(4) + 10}" y="34" width="${spW(2) - 20}" height="6" fill="#651834"/>`;
  s += `<rect x="${colX(4) + 10}" y="48" width="${spW(2) - 28}" height="4" fill="#651834" opacity="0.6"/>`;

  // 下排两栏文字（左 3 列 + 右 3 列）
  const leftW = spW(3);
  const rightX = colX(3);
  const rightW = spW(3);
  const leftStep = 15;
  const rightStep = id === "A" ? 11.5 : 15; // A 唯一变量：右栏行距缩密脱离基线
  for (let k = 0; k < 5; k++) {
    const ly = 110 + k * leftStep;
    const ry = 110 + k * rightStep;
    const lw = leftW * (k === 4 ? 0.65 : 0.96);
    const rw = rightW * (k === 4 ? 0.65 : 0.96);
    s += `<rect x="${colX(0)}" y="${ly}" width="${lw}" height="4" fill="#150F12" opacity="0.82"/>`;
    s += `<rect x="${rightX}" y="${ry}" width="${rw}" height="4" fill="#150F12" opacity="0.82"/>`;
  }

  // 揭晓后的精准红色/绿色视觉批注
  if (revealed) {
    if (id === "A") {
      s += `<line x1="${colX(0)}" y1="174" x2="${colX(3) + rightW}" y2="174" stroke="#B31924" stroke-width="1.5" stroke-dasharray="4 2"/>`;
      s += `<rect x="${rightX - 2}" y="106" width="${rightW + 4}" height="56" fill="none" stroke="#B31924" stroke-width="1.8"/>`;
    } else if (id === "B") {
      s += `<line x1="${colX(0)}" y1="174" x2="${colX(3) + rightW}" y2="174" stroke="#146648" stroke-width="1.8"/>`;
      s += `<rect x="${m}" y="14" width="264" height="166" fill="none" stroke="#146648" stroke-width="1.4" stroke-dasharray="5 3"/>`;
    } else if (id === "C") {
      const badX = colX(0) + heroW;
      s += `<line x1="${colX(4)}" y1="10" x2="${colX(4)}" y2="186" stroke="#B31924" stroke-width="1.5" stroke-dasharray="3 2"/>`;
      s += `<rect x="${colX(0) + spW(4)}" y="16" width="12" height="78" fill="#B31924" opacity="0.45"/>`;
      s += `<line x1="${badX}" y1="14" x2="${badX}" y2="96" stroke="#B31924" stroke-width="2"/>`;
    } else if (id === "D") {
      s += `<line x1="${rightX}" y1="16" x2="${rightX}" y2="182" stroke="#B31924" stroke-width="2.2"/>`;
      s += `<line x1="${colX(4)}" y1="16" x2="${colX(4)}" y2="96" stroke="#B31924" stroke-width="2.2"/>`;
    }
  }
  return s;
}

function initQuiz() {
  let picked = null;
  const container = $("quiz-grid");
  const verdict = $("quiz-verdict");
  const vTitle = $("qv-title");
  const vBody = $("qv-body");

  function render() {
    const revealed = picked !== null;
    container.innerHTML = QUIZ_ITEMS.map((item) => {
      const isPicked = picked === item.id;
      const cls = [
        "quiz-card",
        isPicked ? "is-picked" : "",
        revealed && item.ok ? "is-correct" : "",
        revealed && isPicked && !item.ok ? "is-wrong" : "",
      ].filter(Boolean).join(" ");
      return `
        <button type="button" class="${cls}" data-quiz="${item.id}" aria-pressed="${isPicked}">
          <div class="quiz-card-head">
            <span class="quiz-letter">${item.id}</span>
            <span class="quiz-reveal-tag">${revealed ? item.tagAfter : "点击选择"}</span>
          </div>
          <svg viewBox="0 0 300 196" class="quiz-svg" aria-hidden="true">${drawQuizSvg(item.id, revealed)}</svg>
        </button>
      `;
    }).join("");

    container.querySelectorAll("[data-quiz]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.quiz;
        const item = QUIZ_ITEMS.find((x) => x.id === picked);
        verdict.className = `quiz-verdict ${item.ok ? "is-ok" : "is-err"}`;
        vTitle.textContent = item.ok
          ? `选对了！${item.id} 是唯一严守固定网格的排稿`
          : `再细看一眼：${item.id} 破了规矩（正确答案是 B）`;
        vBody.textContent = item.reason + (item.ok ? "" : " 你可以再点其它三份，对照图上刚刚显影的列带、基线与红色误差标记。");
        render();
      });
    });
  }

  render();
}

// ================= 07 节：原海报灯箱（放大 / 拖动 / Esc 关闭） =================
function initLightbox() {
  const btn = $("poster-btn");
  const posterImg = $("poster");
  const lb = $("lightbox");
  const lbImg = $("lb-img");
  const lbStage = $("lb-stage");

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

  const applyTransform = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    $("lb-zoom-reset").textContent = `${Math.round(scale * 100)}%`;
  };

  const open = () => {
    lbImg.src = posterImg.src;
    scale = 1.25; tx = 0; ty = 0;
    applyTransform();
    lb.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    $("lb-close").focus();
  };

  const close = () => {
    if (lb.hidden) return;
    lb.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  };

  btn.addEventListener("click", open);
  $("lb-close").addEventListener("click", close);
  $("lb-zoom-in").addEventListener("click", () => { scale = Math.min(3.5, +(scale + 0.35).toFixed(2)); applyTransform(); });
  $("lb-zoom-out").addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); applyTransform(); });
  $("lb-zoom-reset").addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) { close(); return; }
    dragging = true; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
    lbStage.setPointerCapture(e.pointerId);
    lbStage.classList.add("is-grabbing");
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    applyTransform();
  });
  const endDrag = () => { dragging = false; lbStage.classList.remove("is-grabbing"); };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

// 启动全部模块
initHero();
initSpreadLab();
initDivisorLab();
initBaselineLab();
initUseCards();
initStressLab();
initQuiz();
initLightbox();
