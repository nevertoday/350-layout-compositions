// 173 模块系统 · 01–07 节专属交互模块（相邻节零同构控件）

// ---------- 01 节：原海报「模块构建 1→2→3」分阶可交互蓝图 ----------
export function initBuildSteps() {
  const root = document.getElementById("sec01Builder");
  if (!root) return;
  const svg = document.getElementById("buildBlueprintSvg");
  const noteTitle = document.getElementById("buildStepTitle");
  const noteBody = document.getElementById("buildStepBody");
  const noteWhy = document.getElementById("buildStepWhy");
  const gridBtns = [...root.querySelectorAll("[data-bgrid]")];
  const stepBtns = [...root.querySelectorAll("[data-bstep]")];

  const STEP_META = {
    1: {
      title: "步骤 ① 建立基准网格（BASE GRID）",
      body: "先按页面长宽切出等宽等高的隐形基准格，就像给积木箱铺好底板。此时还没有内容，但全页的坐标语言已经统一。",
      why: "为什么先切格而不是先放图？因为一旦第一张图凭感觉定出小数宽度，后面所有文字和卡片都只能凑合迁就它。",
    },
    2: {
      title: "步骤 ② 定义模块单元（DEFINE MODULE）",
      body: "取基准格里最小的一个 1×1 方格记为 x × x，作为全页的原子尺。所有大模块只能取它的整数倍（如 2x × 1x、2x × 2x）。",
      why: "为什么要用整数倍？当 2×1 和两个 1×1 并排时，外边沿天然严丝合缝，读者一眼就能感到「它们属于同一套系统」。",
    },
    3: {
      title: "步骤 ③ 应用间距系统（APPLY SPACING）",
      body: "在每个模块之间刻出完全一致的缝隙通道 g，再按信息主次合并成不同大小的容器。缝隙统一锁住秩序，跨格尺寸拉开节奏。",
      why: "为什么缝隙必须全场统一？眼睛靠间隙判断信息归属——缝隙恒定时，视线能沿着干净的通道一路扫完全版不迷路。",
    },
  };

  let curStep = 1;
  let curCols = 4;

  function render() {
    const rows = curCols === 4 ? 4 : curCols === 6 ? 4 : 5;
    const cols = curCols;
    const W = 520;
    const H = 320;
    const pad = 28;
    const gap = curStep === 3 ? 10 : 0;
    const u = Math.min((W - pad * 2 - (cols - 1) * gap) / cols, (H - pad * 2 - (rows - 1) * gap) / rows);
    const bw = cols * u + (cols - 1) * gap;
    const bh = rows * u + (rows - 1) * gap;
    const bx = (W - bw) / 2;
    const by = (H - bh) / 2;
    const step = u + gap;

    const parts = [];
    // 深松青图纸底板
    parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#002D2E"/>`);
    parts.push(`<rect x="${bx - 8}" y="${by - 8}" width="${bw + 16}" height="${bh + 16}" fill="#042223" stroke="#4E6E64" stroke-width="1"/>`);

    // Step 1 & 2: 虚线基准网格
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = bx + c * step;
        const y = by + r * step;
        parts.push(
          `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${u.toFixed(1)}" height="${u.toFixed(1)}" fill="none" stroke="rgba(182,204,196,${curStep === 3 ? 0.22 : 0.48})" stroke-dasharray="4 3" stroke-width="1"/>`
        );
      }
    }

    // 四角标志性小金块（致敬 173 原海报）
    const corners = [
      [bx - 10, by - 10],
      [bx + bw + 5, by - 10],
      [bx - 10, by + bh + 5],
      [bx + bw + 5, by + bh + 5],
    ];
    for (const [cx, cy] of corners) {
      parts.push(`<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="5" height="5" fill="#C5920A"/>`);
    }

    if (curStep === 2) {
      // 高亮一枚基准 1×1 单元并标注 x × x
      const ax = bx + step;
      const ay = by + step;
      parts.push(`<rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${u.toFixed(1)}" height="${u.toFixed(1)}" fill="#C5920A" fill-opacity="0.72" stroke="#F2C94C" stroke-width="1.8"/>`);
      // 旁边示意 2x × 1x 整数衍生块
      if (cols >= 4) {
        const bx2 = bx + 2 * step;
        parts.push(`<rect x="${bx2.toFixed(1)}" y="${ay.toFixed(1)}" width="${(u * 2).toFixed(1)}" height="${u.toFixed(1)}" fill="#2B655F" fill-opacity="0.78" stroke="#E5DEC5" stroke-width="1.4"/>`);
        parts.push(`<text x="${(bx2 + u).toFixed(1)}" y="${(ay + u / 2 + 4).toFixed(1)}" text-anchor="middle" fill="#E5DEC5" font-family="DM Mono, monospace" font-size="12">2x × 1x</text>`);
      }
      // x 标注尺寸线
      parts.push(`<line x1="${ax.toFixed(1)}" y1="${(ay - 10).toFixed(1)}" x2="${(ax + u).toFixed(1)}" y2="${(ay - 10).toFixed(1)}" stroke="#F2C94C" stroke-width="1.3"/>`);
      parts.push(`<text x="${(ax + u / 2).toFixed(1)}" y="${(ay - 14).toFixed(1)}" text-anchor="middle" fill="#F2C94C" font-family="DM Mono, monospace" font-size="12">x</text>`);
      parts.push(`<line x1="${(ax - 10).toFixed(1)}" y1="${ay.toFixed(1)}" x2="${(ax - 10).toFixed(1)}" y2="${(ay + u).toFixed(1)}" stroke="#F2C94C" stroke-width="1.3"/>`);
      parts.push(`<text x="${(ax - 16).toFixed(1)}" y="${(ay + u / 2 + 4).toFixed(1)}" text-anchor="end" fill="#F2C94C" font-family="DM Mono, monospace" font-size="12">x</text>`);
      parts.push(`<text x="${(ax + u / 2).toFixed(1)}" y="${(ay + u / 2 + 4).toFixed(1)}" text-anchor="middle" fill="#042324" font-family="DM Mono, monospace" font-size="12" font-weight="600">1×1</text>`);
    }

    if (curStep === 3) {
      // 按当前列数组装完整模块示例并高亮统一缝隙带
      const layout =
        cols === 4
          ? [
              [0, 0, 2, 1, "#2B655F"],
              [2, 0, 1, 1, "dots"],
              [3, 0, 1, 1, "#C5920A"],
              [0, 1, 1, 2, "#2B655F"],
              [1, 1, 1, 1, "#C5920A"],
              [1, 2, 1, 1, "#2B655F"],
              [2, 1, 2, 2, "circle"],
              [0, 3, 2, 1, "#2B655F"],
              [2, 3, 1, 1, "#C5920A"],
              [3, 3, 1, 1, "#2B655F"],
            ]
          : cols === 6
          ? [
              [0, 0, 2, 1, "#2B655F"],
              [2, 0, 2, 1, "#C5920A"],
              [4, 0, 2, 2, "circle"],
              [0, 1, 1, 2, "#2B655F"],
              [1, 1, 2, 2, "#2B655F"],
              [3, 1, 1, 1, "dots"],
              [3, 2, 1, 2, "#C5920A"],
              [4, 2, 2, 1, "#2B655F"],
              [0, 3, 3, 1, "#2B655F"],
              [4, 3, 1, 1, "#C5920A"],
              [5, 3, 1, 1, "#2B655F"],
            ]
          : [
              [0, 0, 3, 1, "#2B655F"],
              [3, 0, 2, 1, "dots"],
              [5, 0, 3, 2, "circle"],
              [0, 1, 2, 2, "#C5920A"],
              [2, 1, 3, 2, "#2B655F"],
              [5, 2, 2, 1, "#2B655F"],
              [7, 2, 1, 2, "#C5920A"],
              [0, 3, 4, 2, "#2B655F"],
              [4, 3, 3, 1, "#2B655F"],
              [4, 4, 2, 1, "#C5920A"],
              [6, 4, 2, 1, "#2B655F"],
            ];

      // 标出两条贯通缝隙通道（致敬原海报步骤 3 的绿色缝隙高亮带）
      const gxLine = bx + u;
      parts.push(`<rect x="${gxLine.toFixed(1)}" y="${(by - 8).toFixed(1)}" width="${gap}" height="${(bh + 16).toFixed(1)}" fill="rgba(242,201,76,0.22)"/>`);
      const gyLine = by + u;
      parts.push(`<rect x="${(bx - 8).toFixed(1)}" y="${gyLine.toFixed(1)}" width="${(bw + 16).toFixed(1)}" height="${gap}" fill="rgba(242,201,76,0.22)"/>`);

      for (const [gx, gy, gw, gh, fill] of layout) {
        const x = bx + gx * step;
        const y = by + gy * step;
        const w = gw * u + (gw - 1) * gap;
        const h = gh * u + (gh - 1) * gap;
        if (fill === "dots") {
          parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#023033" stroke="#5E8276" stroke-width="1"/>`);
          for (let dr = 0; dr < 4; dr++) {
            for (let dc = 0; dc < 4; dc++) {
              parts.push(`<circle cx="${(x + w * (0.18 + dc * 0.21)).toFixed(1)}" cy="${(y + h * (0.18 + dr * 0.21)).toFixed(1)}" r="1.7" fill="#FDDD6F"/>`);
            }
          }
        } else if (fill === "circle") {
          parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#2B655F"/>`);
          parts.push(`<circle cx="${(x + w / 2).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="${(Math.min(w, h) * 0.27).toFixed(1)}" fill="#C5920A"/>`);
        } else {
          parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"/>`);
        }
      }
      parts.push(`<text x="${(gxLine + gap / 2).toFixed(1)}" y="${(by - 12).toFixed(1)}" text-anchor="middle" fill="#F2C94C" font-family="DM Mono, monospace" font-size="11">g = 10px</text>`);
    }

    svg.innerHTML = parts.join("");
    const meta = STEP_META[curStep];
    noteTitle.textContent = meta.title;
    noteBody.textContent = meta.body;
    noteWhy.textContent = meta.why;
    stepBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.bstep) === curStep));
    gridBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.bgrid) === curCols));
  }

  stepBtns.forEach((b) => b.addEventListener("click", () => { curStep = Number(b.dataset.bstep); render(); }));
  gridBtns.forEach((b) => b.addEventListener("click", () => { curCols = Number(b.dataset.bgrid); render(); }));
  render();
}

// ---------- 02 节：真实 DOM/CSS 响应式模块重组与内容增删模拟器 ----------
export function initReflowWall() {
  const root = document.getElementById("sec02Reflow");
  if (!root) return;
  const wall = document.getElementById("reflowWall");
  const statusEl = document.getElementById("reflowStatus");
  const colsBtns = [...root.querySelectorAll("[data-rcols]")];
  const addBtn = document.getElementById("reflowAddBtn");
  const delBtn = document.getElementById("reflowDelBtn");
  const breakBtn = document.getElementById("reflowBreakBtn");

  const CARDS_POOL = [
    { id: "c1", title: "主题展览", sub: "2×2 核心视觉模块", spanC: 2, spanR: 2, theme: "hero" },
    { id: "c2", title: "开幕日期", sub: "1×1 高光信息锚点", spanC: 1, spanR: 1, theme: "gold" },
    { id: "c3", title: "场馆索引", sub: "1×1 点阵坐标模块", spanC: 1, spanR: 1, theme: "dots" },
    { id: "c4", title: "策展导语", sub: "2×1 横向叙事条", spanC: 2, spanR: 1, theme: "teal" },
    { id: "c5", title: "票务时段", sub: "1×1 辅助功能块", spanC: 1, spanR: 1, theme: "teal" },
    { id: "c6", title: "专题讲座", sub: "1×1 强调日程", spanC: 1, spanR: 1, theme: "gold" },
    { id: "c7", title: "建筑模型", sub: "2×1 新增展项", spanC: 2, spanR: 1, theme: "teal" },
    { id: "c8", title: "图录发售", sub: "1×1 周边模块", spanC: 1, spanR: 1, theme: "dots" },
    { id: "c9", title: "导览预约", sub: "1×1 快捷入口", spanC: 1, spanR: 1, theme: "gold" },
  ];

  let cols = window.innerWidth <= 600 ? 2 : 4;
  let count = 6;
  let broken = false;

  function render() {
    wall.dataset.cols = String(cols);
    wall.classList.toggle("is-broken", broken);
    wall.style.setProperty("--rcols", String(cols));

    const items = CARDS_POOL.slice(0, count);
    wall.innerHTML = items
      .map((card, i) => {
        const effC = Math.min(cols, card.spanC);
        const effR = cols === 1 ? 1 : card.spanR;
        const style = broken
          ? `width:${[43, 31, 52, 27, 46, 35, 39, 29, 48][i % 9]}%; min-height:${[92, 68, 114, 76, 102, 72, 88, 66, 96][i % 9]}px;`
          : `grid-column: span ${effC}; grid-row: span ${effR};`;
        const spanBadge = broken ? `散尺 ${[43, 31, 52, 27, 46, 35, 39, 29, 48][i % 9]}%` : `${effC}×${effR}u`;
        return `<div class="rf-card rf-${card.theme}" style="${style}">
          <span class="rf-dim">${spanBadge}</span>
          <strong>${card.title}</strong>
          <small>${card.sub}</small>
        </div>`;
      })
      .join("");

    colsBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.rcols) === cols));
    breakBtn.classList.toggle("is-danger-active", broken);
    breakBtn.textContent = broken ? "恢复标准倍比（关闭散尺）" : "破坏倍比（混入非标准宽卡）";
    addBtn.disabled = count >= CARDS_POOL.length;
    delBtn.disabled = count <= 3;

    if (broken) {
      statusEl.className = "rf-status is-err";
      statusEl.textContent = `当前 ${count} 块已失去共同倍比：每块宽度各凭感觉（43%、31%、52%…），右侧留出无法对齐的参差缺口，增删一张卡片全版都会错乱。`;
    } else {
      statusEl.className = "rf-status is-ok";
      statusEl.textContent = `${cols} 列容器 · ${count} 块标准倍比模块：无论切宽切窄还是增删卡片，每块自动按整数倍跨格重排，缝隙与边线始终咬合。`;
    }
  }

  colsBtns.forEach((b) => b.addEventListener("click", () => { cols = Number(b.dataset.rcols); render(); }));
  addBtn.addEventListener("click", () => { if (count < CARDS_POOL.length) { count++; render(); } });
  delBtn.addEventListener("click", () => { if (count > 3) { count--; render(); } });
  breakBtn.addEventListener("click", () => { broken = !broken; render(); });
  render();
}

// ---------- 03 节：卡尔·格斯特纳 58 单元流动网格公倍数校验尺 ----------
export function initGerstner58() {
  const root = document.getElementById("sec03Gerstner");
  if (!root) return;
  const stack = document.getElementById("gerstnerStack");
  const eqEl = document.getElementById("gerstnerEq");
  const btns = [...root.querySelectorAll("[data-gcols]")];

  let activeMode = "all"; // "all" or 1..6

  const ROWS = [
    { n: 1, w: 58, gutters: 0 },
    { n: 2, w: 28, gutters: 1 },
    { n: 3, w: 18, gutters: 2 },
    { n: 4, w: 13, gutters: 3 },
    { n: 5, w: 10, gutters: 4 },
    { n: 6, w: 8, gutters: 5 },
  ];

  function render() {
    // 顶部 58 格标尺
    let rulerTicks = "";
    for (let i = 1; i <= 58; i++) {
      rulerTicks += `<span class="g58-tick${i % 10 === 0 ? " is-major" : ""}"></span>`;
    }

    const visibleRows = activeMode === "all" ? ROWS : ROWS.filter((r) => r.n === Number(activeMode));
    const rowsHtml = visibleRows
      .map((r) => {
        const cells = [];
        for (let i = 0; i < r.n; i++) {
          cells.push(
            `<div class="g58-col" style="flex:${r.w} 0 0"><span>${r.w}u</span></div>`
          );
          if (i < r.n - 1) {
            cells.push(`<div class="g58-gap" style="flex:2 0 0" aria-hidden="true"></div>`);
          }
        }
        return `<div class="g58-row">
          <div class="g58-meta"><strong>${r.n} 栏</strong><span>${r.n}×${r.w} + ${r.gutters}×2 = 58</span></div>
          <div class="g58-track">${cells.join("")}</div>
        </div>`;
      })
      .join("");

    stack.innerHTML = `<div class="g58-ruler" aria-hidden="true">${rulerTicks}</div>${rowsHtml}`;

    if (activeMode === "all") {
      eqEl.textContent = "数学底层：n 栏宽度 w 与 (n−1) 道 2 单元栏缝恒满足 n×(w + 2) = 60。因为 60 是 1、2、3、4、5、6 的最小公倍数，所以同一页 58 单元母体能无缝混排六种栏数。";
    } else {
      const r = ROWS.find((x) => x.n === Number(activeMode));
      eqEl.textContent = `${r.n} 栏模式：每栏严格占 ${r.w} 个基准单元（10pt/单元），栏间恒留 2 单元（共 ${r.gutters * 2} 单元），总宽 ${r.n}×${r.w} + ${r.gutters}×2 = 58 单元，零余数。`;
    }
    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.gcols === String(activeMode)));
  }

  btns.forEach((b) => b.addEventListener("click", () => { activeMode = b.dataset.gcols; render(); }));
  render();
}

// ---------- 04 节：外缝隙 g vs 块内留白 p 的格式塔临近法则实验台 ----------
export function initProximityLab() {
  const root = document.getElementById("sec04Proximity");
  if (!root) return;
  const gapSlider = document.getElementById("proxGapSlider");
  const padSlider = document.getElementById("proxPadSlider");
  const gapVal = document.getElementById("proxGapVal");
  const padVal = document.getElementById("proxPadVal");
  const grid = document.getElementById("proxGrid");
  const diag = document.getElementById("proxDiag");
  const bridge = document.getElementById("proxBridge");

  function render() {
    const g = Number(gapSlider.value);
    const p = Number(padSlider.value);
    gapVal.textContent = `${g}px`;
    padVal.textContent = `${p}px`;
    grid.style.setProperty("--pgap", `${g}px`);
    grid.style.setProperty("--ppad", `${p}px`);

    const ratio = g / Math.max(1, p);
    let cls = "is-ok";
    let msg = "";
    if (g < 6) {
      cls = "is-err";
      msg = `外缝隙仅 ${g}px（小于块内留白 ${p}px）：两张模块几乎贴死，读者容易把左块正文和右块标题误连成同一行。`;
      bridge.hidden = false;
      bridge.textContent = "× 缝隙过窄：视线跨块串行";
    } else if (g <= p * 0.72) {
      cls = "is-warn";
      msg = `外缝隙 ${g}px 比块内留白 ${p}px 窄太多：模块内部反而比模块之间更空，视觉分组发生倒挂，整体像松散拼贴。`;
      bridge.hidden = false;
      bridge.textContent = "× 内空大于外缝：分组倒挂";
    } else if (g > 32) {
      cls = "is-warn";
      msg = `外缝隙拉到 ${g}px：卡片之间漂得太远，整体模块矩阵的联动感被空隙冲散了。经验值通常把外缝控制在 10–20px，并接近或略小于块内留白。`;
      bridge.hidden = false;
      bridge.textContent = "× 外缝过大：模块群解体";
    } else {
      cls = "is-ok";
      msg = `外缝隙 ${g}px × 块内留白 ${p}px（比值 ${ratio.toFixed(2)}）：块内标题与正文紧凑成组，模块间又有清晰的隔离通道，秩序与呼吸平衡（经验区间）。`;
      bridge.hidden = true;
    }
    diag.className = `prox-diag ${cls}`;
    diag.textContent = msg;
  }

  gapSlider.addEventListener("input", render);
  padSlider.addEventListener("input", render);
  render();
}

// ---------- 05 节：什么时候别用模块系统（4 例翻转对照卡） ----------
export function initAvoidFlip() {
  const root = document.getElementById("sec05Avoid");
  if (!root) return;
  const cards = [...root.querySelectorAll(".avoid-card")];
  cards.forEach((card) => {
    const btn = card.querySelector(".avoid-toggle");
    btn.addEventListener("click", () => {
      const fixed = card.classList.toggle("is-fixed");
      btn.setAttribute("aria-pressed", String(fixed));
      btn.textContent = fixed ? "看回「硬套模块」翻车态" : "切换「改用合适版式」对照";
    });
  });
}

// ---------- 06 节：两轮单变量小练习（中性标签 A/B/C/D，绝不剧透好坏） ----------
export function initQuiz() {
  const root = document.getElementById("sec06Quiz");
  if (!root) return;
  const roundBtns = [...root.querySelectorAll("[data-qround]")];
  const promptEl = document.getElementById("quizPrompt");
  const gridEl = document.getElementById("quizGrid");
  const feedbackEl = document.getElementById("quizFeedback");

  // 辅助生成严格可控的 4×4 几何 SVG，用于单变量对比
  function makeSvg(tiles, { gapX = 8, gapY = 8, irregular = false } = {}) {
    const W = 200;
    const H = 200;
    const pad = 12;
    const u = (W - pad * 2 - 3 * gapX) / 4;
    const stepX = u + gapX;
    const stepY = u + gapY;
    const out = [`<svg viewBox="0 0 ${W} ${H}" class="quiz-svg" aria-hidden="true">`];
    out.push(`<rect width="${W}" height="${H}" fill="#022324"/>`);
    for (const t of tiles) {
      const x = pad + t.gx * stepX + (t.dx || 0);
      const y = pad + t.gy * stepY + (t.dy || 0);
      const w = t.gw * u + Math.max(0, t.gw - 1) * gapX + (t.dw || 0);
      const h = t.gh * u + Math.max(0, t.gh - 1) * gapY + (t.dh || 0);
      if (t.role === "dots") {
        out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#002D30" stroke="#507268" stroke-width="0.9"/>`);
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            out.push(`<circle cx="${(x + w * (0.18 + c * 0.21)).toFixed(1)}" cy="${(y + h * (0.18 + r * 0.21)).toFixed(1)}" r="1.4" fill="#FDDD6F"/>`);
          }
        }
      } else if (t.role === "circle") {
        out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#2B655F"/>`);
        out.push(`<circle cx="${(x + w / 2).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="${(Math.min(w, h) * 0.27).toFixed(1)}" fill="#C5920A"/>`);
      } else {
        out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${t.role === "gold" ? "#C5920A" : "#2B655F"}"/>`);
      }
    }
    if (irregular) {
      // 无明显标红，靠真实几何差异让读者用眼力分辨
    }
    out.push("</svg>");
    return out.join("");
  }

  const CLASSIC = [
    { gx: 0, gy: 0, gw: 2, gh: 1, role: "teal" },
    { gx: 2, gy: 0, gw: 1, gh: 1, role: "dots" },
    { gx: 3, gy: 0, gw: 1, gh: 1, role: "gold" },
    { gx: 0, gy: 1, gw: 1, gh: 2, role: "teal" },
    { gx: 1, gy: 1, gw: 1, gh: 1, role: "gold" },
    { gx: 1, gy: 2, gw: 1, gh: 1, role: "teal" },
    { gx: 2, gy: 1, gw: 2, gh: 2, role: "circle" },
    { gx: 0, gy: 3, gw: 2, gh: 1, role: "teal" },
    { gx: 2, gy: 3, gw: 1, gh: 1, role: "gold" },
    { gx: 3, gy: 3, gw: 1, gh: 1, role: "teal" },
  ];

  const ROUNDS = [
    {
      prompt: "第 1 题（倍比与缝隙）：下面四幅同样包含 10 个模块的 4×4 版面，只有一幅严格满足「整数倍模数 + 统一缝隙」，请凭眼力找出它。",
      answer: "B",
      options: [
        {
          key: "A",
          svg: makeSvg([
            { gx: 0, gy: 0, gw: 2, gh: 1, role: "teal", dw: 4 },
            { gx: 2, gy: 0, gw: 1, gh: 1, role: "dots", dx: 6, dw: -4 },
            { gx: 3, gy: 0, gw: 1, gh: 1, role: "gold", dx: 2, dw: -2 },
            { gx: 0, gy: 1, gw: 1, gh: 2, role: "teal", dy: 6, dh: -6 },
            { gx: 1, gy: 1, gw: 1, gh: 1, role: "gold", dx: -4, dy: -2 },
            { gx: 1, gy: 2, gw: 1, gh: 1, role: "teal", dx: -4, dy: 4, dh: -4 },
            { gx: 2, gy: 1, gw: 2, gh: 2, role: "circle", dx: 4, dw: -4 },
            { gx: 0, gy: 3, gw: 2, gh: 1, role: "teal", dy: -4, dh: 4 },
            { gx: 2, gy: 3, gw: 1, gh: 1, role: "gold", dx: 4 },
            { gx: 3, gy: 3, gw: 1, gh: 1, role: "teal", dx: 4, dw: -4 },
          ]),
          explain: "方案 A 内部缝隙混用了极窄（约 3px）和宽沟（约 15px），纵横通道断续不统一，破坏了间距一致性。",
        },
        {
          key: "B",
          svg: makeSvg(CLASSIC, { gapX: 8, gapY: 8 }),
          explain: "方案 B 正确！所有 10 块均严格取自同一 1×1 基准单元的整数倍（1×1、2×1、1×2、2×2），每一道纵横缝隙完全等宽，秩序与呼吸兼备。",
        },
        {
          key: "C",
          svg: makeSvg([
            { gx: 0, gy: 0, gw: 1.45, gh: 1, role: "teal" },
            { gx: 1.45, gy: 0, gw: 1.35, gh: 1, role: "dots" },
            { gx: 2.8, gy: 0, gw: 1.2, gh: 1, role: "gold" },
            { gx: 0, gy: 1, gw: 1, gh: 2, role: "teal" },
            { gx: 1, gy: 1, gw: 1.25, gh: 1, role: "gold" },
            { gx: 1, gy: 2, gw: 0.85, gh: 1, role: "teal" },
            { gx: 2.25, gy: 1, gw: 1.75, gh: 2, role: "circle" },
            { gx: 0, gy: 3, gw: 1.65, gh: 1, role: "teal" },
            { gx: 1.65, gy: 3, gw: 1.25, gh: 1, role: "gold" },
            { gx: 2.9, gy: 3, gw: 1.1, gh: 1, role: "teal" },
          ]),
          explain: "方案 C 虽然缝隙看似均匀，但行内每块用了 1.45u、1.25u、0.85u 等非整数散尺，上下竖缝全部错牙，丧失了可复用基准单元。",
        },
        {
          key: "D",
          svg: makeSvg([
            { gx: 0, gy: 0, gw: 2, gh: 1, role: "teal", dw: 8 },
            { gx: 2, gy: 0, gw: 1, gh: 1, role: "dots" },
            { gx: 3, gy: 0, gw: 1, gh: 1, role: "gold" },
            { gx: 0, gy: 1, gw: 1, gh: 2, role: "teal", dh: 8 },
            { gx: 1, gy: 1, gw: 1, gh: 1, role: "gold", dx: -8, dw: 8 },
            { gx: 1, gy: 2, gw: 1, gh: 1, role: "teal" },
            { gx: 2, gy: 1, gw: 2, gh: 2, role: "circle" },
            { gx: 0, gy: 3, gw: 2, gh: 1, role: "teal" },
            { gx: 2, gy: 3, gw: 1, gh: 1, role: "gold", dx: -8, dw: 8 },
            { gx: 3, gy: 3, gw: 1, gh: 1, role: "teal" },
          ]),
          explain: "方案 D 局部模块直接 0px 贴死粘连（左上与中下），而右侧仍留着 8px 缝隙，相邻同色块在无界处融成一块。",
        },
      ],
    },
    {
      prompt: "第 2 题（比例变化与焦点克制）：以下四幅均严格守住了整数倍模数与统一缝隙，但只有一幅在「体量对比」和「强调克制」上都成立。",
      answer: "C",
      options: [
        {
          key: "A",
          svg: makeSvg(
            Array.from({ length: 16 }, (_, i) => ({
              gx: i % 4,
              gy: Math.floor(i / 4),
              gw: 1,
              gh: 1,
              role: i === 5 || i === 10 ? "gold" : i === 2 ? "dots" : "teal",
            }))
          ),
          explain: "方案 A 虽严守整数格与等宽缝，但 16 块全员等大（面积比 1.00×），缺少跨格大小变化，视觉平淡无主次。",
        },
        {
          key: "B",
          svg: makeSvg(CLASSIC.map((t, i) => ({ ...t, role: i === 2 || i === 5 ? "teal" : "gold" }))),
          explain: "方案 B 保留了 2×2 与 1×1 的体量差，但超过 75% 的面积都刷成高光赭金，焦点过载导致主次重新拉平。",
        },
        {
          key: "C",
          svg: makeSvg([
            { gx: 0, gy: 0, gw: 2, gh: 2, role: "circle" },
            { gx: 2, gy: 0, gw: 2, gh: 1, role: "gold" },
            { gx: 2, gy: 1, gw: 1, gh: 1, role: "dots" },
            { gx: 3, gy: 1, gw: 1, gh: 2, role: "teal" },
            { gx: 0, gy: 2, gw: 1, gh: 1, role: "gold" },
            { gx: 1, gy: 2, gw: 2, gh: 1, role: "teal" },
            { gx: 0, gy: 3, gw: 2, gh: 1, role: "teal" },
            { gx: 2, gy: 3, gw: 1, gh: 1, role: "teal" },
            { gx: 3, gy: 3, gw: 1, gh: 1, role: "dots" },
          ]),
          explain: "方案 C 正确！2×2 主块、2×1 副块与 1×1 细节块拉开 4× 面积层级，同时把赭金克制在约四分之一面积，主次一目了然。",
        },
        {
          key: "D",
          svg: makeSvg([
            { gx: 0, gy: 0, gw: 4, gh: 3, role: "circle" },
            { gx: 0, gy: 3, gw: 1, gh: 1, role: "teal" },
            { gx: 1, gy: 3, gw: 1, gh: 1, role: "gold" },
            { gx: 2, gy: 3, gw: 1, gh: 1, role: "dots" },
            { gx: 3, gy: 3, gw: 1, gh: 1, role: "teal" },
          ]),
          explain: "方案 D 顶部单块 4×3 吞掉了 75% 版面，中层过渡完全消失，退化成「一大图配四格页脚」，失去模块组合的弹性。",
        },
      ],
    },
  ];

  let roundIdx = 0;
  const picked = [null, null];

  function render() {
    const r = ROUNDS[roundIdx];
    const choice = picked[roundIdx];
    promptEl.textContent = r.prompt;
    roundBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.qround) === roundIdx));

    gridEl.innerHTML = r.options
      .map((o) => {
        let stateCls = "";
        if (choice) {
          if (o.key === r.answer) stateCls = " is-correct";
          else if (o.key === choice) stateCls = " is-wrong";
          else stateCls = " is-dim";
        }
        return `<button type="button" class="quiz-opt${stateCls}" data-qopt="${o.key}" aria-pressed="${choice === o.key}">
          <span class="quiz-opt-head"><span>方案 ${o.key}</span>${choice && o.key === r.answer ? '<span class="quiz-tag-ok">正解</span>' : choice === o.key ? '<span class="quiz-tag-no">已选</span>' : ""}</span>
          ${o.svg}
        </button>`;
      })
      .join("");

    gridEl.querySelectorAll("[data-qopt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[roundIdx] = btn.dataset.qopt;
        render();
      });
    });

    if (!choice) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = "<p>请先凭眼力点击上方四幅版面中的一幅，再查看逐项几何拆解。</p>";
    } else {
      const ok = choice === r.answer;
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-err"}`;
      const items = r.options
        .map((o) => `<li class="${o.key === r.answer ? "is-ans" : ""}"><strong>方案 ${o.key}：</strong>${o.explain}</li>`)
        .join("");
      feedbackEl.innerHTML = `<p class="qf-lead">${ok ? `答对了！方案 ${r.answer} 是本轮唯一成立的模块系统。` : `你选了方案 ${choice}，本轮成立的是方案 ${r.answer}。`}</p><ul class="qf-list">${items}</ul>`;
    }
  }

  roundBtns.forEach((b) => b.addEventListener("click", () => { roundIdx = Number(b.dataset.qround); render(); }));
  render();
}

// ---------- 07 节：原海报灯箱（点击放大、缩放、拖拽平移、Esc 关闭） ----------
export function initPosterLightbox() {
  const trigger = document.getElementById("posterTrigger");
  const posterImg = document.getElementById("poster");
  const lightbox = document.getElementById("posterLightbox");
  const lbImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lbClose");
  const zoomInBtn = document.getElementById("lbZoomIn");
  const zoomOutBtn = document.getElementById("lbZoomOut");
  const resetBtn = document.getElementById("lbReset");
  if (!trigger || !posterImg || !lightbox || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });

  zoomInBtn?.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn?.addEventListener("click", () => { scale = Math.max(0.75, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } applyTransform(); });
  resetBtn?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    panning = { x: e.clientX - tx, y: e.clientY - ty };
    lbImg.setPointerCapture?.(e.pointerId);
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - panning.x;
    ty = e.clientY - panning.y;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { panning = null; });
  lbImg.addEventListener("pointercancel", () => { panning = null; });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) close();
  });
}
