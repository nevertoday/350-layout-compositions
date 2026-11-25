// 296 堆叠重排 · 02–08 节专属互动控件与原海报灯箱
import {
  ZOOM_LEVELS,
  ANATOMY_SPECS,
  analyzeSpacing,
  PIPELINE_STEPS,
  COMPARE_MODELS,
  COMPARE_FIELDS,
  COUNTER_SCENARIOS,
  QUIZ_CONFIG,
  QUIZ_OPTIONS,
  describeQuizOption,
} from "./model.js";
import { iconSvg } from "./stage.js";

const ANA_LOGICAL_W = 375;

// ================= 02 节：WCAG 2.1 400% 缩放重排阶梯镜 =================
export function initZoomStepper() {
  const btns = [...document.querySelectorAll("[data-zoom]")];
  const modeBtns = [...document.querySelectorAll("[data-zoom-mode]")];
  const frame = document.getElementById("zoom-viewport");
  const grid = document.getElementById("zoom-grid");
  const meta = document.getElementById("zoom-meta");
  const note = document.getElementById("zoom-note");
  if (!btns.length || !frame || !grid) return;

  let curZoom = 400; // 开局直接落在 WCAG 基准 400% (320px) + 锁死模式，直观看到为什么需要重排
  let reflowOn = false;

  function render() {
    const spec = ZOOM_LEVELS.find((z) => z.zoom === curZoom) || ZOOM_LEVELS[3];
    btns.forEach((b) => {
      const active = Number(b.dataset.zoom) === curZoom;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    modeBtns.forEach((b) => {
      const active = (b.dataset.zoomMode === "reflow") === reflowOn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    const pctMap = { 100: "100%", 200: "74%", 300: "54%", 400: "320px" };
    frame.style.maxWidth = pctMap[curZoom] || "100%";
    frame.dataset.mode = reflowOn ? "reflow" : "locked";
    grid.dataset.cols = reflowOn ? String(spec.cols) : "4";

    requestAnimationFrame(() => {
      const realOver = Math.max(0, Math.round(grid.scrollWidth - frame.clientWidth));
      if (meta) {
        meta.textContent = reflowOn
          ? `${spec.zoom}% 缩放 · 等效 ${spec.cssWidth} CSS px · ${spec.cols} 列 · 横向溢出 0 px（符合 SC 1.4.10）`
          : `${spec.zoom}% 缩放 · 等效 ${spec.cssWidth} CSS px · 强留 4 列 · 演示区超出 +${realOver} px`;
        meta.dataset.state = reflowOn || realOver === 0 ? "ok" : "warn";
      }
      if (note) note.textContent = spec.note;
    });
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      curZoom = Number(b.dataset.zoom);
      render();
    })
  );
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      reflowOn = b.dataset.zoomMode === "reflow";
      render();
    })
  );
  new ResizeObserver(() => render()).observe(frame);
  render();
}

// ================= 03 节：块内层级（固定 375px 逻辑视口 + 等比缩放，全尺寸读数完全一致） =================
export function initAnatomyBench() {
  const compBtns = [...document.querySelectorAll("[data-anatomy-comp]")];
  const modeBtns = [...document.querySelectorAll("[data-anatomy-mode]")];
  const scaleHost = document.getElementById("ana-scale-host");
  const viewport = document.getElementById("ana-viewport");
  const stage = document.getElementById("anatomy-stage");
  const badge = document.getElementById("anatomy-badge");
  const metric = document.getElementById("anatomy-metric");
  const why = document.getElementById("anatomy-why");
  if (!compBtns.length || !stage || !scaleHost || !viewport) return;

  let curComp = "card";
  let curMode = "squeeze"; // 开局非答案，先看块内挤坏

  function fitViewport() {
    const availW = scaleHost.clientWidth;
    if (availW <= 0) return;
    if (availW >= ANA_LOGICAL_W - 0.5) {
      viewport.style.transform = "";
      scaleHost.style.height = "";
    } else {
      const s = availW / ANA_LOGICAL_W;
      viewport.style.transform = `scale(${s.toFixed(4)})`;
      scaleHost.style.height = `${Math.ceil(viewport.offsetHeight * s)}px`;
    }
  }

  function measureContent() {
    const measEl = stage.querySelector("#ana-measure, .ana-input");
    if (measEl && metric) {
      // offsetWidth 读取的是未受 transform 缩放影响的 375px 逻辑布局宽，所有屏幕下完全一致
      const w = Math.round(measEl.offsetWidth);
      metric.textContent = `实测主内容区宽 ${w} px`;
    }
  }

  function render() {
    compBtns.forEach((b) => {
      const active = b.dataset.anatomyComp === curComp;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    modeBtns.forEach((b) => {
      const active = b.dataset.anatomyMode === curMode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    const spec = ANATOMY_SPECS[curComp];
    const m = spec.modes[curMode];
    stage.dataset.comp = curComp;
    stage.dataset.mode = curMode;

    if (curComp === "card") {
      stage.innerHTML = `
        <article class="ana-card ana-mode-${curMode}">
          <div class="ana-media" aria-hidden="true">
            <span class="ana-media-ico">${iconSvg("circle")}</span>
            <span class="ana-media-cap">配图区</span>
          </div>
          <div class="ana-head">
            <span class="ana-num" lang="en">01</span>
            <h4>夜间护眼阅读模式</h4>
          </div>
          <p class="ana-meta">版本 4.2 · 阅读设置</p>
          <p class="ana-text" id="ana-measure">开启后自动降低暖白纸面亮度，保留标题与正文的清晰阶梯。</p>
        </article>
      `;
    } else if (curComp === "form") {
      stage.innerHTML = `
        <form class="ana-form ana-mode-${curMode}" onsubmit="return false">
          <div class="ana-field">
            <label class="ana-label" for="ana-email">常用联系邮箱</label>
            <span class="ana-help">用于接收账单与安全提醒，不会公开展示</span>
            <input id="ana-email" class="ana-input" type="email" value="designer@studio.cn" autocomplete="off">
          </div>
          <div class="ana-field">
            <label class="ana-label" for="ana-team">所属团队名称</label>
            <span class="ana-help">显示在项目协作成员页顶部</span>
            <input id="ana-team" class="ana-input" type="text" value="基础体验设计组" autocomplete="off">
          </div>
        </form>
      `;
    } else {
      stage.innerHTML = `
        <div class="ana-price ana-mode-${curMode}">
          <div class="ana-p-title">
            <h4>团队专业版</h4>
            <p class="ana-p-val"><b lang="en">¥128</b><span>/ 席位 · 月</span></p>
          </div>
          <p class="ana-p-note">按年结算立减 20%，含增值税专用发票</p>
          <p class="ana-p-spec" id="ana-measure">不限项目数 · 90 天历史回溯 · 单点登录</p>
          <button type="button" class="ana-p-cta">选择团队版</button>
        </div>
      `;
    }

    if (badge) {
      badge.textContent = m.badge;
      badge.dataset.state = curMode === "titleFirst" ? "ok" : "warn";
    }
    if (why) why.textContent = m.why;

    fitViewport();
    measureContent();
    requestAnimationFrame(() => {
      fitViewport();
      measureContent();
    });
  }

  compBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curComp = b.dataset.anatomyComp;
      render();
    })
  );
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curMode = b.dataset.anatomyMode;
      render();
    })
  );
  new ResizeObserver(() => {
    fitViewport();
    measureContent();
  }).observe(scaleHost);
  render();
}

// ================= 04 节：格式塔双卡尺调节台（内外间距） =================
export function initSpacingCalipers() {
  const inSlider = document.getElementById("sp-inner");
  const outSlider = document.getElementById("sp-outer");
  const inVal = document.getElementById("sp-inner-val");
  const outVal = document.getElementById("sp-outer-val");
  const stack = document.getElementById("sp-stack");
  const svg = document.getElementById("sp-caliper-svg");
  const ratioOut = document.getElementById("sp-ratio");
  const zoneOut = document.getElementById("sp-zone");
  const whyOut = document.getElementById("sp-why");
  if (!inSlider || !outSlider || !stack || !svg) return;

  function drawCalipers(innerPad, outerGap, info) {
    const cards = [...stack.querySelectorAll(".sp-card")];
    if (cards.length < 2) return;
    const sr = stack.getBoundingClientRect();
    const h = Math.max(220, Math.round(sr.height));
    const w = 166;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.height = `${h}px`;

    const c0 = cards[0].getBoundingClientRect();
    const c1 = cards[1].getBoundingClientRect();
    const t0 = cards[0].querySelector(".sp-title").getBoundingClientRect();
    const b0 = cards[0].querySelector(".sp-body").getBoundingClientRect();

    const yInTop = t0.bottom - sr.top;
    const yInBot = b0.top - sr.top;
    const yGapTop = c0.bottom - sr.top;
    const yGapBot = c1.top - sr.top;

    const isBad = info.zone === "sticky";
    const isComfort = info.zone === "comfort";
    const gapColor = isBad ? "#C63B08" : isComfort ? "#235C38" : "#9E5311";

    let extraWarn = "";
    if (isBad) {
      const yBodyMid = (b0.top + b0.bottom) / 2 - sr.top;
      const t1 = cards[1].querySelector(".sp-title").getBoundingClientRect();
      const yTitle1Mid = (t1.top + t1.bottom) / 2 - sr.top;
      extraWarn = `
        <path d="M 88 ${yBodyMid.toFixed(1)} C 106 ${yBodyMid.toFixed(1)}, 106 ${yTitle1Mid.toFixed(1)}, 88 ${yTitle1Mid.toFixed(1)}"
              fill="none" stroke="#F35216" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="108" y="${((yBodyMid + yTitle1Mid) / 2 + 4).toFixed(1)}" fill="#B83606" font-size="11" font-weight="700">误粘成组</text>
      `;
    }

    svg.innerHTML = `
      <line x1="8" y1="${yInTop.toFixed(1)}" x2="22" y2="${yInTop.toFixed(1)}" stroke="#4A443E" stroke-width="1.2"/>
      <line x1="8" y1="${yInBot.toFixed(1)}" x2="22" y2="${yInBot.toFixed(1)}" stroke="#4A443E" stroke-width="1.2"/>
      <line x1="15" y1="${yInTop.toFixed(1)}" x2="15" y2="${yInBot.toFixed(1)}" stroke="#4A443E" stroke-width="1.5"/>
      <text x="26" y="${((yInTop + yInBot) / 2 + 4).toFixed(1)}" fill="#4A443E" font-size="11" font-family="Sora, sans-serif">内 ${innerPad}px</text>

      <rect x="4" y="${yGapTop.toFixed(1)}" width="80" height="${Math.max(2, yGapBot - yGapTop).toFixed(1)}" fill="${gapColor}" opacity="0.14"/>
      <line x1="6" y1="${yGapTop.toFixed(1)}" x2="22" y2="${yGapTop.toFixed(1)}" stroke="${gapColor}" stroke-width="1.5"/>
      <line x1="6" y1="${yGapBot.toFixed(1)}" x2="22" y2="${yGapBot.toFixed(1)}" stroke="${gapColor}" stroke-width="1.5"/>
      <line x1="14" y1="${yGapTop.toFixed(1)}" x2="14" y2="${yGapBot.toFixed(1)}" stroke="${gapColor}" stroke-width="2"/>
      <text x="26" y="${((yGapTop + yGapBot) / 2 + 4).toFixed(1)}" fill="${gapColor}" font-size="12" font-weight="700" font-family="Sora, sans-serif">外 ${outerGap}px</text>
      ${extraWarn}
    `;
  }

  function render() {
    const innerPad = Number(inSlider.value);
    const outerGap = Number(outSlider.value);
    const info = analyzeSpacing(innerPad, outerGap);

    if (inVal) inVal.textContent = `${innerPad} px`;
    if (outVal) outVal.textContent = `${outerGap} px`;

    stack.style.setProperty("--sp-inner", `${innerPad}px`);
    stack.style.setProperty("--sp-outer", `${outerGap}px`);
    stack.dataset.zone = info.zone;

    if (ratioOut) ratioOut.textContent = `${info.outerGap} ÷ ${info.innerPad} = ${info.ratioText}`;
    if (zoneOut) {
      zoneOut.textContent = info.label;
      zoneOut.dataset.zone = info.zone;
    }
    if (whyOut) whyOut.textContent = info.why;

    requestAnimationFrame(() => drawCalipers(innerPad, outerGap, info));
  }

  inSlider.addEventListener("input", render);
  outSlider.addEventListener("input", render);
  new ResizeObserver(() => render()).observe(stack);
  render();
}

// ================= 05 节：原海报 ①→②→③→④ 渐进修复勾选链 =================
export function initPipelineSteps() {
  const checks = [...document.querySelectorAll("[data-pipe-step]")];
  const preview = document.getElementById("pipe-preview");
  const cssBox = document.getElementById("pipe-css");
  const statusEl = document.getElementById("pipe-status");
  if (!checks.length || !preview) return;

  function render() {
    const active = new Set(checks.filter((c) => c.checked).map((c) => Number(c.dataset.pipeStep)));
    preview.dataset.s1 = String(active.has(1));
    preview.dataset.s2 = String(active.has(2));
    preview.dataset.s3 = String(active.has(3));
    preview.dataset.s4 = String(active.has(4));

    const items = active.has(1)
      ? [
          { n: "01", t: "本月结算总额", b: "¥ 18,420（核心任务置顶）", shape: "circle" },
          { n: "02", t: "待处理发票", b: "3 张将在周五前到期", shape: "triangle" },
          { n: "03", t: "历史明细", b: "支持导出 CSV 对账单", shape: "square" },
          { n: "04", t: "开票说明", b: "常见税务口径与联系入口", shape: "bars" },
        ]
      : [
          { n: "04", t: "开票说明", b: "常见税务口径与联系入口", shape: "bars" },
          { n: "03", t: "历史明细", b: "支持导出 CSV 对账单", shape: "square" },
          { n: "01", t: "本月结算总额", b: "¥ 18,420（核心被压在后面）", shape: "circle" },
          { n: "02", t: "待处理发票", b: "3 张将在周五前到期", shape: "triangle" },
        ];

    preview.innerHTML = items
      .map(
        (it) => `
      <div class="pipe-item">
        <span class="pipe-ico">${iconSvg(it.shape)}</span>
        <div class="pipe-copy">
          <strong><em lang="en">${it.n}</em> ${it.t}</strong>
          <span>${it.b}</span>
        </div>
      </div>`
      )
      .join("");

    const cssParts = PIPELINE_STEPS.filter((s) => active.has(s.id)).map((s) => s.css);
    if (cssBox) {
      cssBox.textContent = cssParts.length
        ? cssParts.join("\n\n")
        : "/* 尚未勾选任何步骤：宽屏内容混排挤在窄视口中 */\n.raw-row { display: flex; flex-wrap: nowrap; }";
    }
    if (statusEl) {
      statusEl.textContent =
        active.size === 0
          ? "当前：原始未改造状态（顺序颠倒、未分模块、横向互挤、间距无序）。依次勾选 ①→④ 看看界面如何落地。"
          : `已完成 ${active.size} / 4 步：${PIPELINE_STEPS.filter((s) => active.has(s.id))
              .map((s) => `${s.num}${s.title}`)
              .join(" → ")}`;
    }
  }

  checks.forEach((c) => c.addEventListener("change", render));
  render();
}

// ================= 06 节：什么时候别硬套堆叠（四场景反例双面翻切器） =================
export function initCounterExamples() {
  const tabBtns = [...document.querySelectorAll("[data-ce-scene]")];
  const flipBtns = [...document.querySelectorAll("[data-ce-mode]")];
  const stage = document.getElementById("ce-stage");
  const titleEl = document.getElementById("ce-title");
  const whyEl = document.getElementById("ce-why");
  if (!tabBtns.length || !stage) return;

  let curScene = "table";
  let curMode = "bad"; // 先看硬套堆叠的问题，再翻看更稳替代

  function render() {
    const sc = COUNTER_SCENARIOS[curScene];
    tabBtns.forEach((b) => {
      const active = b.dataset.ceScene === curScene;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    flipBtns.forEach((b) => {
      const active = b.dataset.ceMode === curMode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    if (titleEl) {
      titleEl.textContent = curMode === "bad" ? sc.badLabel : sc.goodLabel;
      titleEl.dataset.mode = curMode;
    }
    if (whyEl) whyEl.textContent = curMode === "bad" ? sc.badWhy : sc.goodWhy;
    stage.dataset.scene = curScene;
    stage.dataset.mode = curMode;

    if (curScene === "table") {
      if (curMode === "bad") {
        const cardsHtml = COMPARE_MODELS.map(
          (m) => `
          <div class="ce-st-card">
            <strong>${m.name}</strong>
            ${COMPARE_FIELDS.map((f) => `<span>${f.label}：${m[f.key]}</span>`).join("")}
          </div>`
        ).join("");
        stage.innerHTML = `
          <div class="ce-stacked-table">
            ${cardsHtml}
            <p class="ce-cap-warn">想比 Air 与 Pro 的「重量」，视线要跨过中间 Base 卡片的 5 行文字来回找。</p>
          </div>
        `;
      } else {
        const headCols = COMPARE_MODELS.map((m) => `<th>${m.short}</th>`).join("");
        const bodyRows = COMPARE_FIELDS.map(
          (f) => `<tr><th>${f.label}</th>${COMPARE_MODELS.map((m) => `<td>${m[f.key]}</td>`).join("")}</tr>`
        ).join("");
        stage.innerHTML = `
          <div class="ce-table-wrap" tabindex="0" aria-label="首列锁定、可横向滚动的参数对比表">
            <table class="ce-table">
              <thead><tr><th>参数</th>${headCols}</tr></thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
          <p class="ce-scroll-tip">← 左列参数名 sticky 锁在左缘，右列横滑时重量 / 续航 / 屏幕 / 内存始终对齐同一横行 →</p>
        `;
      }
    } else if (curScene === "map") {
      stage.innerHTML =
        curMode === "bad"
          ? `<div class="ce-map-bad">
               <div class="ce-list-row"><b>01 槐树咖啡</b><span>距离 280 m · 路东</span></div>
               <div class="ce-list-row"><b>02 南门烘焙</b><span>距离 310 m · 需过天桥</span></div>
               <div class="ce-list-row"><b>03 纸页书店</b><span>距离 340 m · 巷口右转</span></div>
               <p class="ce-cap-warn">只看纵向列表，完全不知道三家店分别在十字路口的哪一角。</p>
             </div>`
          : `<div class="ce-map-good">
               <svg viewBox="0 0 320 156" class="ce-map-svg" aria-hidden="true">
                 <rect width="320" height="156" fill="#F4ECE0"/>
                 <path d="M0 78H320M154 0V156" stroke="#FFFDF9" stroke-width="14"/>
                 <path d="M0 78H320M154 0V156" stroke="#DFD5C7" stroke-width="1" stroke-dasharray="6 4"/>
                 <circle cx="96" cy="48" r="9" fill="#F35216"/><text x="110" y="52" fill="#0F0F0E" font-size="11" font-weight="700">01 槐树</text>
                 <circle cx="218" cy="44" r="9" fill="#4A443E"/><text x="232" y="48" fill="#0F0F0E" font-size="11">02 南门</text>
                 <circle cx="204" cy="116" r="9" fill="#4A443E"/><text x="218" y="120" fill="#0F0F0E" font-size="11">03 纸页</text>
                 <circle cx="154" cy="78" r="5" fill="#0F0F0E"/>
               </svg>
               <div class="ce-bottom-sheet"><strong>已选中：01 槐树咖啡</strong><span>步行 4 分钟 · 十字路口西北角</span></div>
             </div>`;
    } else if (curScene === "filters") {
      stage.innerHTML =
        curMode === "bad"
          ? `<div class="ce-filter-bad">
               <div class="ce-f-block"><span>分类</span><b>全部 / 桌面 / 随身 / 配件</b></div>
               <div class="ce-f-block"><span>价格区间</span><b>¥0–199 / ¥200–499 / ¥500+</b></div>
               <div class="ce-f-block"><span>配送与库存</span><b>次日达 · 仅看有货 · 自营</b></div>
               <div class="ce-f-block"><span>材质颜色</span><b>雾白 / 暖灰 / 曜黑 / 铝灰</b></div>
               <div class="ce-f-cut">↓ 真正要看的商品列表被顶出了首屏 ↓</div>
             </div>`
          : `<div class="ce-filter-good">
               <div class="ce-f-bar"><span>筛选条件（已选 2 项）</span><b class="ce-f-pill">展开抽屉 <svg viewBox="0 0 14 10" width="12" height="9" style="display:inline-block;vertical-align:middle;margin-left:3px" aria-hidden="true"><path d="M1 1.5h12M1 5h12M1 8.5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></b></div>
               <div class="ce-prod-row"><span class="ce-dot"></span><div><strong>轻铝桌面支架</strong><p>¥249 · 现货次日达</p></div></div>
               <div class="ce-prod-row"><span class="ce-dot"></span><div><strong>静音机械小键盘</strong><p>¥389 · 现货次日达</p></div></div>
             </div>`;
    } else {
      stage.innerHTML =
        curMode === "bad"
          ? `<div class="ce-split-bad">
               <div class="ce-pane-box"><span class="ce-pane-tag">上方 · 源码（滚完还要继续滚）</span><code># 标题&#10;这里修改一段说明文字……</code></div>
               <div class="ce-pane-box"><span class="ce-pane-tag">下方 · 预览（离光标隔着整屏）</span><p>改完一句就得往下滑确认，再滑回去找行号。</p></div>
             </div>`
          : `<div class="ce-split-good">
               <div class="ce-pane-tabs"><span class="is-on">编辑源码</span><span>即时预览</span></div>
               <div class="ce-pane-body"><code># 标题&#10;单手一键切换对照，光标位置原地保留。</code></div>
             </div>`;
    }
  }

  tabBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curScene = b.dataset.ceScene;
      curMode = "bad";
      render();
    })
  );
  flipBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curMode = b.dataset.ceMode;
      render();
    })
  );
  render();
}

// ================= 07 节：小练习（严格单变量考「节奏一致」，手机端 2×2 同比例缩略同屏对照） =================
export function initPracticeQuiz() {
  const grid = document.getElementById("quiz-grid");
  const verdictBox = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("quiz-v-title");
  const vText = document.getElementById("quiz-v-text");
  const btnReset = document.getElementById("quiz-reset");
  if (!grid || !verdictBox) return;

  const opts = QUIZ_OPTIONS.map(describeQuizOption);
  let chosenId = null;

  function render() {
    const revealed = chosenId !== null;
    grid.dataset.revealed = String(revealed);

    grid.innerHTML = opts
      .map((opt) => {
        const isChosen = chosenId === opt.id;
        let cls = "quiz-card";
        if (revealed) {
          if (opt.correct) cls += " is-correct";
          else if (isChosen) cls += " is-wrong";
        }
        // 使用 CSS 变量 --gap 配合 --q-scale，桌面 1:1 真实像素，手机 2×2 等比缩略保证四图同屏可比
        const gapHtml = (px, idx) =>
          revealed
            ? `<div class="q-gap${idx === 1 && !opt.correct ? " is-odd" : ""}" style="--gap:${px}px"><span>${px}px</span></div>`
            : `<div class="q-gap" style="--gap:${px}px"></div>`;

        const modsHtml = QUIZ_CONFIG.modules
          .map((m, i) => {
            const card = `
              <div class="q-mod" style="--pad:${QUIZ_CONFIG.innerPad}px">
                <div class="q-mod-head">
                  <b class="q-num" lang="en">${m.num}</b>
                  <span class="q-m-title">${m.title}</span>
                  <span class="q-m-ico">${iconSvg(m.shape)}</span>
                </div>
                <span class="q-m-sub">${m.sub}</span>
              </div>`;
            if (i < 3) return card + gapHtml(opt.gaps[i], i);
            return card;
          })
          .join("");

        return `
          <button type="button" class="${cls}" data-quiz-opt="${opt.id}" aria-pressed="${isChosen}">
            <span class="q-phone" aria-hidden="true">${modsHtml}</span>
            <span class="q-foot">
              <strong class="q-letter" lang="en">${opt.id}</strong>
              ${revealed ? `<span class="q-reveal-tag">${opt.gapSeqText}</span>` : ""}
            </span>
          </button>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        chosenId = btn.dataset.quizOpt;
        render();
      });
    });

    if (!revealed) {
      verdictBox.dataset.state = "idle";
      if (vTitle) vTitle.textContent = "先凭眼睛选一版。";
      if (vText) vText.textContent = "四张图的块内距都是 12px，01–02 与 03–04 间距也完全一样，只差中间 02–03 这一道缝。选完后四张图会同时亮出三道实测间距。";
      if (btnReset) btnReset.hidden = true;
    } else {
      const picked = opts.find((o) => o.id === chosenId);
      const ans = opts.find((o) => o.correct);
      verdictBox.dataset.state = picked.correct ? "correct" : "wrong";
      if (vTitle) {
        vTitle.textContent = picked.correct
          ? `答案 ${ans.id} 正确 · ${ans.gapSeqText}（${ans.groupNote}）`
          : `你选了 ${picked.id}（${picked.gapSeqText}，${picked.deltaText}）· 正确答案是 ${ans.id}（${ans.gapSeqText}）`;
      }
      if (vText) vText.textContent = picked.reason;
      if (btnReset) btnReset.hidden = false;
    }
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      chosenId = null;
      render();
    });
  }

  const quizSection = document.getElementById("sec-practice");
  if (quizSection) {
    quizSection.addEventListener("keydown", (e) => {
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx >= 0 && opts[idx]) {
        chosenId = opts[idx].id;
        render();
      }
    });
  }

  render();
}

// ================= 08 节：原海报灯箱（放大、拖拽、Esc 关闭） =================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const dlg = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const btnClose = document.getElementById("lb-close");
  const scaleOut = document.getElementById("lb-scale");
  if (!openBtn || !posterImg || !dlg || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = null;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (scaleOut) scaleOut.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dlg.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (btnClose) btnClose.focus();
  }

  function close() {
    if (dlg.hidden) return;
    dlg.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  if (btnClose) btnClose.addEventListener("click", close);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target === lbStage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dlg.hidden) close();
  });

  if (btnIn)
    btnIn.addEventListener("click", () => {
      scale = Math.min(3, +(scale + 0.35).toFixed(2));
      applyTransform();
    });
  if (btnOut)
    btnOut.addEventListener("click", () => {
      scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    });
  if (btnReset)
    btnReset.addEventListener("click", () => {
      scale = 1;
      tx = 0;
      ty = 0;
      applyTransform();
    });

  if (lbStage) {
    lbStage.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const next = scale + (e.deltaY < 0 ? 0.18 : -0.18);
        scale = Math.max(0.75, Math.min(3.2, +next.toFixed(2)));
        applyTransform();
      },
      { passive: false }
    );

    lbImg.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try {
        lbImg.setPointerCapture(e.pointerId);
      } catch {}
      dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, tx, ty };
      lbImg.classList.add("is-grabbing");
    });
    lbImg.addEventListener("pointermove", (e) => {
      if (!dragging || dragging.id !== e.pointerId) return;
      tx = dragging.tx + (e.clientX - dragging.x);
      ty = dragging.ty + (e.clientY - dragging.y);
      applyTransform();
    });
    const endPan = (e) => {
      if (!dragging || dragging.id !== e.pointerId) return;
      dragging = null;
      lbImg.classList.remove("is-grabbing");
    };
    lbImg.addEventListener("pointerup", endPan);
    lbImg.addEventListener("pointercancel", endPan);
  }
}
