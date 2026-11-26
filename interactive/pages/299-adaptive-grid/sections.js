// 299 自适应网格 · 正文各节独立交互模块（01–07）
// 每一节使用截然不同的控件机制，相邻两节不重复。
import { solveGridLayout } from "./model.js";

/* ==================== 01 节：auto-fill vs auto-fit & min(M, 100%) 真 DOM 透视槽 ==================== */
export function initSection01() {
  const root = document.getElementById("lab-autofill");
  if (!root) return;

  const vp = document.getElementById("af-viewport");
  const shell = vp.parentElement;
  const ghost = document.getElementById("af-ghost-tracks");
  const grid = document.getElementById("af-real-grid");
  const readout = document.getElementById("af-readout");
  const guardBtn = document.getElementById("af-guard-btn");

  const st = { count: 2, mode: "auto-fill", width: 820, guard: false };
  const MIN = 220;
  const GAP = 14;

  function render() {
    root.querySelectorAll("[data-af-count]").forEach((b) => b.classList.toggle("is-active", +b.dataset.afCount === st.count));
    root.querySelectorAll("[data-af-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.afMode === st.mode));
    root.querySelectorAll("[data-af-width]").forEach((b) => b.classList.toggle("is-active", +b.dataset.afWidth === st.width));
    guardBtn.setAttribute("aria-pressed", String(st.guard));
    guardBtn.textContent = `min(220px, 100%) 护盾：${st.guard ? "开" : "关"}`;

    // 当手机屏宽小于模拟容器宽时，按精确比例缩览容器与网格轨，确保真 CSS Grid 列数与虚线空轨、下方读数 100% 一致
    const shellAvail = Math.max(220, (shell.clientWidth || 320) - 12);
    const scale = Math.min(1, shellAvail / st.width);
    const drawW = Math.round(st.width * scale);
    const drawPad = Math.max(8, Math.round(14 * scale));
    const innerW = Math.max(120, st.width - 28);
    const drawInnerW = Math.max(80, drawW - drawPad * 2);
    const sRatio = drawInnerW / innerW;
    const sGap = +(GAP * sRatio).toFixed(2);
    // 略减 0.15px 规避浏览器浮点舍入造成窄屏少算一列
    const sMin = +(MIN * sRatio - (scale < 0.999 ? 0.15 : 0)).toFixed(2);

    vp.style.width = `${drawW}px`;
    vp.style.padding = `${drawPad}px`;
    vp.classList.toggle("is-scaled", scale < 0.99);
    vp.dataset.scaleNote = scale < 0.99 ? `模拟 ${st.width}px（${Math.round(scale * 100)}% 缩览）` : `容器 ${st.width}px`;

    const rawCols = Math.max(1, Math.floor((innerW + GAP) / (MIN + GAP)));
    const overflow = !st.guard && innerW < MIN;
    vp.classList.toggle("is-overflow", overflow);

    // 背后画出 auto-fill 产生的全部潜在轨道（含空轨）
    ghost.style.inset = `${drawPad}px`;
    ghost.style.gap = `${sGap}px`;
    ghost.style.gridTemplateColumns = `repeat(${rawCols}, minmax(0, 1fr))`;
    ghost.innerHTML = Array.from({ length: rawCols }, (_, i) => `<div class="af-ghost-col">轨 ${i + 1}</div>`).join("");

    // 真 DOM CSS Grid 样式（按等比轨宽运行真实 auto-fill / auto-fit）
    const minToken = st.guard ? `min(${MIN}px, 100%)` : `${MIN}px`;
    const drawMinToken = st.guard ? `min(${sMin}px, 100%)` : `${sMin}px`;
    grid.style.gap = `${sGap}px`;
    grid.style.gridTemplateColumns = `repeat(${st.mode}, minmax(${drawMinToken}, 1fr))`;
    grid.innerHTML = Array.from({ length: st.count }, (_, i) => {
      const colW = overflow
        ? MIN
        : st.mode === "auto-fit" && st.count < rawCols
          ? Math.round((innerW - (st.count - 1) * GAP) / st.count)
          : Math.round((innerW - (rawCols - 1) * GAP) / rawCols);
      return `<div class="af-item${overflow ? " is-overflow" : ""}"><strong>CARD 0${i + 1}</strong><span>约 ${colW}px</span></div>`;
    }).join("");

    const cssExpr = `repeat(${st.mode}, minmax(${minToken}, 1fr))`;
    const scaleHint = scale < 0.99 ? `（手机端按 ${Math.round(scale * 100)}% 等比缩览）` : "";
    if (overflow) {
      readout.className = "lab-readout is-err";
      readout.innerHTML = `<strong>触发极窄屏溢出：</strong>容器净宽仅 ${innerW}px，却硬性要求 <code>minmax(220px, 1fr)</code>，单张卡片直接撑破右侧虚线框 +${MIN - innerW}px！打开「<code>min(220px, 100%)</code> 护盾」立刻收服。`;
    } else if (st.mode === "auto-fill" && st.count < rawCols) {
      readout.className = "lab-readout";
      readout.innerHTML = `当前净宽 ${innerW}px${scaleHint}按公式算出 <strong>${rawCols} 条轨道</strong>，但只有 ${st.count} 张卡。<code>${cssExpr}</code> 会<strong>保留右侧 ${rawCols - st.count} 条透明空轨</strong>，方便卡片保持统一尺寸与后续继续追加。`;
    } else if (st.mode === "auto-fit" && st.count < rawCols) {
      readout.className = "lab-readout is-ok";
      readout.innerHTML = `同样是 ${innerW}px${scaleHint}与 ${st.count} 张卡，<code>${cssExpr}</code> 把那 ${rawCols - st.count} 条无人居住的空轨<strong>折叠为 0px</strong>，让现有 ${st.count} 张卡弹性撑满整行，不再偏缩在左侧。`;
    } else {
      readout.className = "lab-readout is-ok";
      readout.innerHTML = `当卡片数（${st.count} 张）≥ 可容纳列数（${rawCols} 列）时，已无空轨可折叠，<code>auto-fill</code> 与 <code>auto-fit</code> 表现完全一致——当前公式 <code>${cssExpr}</code>。`;
    }
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.afCount) st.count = +b.dataset.afCount;
    else if (b.dataset.afMode) st.mode = b.dataset.afMode;
    else if (b.dataset.afWidth) st.width = +b.dataset.afWidth;
    else if (b === guardBtn) st.guard = !st.guard;
    else return;
    render();
  });

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => render()).observe(shell);
  } else {
    window.addEventListener("resize", () => render(), { passive: true });
  }
  render();
}

/* ==================== 02 节：跨列层级与 dense 填洞 Tab 焦点循迹演练板 ==================== */
export function initSection02() {
  const root = document.getElementById("lab-dense");
  if (!root) return;

  const board = document.getElementById("dn-board");
  const svg = document.getElementById("dn-overlay");
  const readout = document.getElementById("dn-readout");
  const stepBtn = document.getElementById("dn-step-btn");
  const playBtn = document.getElementById("dn-play-btn");

  const BASE_CARDS = [
    { id: "d1", title: "首条导览", span: 2 },
    { id: "d2", title: "重磅封面", span: 3 },
    { id: "d3", title: "快讯小卡", span: 2 },
    { id: "d4", title: "指标卡", span: 1 },
    { id: "d5", title: "精选图集", span: 2 },
    { id: "d6", title: "补充说明", span: 1 },
  ];

  const BALANCED_CARDS = [
    { id: "d1", title: "首条导览", span: 2 },
    { id: "d2", title: "重磅封面", span: 2 },
    { id: "d3", title: "快讯小卡", span: 1 },
    { id: "d4", title: "指标卡", span: 1 },
    { id: "d5", title: "精选图集", span: 2 },
    { id: "d6", title: "补充说明", span: 4 },
  ];

  const st = { mode: "row", focusIdx: 0, timer: 0 };

  function getItems() {
    return st.mode === "balanced" ? BALANCED_CARDS : BASE_CARDS;
  }

  function drawOverlay(placements) {
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    if (!bw || !bh) return;
    const bRect = board.getBoundingClientRect();
    const wrapRect = board.parentElement.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${wrapRect.width} ${wrapRect.height}`);

    const centers = [];
    for (let i = 0; i < placements.length; i++) {
      const el = board.querySelector(`[data-dom-idx="${i}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      centers.push({
        x: r.left - wrapRect.left + r.width / 2,
        y: r.top - wrapRect.top + r.height / 2,
      });
    }

    let html = `<defs><marker id="dn-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1.5L8.5 5 1 8.5z" fill="#9C1706"/></marker></defs>`;
    for (let i = 0; i < Math.min(st.focusIdx, centers.length - 1); i++) {
      const a = centers[i];
      const b = centers[i + 1];
      const backJump = b.y < a.y - 12 || (Math.abs(b.y - a.y) <= 12 && b.x < a.x - 12);
      const col = backJump ? "#9C1706" : "#110100";
      const dash = backJump ? `stroke-dasharray="5 3"` : "";
      html += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${col}" stroke-width="${backJump ? 2.6 : 1.8}" ${dash} marker-end="url(#dn-arr)"/>`;
    }
    svg.innerHTML = html;
  }

  function render() {
    root.querySelectorAll("[data-dn-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.dnMode === st.mode));
    const items = getItems();
    const solved = solveGridLayout({
      containerWidth: 640,
      minColWidth: 140,
      gutter: 12,
      fillMode: "auto-fill",
      flowMode: st.mode === "dense" ? "dense" : "row",
      clampSpan: true,
      items,
    });

    board.classList.toggle("is-dense", st.mode === "dense");

    // 显式按单真源坐标放置每个单元格与空洞，确保 100% 精准可视化
    const cellsHtml = solved.placements
      .map((p) => {
        const isFocus = p.domIndex === st.focusIdx;
        const isReordered = p.visualIndex !== p.domIndex;
        return `<button type="button" class="dn-cell${isFocus ? " is-focus" : ""}${isReordered ? " is-reordered" : ""}" data-dom-idx="${p.domIndex}" style="grid-column:${p.col + 1} / span ${p.usedSpan};grid-row:${p.row + 1}">
          <div class="dn-cell-top">
            <span class="dn-dom-idx">DOM#${p.domIndex + 1}</span>
            <span class="dn-span-lbl">SPAN ${p.usedSpan}</span>
          </div>
          <div class="dn-title">${p.title}</div>
          <div class="dn-sub">视序第${p.visualIndex + 1}位${isReordered ? "·跳序" : ""}</div>
        </button>`;
      })
      .join("");

    const holesHtml = solved.holes
      .filter((h) => h.kind === "interior")
      .map(
        (h) =>
          `<div class="dn-hole" style="grid-column:${h.col + 1} / span ${h.span};grid-row:${h.row + 1}">空洞 ${h.span} 格</div>`
      )
      .join("");

    board.innerHTML = cellsHtml + holesHtml;
    stepBtn.textContent = `走下一步 Tab 焦点（${st.focusIdx + 1} / ${items.length}）`;

    if (st.mode === "row") {
      readout.className = "lab-readout is-err";
      readout.innerHTML = `<strong>稀疏 row（默认顺序）：</strong>DOM #2 占 3 列放不进第 1 行剩下 2 格，被迫换到第 2 行，在各行行尾接连撕出 <strong>${solved.interiorHoleCells} 格行内空洞</strong>；但键盘按 Tab 始终顺着 #1 → #2 → #3 逐行向下，绝不乱跳。`;
    } else if (st.mode === "dense") {
      readout.className = "lab-readout is-err";
      readout.innerHTML = `<strong>密排 dense（自动填洞）：</strong>行内空洞确实消失了，但 DOM #3（快讯小卡）被提拔塞进第 1 行尾部！连按「走下一步 Tab 焦点」到第 3 步就能看见<strong>赤色箭头倒钩跳回第 1 行</strong>，视觉顺序与键盘焦点顺序发生 ${solved.reorderedCount} 处脱节。`;
    } else {
      readout.className = "lab-readout is-ok";
      readout.innerHTML = `<strong>跨列配平（推荐解法）：</strong>与其事后用 <code>dense</code> 硬塞，不如先让每行跨列总和能整除列数（第 1 行 2+2=4、第 2 行 1+1+2=4、第 3 行通栏 4）——<strong>零空洞，同时 Tab 焦点 1→6 顺畅零折返</strong>。`;
    }

    requestAnimationFrame(() => drawOverlay(solved.placements));
  }

  function stopAuto() {
    if (st.timer) {
      clearInterval(st.timer);
      st.timer = 0;
      playBtn.textContent = "自动走完焦点轨";
    }
  }

  root.addEventListener("click", (e) => {
    const cell = e.target.closest(".dn-cell");
    if (cell) {
      stopAuto();
      st.focusIdx = +cell.dataset.domIdx;
      render();
      return;
    }
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.dnMode) {
      stopAuto();
      st.mode = b.dataset.dnMode;
      st.focusIdx = st.mode === "dense" ? 3 : 0;
      render();
    } else if (b === stepBtn) {
      stopAuto();
      st.focusIdx = (st.focusIdx + 1) % 6;
      render();
    } else if (b === playBtn) {
      if (st.timer) {
        stopAuto();
        return;
      }
      st.focusIdx = 0;
      render();
      playBtn.textContent = "暂停循迹";
      st.timer = setInterval(() => {
        st.focusIdx += 1;
        if (st.focusIdx >= 6) {
          st.focusIdx = 5;
          render();
          stopAuto();
          return;
        }
        render();
      }, 650);
    }
  });

  window.addEventListener("resize", () => render(), { passive: true });
  render();
}

/* ==================== 03 节深墨黑暗室：间隙 × 内边距格式塔归属实验室 ==================== */
export function initSection03() {
  const root = document.getElementById("lab-gutter");
  if (!root) return;

  const inGutter = document.getElementById("gl-gutter");
  const inPad = document.getElementById("gl-padding");
  const outGutter = document.getElementById("gl-out-gutter");
  const outPad = document.getElementById("gl-out-padding");
  const grid = document.getElementById("gl-grid");
  const meter = document.getElementById("gl-meter-bar");

  const PRESETS = {
    tight: { g: 6, p: 22 },
    sweet: { g: 18, p: 16 },
    island: { g: 42, p: 12 },
  };

  function render() {
    const g = +inGutter.value;
    const p = +inPad.value;
    outGutter.textContent = `${g}px`;
    outPad.textContent = `${p}px`;
    grid.style.gap = `${g}px`;
    grid.querySelectorAll(".gl-card").forEach((c) => {
      c.style.padding = `${p}px`;
    });

    const ratio = +(g / Math.max(1, p)).toFixed(2);
    root.querySelectorAll("[data-gl-preset]").forEach((b) => {
      const pr = PRESETS[b.dataset.glPreset];
      b.classList.toggle("is-active", pr && pr.g === g && pr.p === p);
    });

    if (g < p * 0.78) {
      meter.className = "gl-meter-bar is-err";
      meter.innerHTML = `<strong>外/内比 ${ratio}×（误分组风险）：</strong>外间隙（${g}px）明显窄过卡内留白（${p}px）。按格式塔接近性原则，眼睛会误把相邻两张白卡黏成一整块，文字归属感变糊。`;
    } else if (g > 32 || ratio > 2.2) {
      meter.className = "gl-meter-bar is-err";
      meter.innerHTML = `<strong>外/内比 ${ratio}×（孤岛散架）：</strong>外间隙拉到 ${g}px 后，三条宽黑缝把卡片拆得支离破碎，读者不再觉得它们属于同一组信息，且白白吞掉了可用列宽。`;
    } else {
      meter.className = "gl-meter-bar is-ok";
      meter.innerHTML = `<strong>外/内比 ${ratio}×（归属清晰）：</strong>外间隙（${g}px）略大于或持平卡内边距（${p}px），卡片内部紧凑成团、卡片之间留出明快呼吸缝，正是原海报所说的「统一 gutter，节奏稳定」。`;
    }
  }

  inGutter.addEventListener("input", render);
  inPad.addEventListener("input", render);
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-gl-preset]");
    if (!b) return;
    const pr = PRESETS[b.dataset.glPreset];
    if (!pr) return;
    inGutter.value = String(pr.g);
    inPad.value = String(pr.p);
    render();
  });

  render();
}

/* ==================== 04 节：五年代演化标尺卡组 ==================== */
export function initSection04() {
  const root = document.getElementById("lab-timeline");
  if (!root) return;
  const detail = document.getElementById("tl-detail");

  const ERAS = {
    "1981": {
      title: "1981 · 约瑟夫·米勒-布罗克曼确立印刷模块网格",
      source: "Grid Systems in Graphic Design · Arthur Niggli",
      body: "瑞士平面设计师 Josef Müller-Brockmann 在 1981 年出版《Grid Systems in Graphic Design》，系统阐明了列（Column）、间隙（Gutter）与跨列字段（Field）如何在纸面上把不同尺寸的图文统合成严谨秩序。自适应网格的视觉文法几乎全盘继承自这里，只是当年的纸张宽度是锁死的。",
      code: "/* 印刷纸面：裁切幅面固定 */\n8 列 × 18mm 栏宽 + 4mm 统一槽宽\n跨栏组合：2+4+2 / 3+2+3 / 4+4",
      svg: `<svg viewBox="0 0 220 120"><rect x="6" y="6" width="208" height="108" fill="#FFF" stroke="#110100" stroke-width="1.5"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${14 + i * 24}" y="14" width="20" height="92" fill="#FDCE05" opacity="0.45"/>`).join("")}<rect x="14" y="18" width="44" height="28" fill="#110100"/><rect x="62" y="18" width="92" height="28" fill="#110100" opacity="0.22"/><rect x="158" y="18" width="44" height="28" fill="#110100" opacity="0.6"/><rect x="14" y="54" width="116" height="44" fill="#110100" opacity="0.16"/><rect x="134" y="54" width="68" height="44" fill="#110100"/></svg>`,
    },
    "2010": {
      title: "2010 · 伊森·马科特提出响应式网页设计",
      source: "A List Apart #306 · 2010-05-25",
      body: "2010 年 5 月 25 日，Ethan Marcotte 在 A List Apart 发表《Responsive Web Design》，用「流动网格（百分比栏宽）+ 弹性图片 + 媒体查询」打破了 960px 固定网页时代。不过那时仍靠 float 和手写多个 @media 断点逐档切换列数。",
      code: "/* 2010 响应式经典手算公式 */\n.col { float: left; width: 31.25%; margin-right: 3.125%; }\n@media (max-width: 768px) { .col { width: 48%; } }",
      svg: `<svg viewBox="0 0 220 120"><rect x="6" y="10" width="94" height="100" fill="#FFF" stroke="#110100" stroke-width="1.5"/><rect x="14" y="20" width="24" height="36" fill="#FDCE05"/><rect x="42" y="20" width="24" height="36" fill="#FDCE05"/><rect x="70" y="20" width="22" height="36" fill="#FDCE05"/><path d="M106 60h18m-5-5l5 5-5 5" stroke="#110100" stroke-width="2" fill="none"/><rect x="130" y="10" width="82" height="100" fill="#FFF" stroke="#110100" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="138" y="20" width="30" height="36" fill="#110100"/><rect x="174" y="20" width="30" height="36" fill="#110100"/><rect x="138" y="64" width="66" height="34" fill="#FDCE05"/></svg>`,
    },
    "2011": {
      title: "2011 · 微软工程师提交首份 CSS Grid 公开草案",
      source: "W3C First Public Working Draft · 2011-04-07",
      body: "2011 年 4 月 7 日，W3C 发布了由微软团队（Alex Mogilevsky、Phil Cupp、Markus Mielke 等）起草的首份 CSS Grid Layout 公开工作草案，并在 IE10 中率先以 -ms-grid 前缀落地。网页第一次拥有了原生二维行列坐标系，不再拿表格和浮动凑合。",
      code: "/* 2011 早期 -ms-grid 试验语法 */\ndisplay: -ms-grid;\n-ms-grid-columns: 1fr 16px 1fr 16px 1fr;",
      svg: `<svg viewBox="0 0 220 120"><rect x="14" y="12" width="192" height="96" fill="#FFF" stroke="#110100" stroke-width="1.5"/><path d="M78 12v96M142 12v96M14 60h192" stroke="#110100" stroke-dasharray="3 3"/><rect x="20" y="18" width="52" height="36" fill="#110100"/><rect x="84" y="18" width="116" height="36" fill="#FDCE05"/><rect x="20" y="66" width="116" height="36" fill="#FDCE05" opacity="0.65"/><rect x="148" y="66" width="52" height="36" fill="#110100" opacity="0.25"/></svg>`,
    },
    "2017": {
      title: "2016–2017 · CSS Grid Level 1 成熟，现代浏览器齐发",
      source: "W3C CR 2016-09-29 · 2017 春浏览器同步支持",
      body: "2016 年 9 月 29 日 CSS Grid Layout Module Level 1 成为 W3C 候选推荐标准；2017 年春，Firefox、Chrome 与 Safari 几乎同步全量支持。借助 repeat(auto-fill / auto-fit, minmax())、fr 单位与统一 gap，一行 CSS 就能实现本页展示的免断点自适应网格。",
      code: "/* 2017 起一行代码开启真自适应网格 */\ndisplay: grid;\ngrid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));\ngap: 16px;",
      svg: `<svg viewBox="0 0 220 120"><rect x="10" y="14" width="200" height="92" fill="#FDCE05" stroke="#110100" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="18" y="22" width="42" height="34" rx="4" fill="#FFF"/><rect x="66" y="22" width="90" height="34" rx="4" fill="#FFF"/><rect x="162" y="22" width="40" height="34" rx="4" fill="#FFF"/><rect x="18" y="64" width="66" height="34" rx="4" fill="#FFF"/><rect x="90" y="64" width="40" height="34" rx="4" fill="#FFF"/><rect x="136" y="64" width="66" height="34" rx="4" fill="#FFF"/></svg>`,
    },
    "2018": {
      title: "2018 · 珍·西蒙斯提出「内在网页设计」",
      source: "Jen Simmons · An Event Apart 2018",
      body: "2018 年，CSS 工作组成员 Jen Simmons 在 An Event Apart 演讲《Everything You Know About Web Design Just Changed》中提出 Intrinsic Web Design（内在网页设计）：自适应网格不再在「纯定宽」和「纯百分比」间二选一，而是用 minmax()、fr 与内容固有宽度一起协商出最舒服的平衡。",
      code: "/* 固定下限 + 弹性余白 + 跨列层次自由混合 */\ngrid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));\n.hero-card { grid-column: span 2; }",
      svg: `<svg viewBox="0 0 220 120"><rect x="10" y="12" width="200" height="96" fill="#12110E" rx="6"/><rect x="20" y="22" width="84" height="34" rx="4" fill="#FDCE05"/><rect x="112" y="22" width="42" height="34" rx="4" fill="#FFF"/><rect x="162" y="22" width="38" height="34" rx="4" fill="#FFF" opacity="0.65"/><rect x="20" y="64" width="54" height="34" rx="4" fill="#FFF" opacity="0.85"/><rect x="82" y="64" width="118" height="34" rx="4" fill="#FDCE05" opacity="0.45" stroke="#FDCE05"/></svg>`,
    },
  };

  function render(era) {
    const data = ERAS[era] || ERAS["1981"];
    root.querySelectorAll(".tl-tab").forEach((b) => {
      const on = b.dataset.era === era;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    detail.innerHTML = `
      <div class="tl-detail-head">
        <h3>${data.title}</h3>
        <span class="tl-source-tag">${data.source}</span>
      </div>
      <div class="tl-body-grid">
        <div class="tl-copy">
          <p>${data.body}</p>
          <pre class="tl-code"><code>${data.code}</code></pre>
        </div>
        <div class="tl-diagram" aria-hidden="true">${data.svg}</div>
      </div>
    `;
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest(".tl-tab");
    if (b) render(b.dataset.era);
  });

  render("1981");
}

/* ==================== 05 节：场景分诊手风琴卡片 ==================== */
export function initSection05() {
  const root = document.getElementById("lab-triage");
  if (!root) return;
  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".triage-btn");
    if (!btn) return;
    const card = btn.closest(".triage-card");
    const open = card.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });
}

/* ==================== 06 节：深墨黑考场（单真源精确算式四选一测验） ==================== */
export function initSection06() {
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");
  if (!grid || !feedback) return;

  const QUIZ_ITEMS = (firstSpan, lastSpan) => [
    { id: "q1", span: firstSpan },
    { id: "q2", span: 1 },
    { id: "q3", span: 1 },
    { id: "q4", span: 1 },
    { id: "q5", span: 1 },
    { id: "q6", span: lastSpan },
  ];

  const OPTIONS = [
    {
      key: "A",
      param: "minmax(96px, 1fr) · gap: 16px · 首尾卡 span 2",
      cfg: { containerWidth: 720, minColWidth: 96, gutter: 16, fillMode: "auto-fill", flowMode: "row", clampSpan: false, items: QUIZ_ITEMS(2, 2) },
      ok: false,
      explain: "仅改小了最小列宽（96px）：720px 下塞进 6 列，每列实宽只有 106.7px，远低于题目要求的 150px 易读宽，两行标题会被挤成细条。",
    },
    {
      key: "B",
      param: "minmax(160px, 1fr) · gap: 16px · 首尾卡 span 2",
      cfg: { containerWidth: 720, minColWidth: 160, gutter: 16, fillMode: "auto-fill", flowMode: "row", clampSpan: false, items: QUIZ_ITEMS(2, 2) },
      ok: true,
      explain: "唯一全项达标的真平衡解：floor((720+16)÷(160+16)) = 4 列，每列实宽 168px ≥ 150px；gap 16px 与卡内边距 16px 持平、归属分明；6 卡总跨度 2+1+1+1+1+2 = 8 恰好排成 2 整行，零空洞零溢出。",
    },
    {
      key: "C",
      param: "minmax(160px, 1fr) · gap: 44px · 首尾卡 span 2",
      cfg: { containerWidth: 720, minColWidth: 160, gutter: 44, fillMode: "auto-fill", flowMode: "row", clampSpan: false, items: QUIZ_ITEMS(2, 2) },
      ok: false,
      explain: "仅拉大了间隙（44px）：宽间隙白白吞掉 88px，列数掉成 3 列，卡片被拉散成孤岛，同时 6 张卡排成 3 行后在末行留下 1 格缺口。",
    },
    {
      key: "D",
      param: "minmax(160px, 1fr) · gap: 16px · 首卡 span 5",
      cfg: { containerWidth: 720, minColWidth: 160, gutter: 16, fillMode: "auto-fill", flowMode: "row", clampSpan: false, items: QUIZ_ITEMS(5, 2) },
      ok: false,
      explain: "仅放大了首卡跨列（span 5）：720px 容器只能建 4 条显式列，硬写 span 5 会强生第 5 隐式列，直接撑破容器向右横向溢出！",
    },
  ];

  function buildMiniSvg(solved, showAnswer) {
    const vw = 260;
    const vh = 88;
    const padX = 16;
    const padY = 10;
    const boxW = 192;
    const scale = boxW / solved.containerWidth;
    const rowH = Math.min(26, Math.max(15, (vh - padY * 2 - (solved.rowCount - 1) * 4) / solved.rowCount));

    let out = `<svg viewBox="0 0 ${vw} ${vh}" aria-hidden="true">`;
    out += `<rect x="${padX}" y="${padY - 2}" width="${boxW}" height="${vh - padY * 2 + 4}" fill="none" stroke="#110100" stroke-width="1.2" stroke-dasharray="3 2.5"/>`;

    for (const p of solved.placements) {
      const rx = padX + p.x * scale;
      const ry = padY + 2 + p.row * (rowH + 4);
      const rw = Math.max(8, p.w * scale);
      const markErr = showAnswer && p.overflowed;
      const stroke = markErr ? "#9C1706" : "#110100";
      out += `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rowH.toFixed(1)}" rx="3" fill="#FFFFFF" stroke="${stroke}" stroke-width="${markErr ? 1.8 : 1}"/>`;
      if (rw > 20) {
        out += `<rect x="${(rx + 4).toFixed(1)}" y="${(ry + rowH * 0.52).toFixed(1)}" width="${Math.max(6, rw - 10).toFixed(1)}" height="3" rx="1.5" fill="#DBDBDB"/>`;
      }
    }
    if (showAnswer && solved.overflowPx > 0) {
      out += `<line x1="${padX + boxW}" y1="${padY - 4}" x2="${padX + boxW}" y2="${vh - padY + 4}" stroke="#9C1706" stroke-width="2"/>`;
    }
    out += `</svg>`;
    return out;
  }

  let picked = null;

  function render() {
    grid.innerHTML = OPTIONS.map((opt) => {
      const solved = solveGridLayout(opt.cfg);
      let cls = "quiz-opt";
      if (picked) {
        if (opt.key === picked) cls += opt.ok ? " is-picked-ok" : " is-picked-err";
        else if (opt.ok) cls += " is-reveal-ok";
      }
      return `<button type="button" class="${cls}" data-quiz="${opt.key}">
        <div class="quiz-opt-head">
          <span class="quiz-letter">${opt.key}</span>
          <span class="quiz-param">${opt.param}</span>
        </div>
        <div class="quiz-svg-box">${buildMiniSvg(solved, !!picked)}</div>
      </button>`;
    }).join("");

    if (!picked) {
      feedback.innerHTML = "";
      return;
    }

    const chosen = OPTIONS.find((o) => o.key === picked);
    feedback.innerHTML = `
      <div class="quiz-result-card ${chosen.ok ? "is-ok" : "is-err"}">
        <h3>${chosen.ok ? "答对了！B 是唯一四项俱全的平衡解" : `选了 ${chosen.key}——差在一个关键变量上，正确答案是 B`}</h3>
        <p>${chosen.explain}</p>
        <ul class="quiz-breakdown">
          ${OPTIONS.map((o) => `<li><strong>${o.key}：</strong>${o.explain}</li>`).join("")}
        </ul>
        <button type="button" class="dark-btn" id="quiz-reset">重新作答</button>
      </div>
    `;
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quiz]");
    if (!btn) return;
    picked = btn.dataset.quiz;
    render();
  });

  feedback.addEventListener("click", (e) => {
    if (e.target.closest("#quiz-reset")) {
      picked = null;
      render();
    }
  });

  render();
}

/* ==================== 07 节：原海报放大查看器（支持缩放、拖动、Esc 关闭） ==================== */
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const poster = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbVp = document.getElementById("lb-viewport");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const btnClose = document.getElementById("lb-close");
  if (!openBtn || !poster || !lb) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.7, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbVp.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbVp.setPointerCapture(e.pointerId);
  });
  lbVp.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbVp.addEventListener("pointerup", () => {
    dragging = false;
  });
  lbVp.addEventListener("pointercancel", () => {
    dragging = false;
  });

  lbVp.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.7, Math.min(3, +(scale + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
