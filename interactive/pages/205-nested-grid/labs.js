// 205 嵌套网格 — 正文七节独立交互实验 + 原海报灯箱
// 保证相邻两节绝不复用同一种交互形式：
// 01 四层等轴炸裂滑轨 | 02 真实DOM外/内缝步进器 | 03 暗室独立grid vs subgrid压测
// 04 原海报三实景×断点透视 | 05 半世纪历史SVG标本 | 06 套娃深度像素耗损计 | 07 三轮单变量测验+灯箱

// ---------- 01：四层拆解等轴炸裂视图 ----------
export function initCascadeLab() {
  const root = document.getElementById("lab-cascade");
  if (!root) return;
  const slider = root.querySelector("#cascade-explode");
  const valEl = root.querySelector("#cascade-explode-val");
  const btns = [...root.querySelectorAll("[data-step]")];
  const layers = [...root.querySelectorAll(".iso-layer")];
  const noteTitle = root.querySelector("#cascade-title");
  const noteBody = root.querySelector("#cascade-body");
  const noteQuote = root.querySelector("#cascade-quote");

  const STEPS = {
    1: {
      title: "第 1 层 · 先定父网格（整体骨架）",
      quote: "原海报建议：「先定父网格——确定列数、边距与间距，建立稳定的骨架。」",
      body: "12 列竖向轨道与左右安全边距先落定。它不关心里面装图文还是商品，只负责给全页立起统一的对齐基准线和外缝节拍。",
      explode: 24,
    },
    2: {
      title: "第 2 层 · 再建子模块（功能分区）",
      quote: "原海报建议：「再建子模块——在父单元内划分区域，明确功能与优先级。」",
      body: "把 12 列按信息权重切成头图通栏（12 列）、主内容区（8 列）、侧栏区（4 列）与底部分组区（4×3 列）。所有区界严严实实踩在父列线上。",
      explode: 52,
    },
    3: {
      title: "第 3 层 · 深入局部网格（微观秩序）",
      quote: "原海报建议：「深入局部网格——为每个区域设定子网格，保证细节秩序。」",
      body: "主区内部建 3 列虚线子网放图卡，侧栏内部建 2 列实线子网放参数表。两区密度不同，却共享外宽内紧的间距倍率。",
      explode: 78,
    },
    4: {
      title: "第 4 层 · 最后填充内容（信息落位）",
      quote: "原海报建议：「最后填充内容——按逻辑组织内容，保持一致的视觉语言。」",
      body: "文字、图片、主按钮与保障图标落入对应的子格。如果反过来「先堆内容再补格子」，每个模块就会长出各自为战的零散边距。",
      explode: 100,
    },
  };

  let activeStep = 4;

  function render() {
    const exp = Number(slider.value);
    valEl.textContent = exp === 0 ? "叠合成页 0%" : `四层展开 ${exp}%`;
    const gapY = (exp / 100) * 76;
    const shiftX = (exp / 100) * 14;
    const tilt = (exp / 100) * 1;
    layers.forEach((el, idx) => {
      const layerNum = idx + 1;
      // 底层在最下，顶层在最上，带轻微斜向阶梯展开让四枚层标完整可见
      const offsetY = (3 - idx) * gapY - 1.5 * gapY;
      const offsetX = (idx - 1.5) * shiftX;
      const visible = layerNum <= activeStep;
      el.style.transform = `translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px) scaleY(${(1 - 0.14 * tilt).toFixed(3)})`;
      el.classList.toggle("is-dim", !visible);
      el.classList.toggle("is-active", layerNum === activeStep);
    });
    btns.forEach((b) => {
      const on = Number(b.dataset.step) === activeStep;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const info = STEPS[activeStep];
    noteTitle.textContent = info.title;
    noteQuote.textContent = info.quote;
    noteBody.textContent = info.body;
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      activeStep = Number(b.dataset.step);
      if (Number(slider.value) < 35) slider.value = String(STEPS[activeStep].explode);
      render();
    })
  );
  slider.addEventListener("input", render);
  render();
}

// ---------- 02：父子间距比真实 DOM 对照器 ----------
export function initGutterLab() {
  const root = document.getElementById("lab-gutter");
  if (!root) return;
  const stage = root.querySelector("#gutter-stage");
  const outerVal = root.querySelector("#g-outer-val");
  const innerVal = root.querySelector("#g-inner-val");
  const padVal = root.querySelector("#g-pad-val");
  const ratioEl = root.querySelector("#g-ratio-read");
  const verdictTag = root.querySelector("#g-verdict-tag");
  const verdictHead = root.querySelector("#g-verdict-head");
  const verdictBody = root.querySelector("#g-verdict-body");
  const cssOut = root.querySelector("#g-css-out");
  const borderToggle = root.querySelector("#g-show-box");

  const st = { outer: 8, inner: 24, pad: 10, showBox: false };

  function update() {
    stage.style.setProperty("--g-outer", `${st.outer}px`);
    stage.style.setProperty("--g-inner", `${st.inner}px`);
    stage.style.setProperty("--g-pad", `${st.pad}px`);
    stage.classList.toggle("show-bounds", st.showBox);

    outerVal.textContent = `${st.outer}px`;
    innerVal.textContent = `${st.inner}px`;
    padVal.textContent = `${st.pad}px`;
    const ratio = +(st.outer / Math.max(1, st.inner)).toFixed(2);
    ratioEl.textContent = `${ratio}×`;

    let tone = "ok";
    let tag = "外宽内紧 · 归属清晰";
    let head = `外缝 ${st.outer}px 是内缝 ${st.inner}px 的 ${ratio} 倍，不画框线也能一眼分出左右两组`;
    let body = "按格式塔邻近性规律，组内卡片靠得更近、跨区通道更宽，大脑瞬间把左四卡归为模块 A、右四卡归为模块 B。经验上把外/内缝比控制在 1.5×–2.5× 最省力。";

    if (st.outer < st.inner) {
      tone = "err";
      tag = "间距倒挂 · 跨区串组";
      head = `内缝 ${st.inner}px 宽过外缝 ${st.outer}px，中间两列卡片已经粘成一组`;
      body = `关掉底框最能说明问题：模块 A 右边两张卡离模块 B 左边两张卡只有 ${st.outer + st.pad * 2}px 视觉跨度（净外缝 ${st.outer}px），反而比各自同组邻居（${st.inner}px）更近，父级分组彻底失效。`;
    } else if (st.outer < 12 || st.inner < 6) {
      tone = "err";
      tag = "间距粘连 · 缺少呼吸";
      head = "外缝或内缝压得太死，卡片边缘几乎顶在一起";
      body = "过窄的缝隙让模块缺少呼吸空间，文字扫视时视线容易直接跳行串卡。建议内缝至少 8px、外缝至少 16px。";
    } else if (st.outer === st.inner) {
      tone = "warn";
      tag = "内外等宽 · 边界模糊";
      head = `外缝与内缝同为 ${st.outer}px，八张卡看起来像一块平铺的 4×2 矩阵`;
      body = "当外缝不大于内缝时，如果没有额外的底色或边框，读者看不出「模块 A」和「模块 B」是两个独立父区。试着把外缝再加大一档。";
    }

    verdictTag.className = `badge badge--${tone}`;
    verdictTag.textContent = tag;
    verdictHead.textContent = head;
    verdictBody.textContent = body;
    stage.dataset.tone = tone;
    cssOut.textContent =
`.parent-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${st.outer}px;
}
.child-module {
  padding: ${st.pad}px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${st.inner}px;
}`;
  }

  root.querySelectorAll("[data-step-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.stepKey;
      const d = Number(btn.dataset.delta);
      const limits = { outer: [4, 48], inner: [4, 40], pad: [0, 24] };
      const [lo, hi] = limits[k];
      st[k] = Math.max(lo, Math.min(hi, st[k] + d));
      update();
    });
  });

  root.querySelectorAll("[data-g-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [o, i, p] = btn.dataset.gPreset.split(",").map(Number);
      st.outer = o;
      st.inner = i;
      st.pad = p;
      update();
    });
  });

  borderToggle.addEventListener("click", () => {
    st.showBox = !st.showBox;
    borderToggle.setAttribute("aria-pressed", String(st.showBox));
    borderToggle.textContent = st.showBox ? "隐藏父区底框" : "显露父区底框";
    update();
  });

  update();
}

// ---------- 03：深墨绿暗室 — 独立嵌套 grid vs 继承 subgrid ----------
export function initSubgridLab() {
  const root = document.getElementById("lab-subgrid");
  if (!root) return;
  const grid = root.querySelector("#sg-demo");
  const titleMid = root.querySelector("#sg-mid-title");
  const modeBtns = [...root.querySelectorAll("[data-sg-mode]")];
  const titleBtn = root.querySelector("#sg-toggle-title");
  const explain = root.querySelector("#sg-explain");
  const code = root.querySelector("#sg-code");

  const st = { mode: "nested", longTitle: true };

  function update() {
    grid.classList.toggle("is-subgrid", st.mode === "subgrid");
    titleMid.textContent = st.longTitle
      ? "父网格定宏观边界，局部子网承接图文与参数表的多层信息密度"
      : "局部秩序与节奏";
    titleBtn.setAttribute("aria-pressed", String(st.longTitle));
    titleBtn.textContent = st.longTitle ? "改回单行短标题" : "给第 2 卡加长标题";
    modeBtns.forEach((b) => {
      const on = b.dataset.sgMode === st.mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    if (st.mode === "nested") {
      explain.textContent = st.longTitle
        ? "独立嵌套（display: grid）：三张卡各自管自己的行高。第 2 张卡标题撑成三行，它的配图与底栏就单独往下沉，和左右两卡脱线——但当左右两区本来就结构迥异（例如左图库 3 列 + 右参数 2 列）时，这种独立性正是嵌套网格的优势。"
        : "独立嵌套在三张卡字数一样时看起来很齐，一旦真实业务里出现长短标题，各卡内部轨道互不知情，横向立刻高低错落。";
      code.textContent =
`.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card {
  display: grid;
  grid-template-rows: auto auto 1fr auto; /* 独立轨道 */
}`;
    } else {
      explain.textContent = st.longTitle
        ? "继承子网（grid-template-rows: subgrid）：三张卡共享父网格的 4 条行轨。第 2 张卡标题撑高时，左右两张卡的标题行自动同步等高，配图基线与底栏按钮严丝合缝拉成一条水平线。"
        : "开启 subgrid 后，即便文字长度变化，跨卡横向基线仍然锁死在同一套父级行轨上。详细语法见 206 子网格。";
      code.textContent =
`.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card {
  display: grid;
  grid-row: span 4;
  grid-template-rows: subgrid; /* 继承父轨 */
}`;
    }
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.mode = b.dataset.sgMode;
      update();
    })
  );
  titleBtn.addEventListener("click", () => {
    st.longTitle = !st.longTitle;
    update();
  });
  update();
}

// ---------- 04：原海报三大实用示例 × 断点 × 父子透视 ----------
export function initExamplesLab() {
  const root = document.getElementById("lab-examples");
  if (!root) return;
  const sceneBtns = [...root.querySelectorAll("[data-ex-scene]")];
  const bpBtns = [...root.querySelectorAll("[data-ex-bp]")];
  const toggleParent = root.querySelector("#ex-ov-parent");
  const toggleChild = root.querySelector("#ex-ov-child");
  const viewport = root.querySelector("#ex-viewport");
  const specParent = root.querySelector("#ex-spec-parent");
  const specChild = root.querySelector("#ex-spec-child");
  const specLocal = root.querySelector("#ex-spec-local");
  const specEffect = root.querySelector("#ex-spec-effect");
  const colIndicator = root.querySelector("#ex-col-indicator");

  const SPECS = {
    news: {
      parent: "12 列（平板收束 8 列 · 手机收束 4 列）",
      child: "头图区 / 主体区 / 侧边区 / 底部区",
      local: "文本列宽与图片比例统一，主区 3 列卡网配侧栏单列摘要",
      effect: "信息清晰，节奏分明。",
    },
    course: {
      parent: "12 列（平板收束 8 列 · 手机收束 4 列）",
      child: "头部 / 亮点区 / 内容区 / 底部区",
      local: "亮点图标（01 / 02 / 03）与文案按 3 列子网对齐排列",
      effect: "重点突出，结构稳定。",
    },
    shop: {
      parent: "12 列（平板收束 8 列 · 手机收束 4 列）",
      child: "左图区 / 右侧区 / 信息详情区 / 保障区",
      local: "信息块间距与对齐系统统一，底沿 4 枚保障徽章整除父列",
      effect: "浏览路径清晰，转化效率高。",
    },
  };

  const st = { scene: "news", bp: "desktop", ovParent: true, ovChild: true };

  function update() {
    viewport.dataset.scene = st.scene;
    viewport.dataset.bp = st.bp;
    viewport.classList.toggle("ov-parent", st.ovParent);
    viewport.classList.toggle("ov-child", st.ovChild);

    sceneBtns.forEach((b) => {
      const on = b.dataset.exScene === st.scene;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    bpBtns.forEach((b) => {
      const on = b.dataset.exBp === st.bp;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    toggleParent.setAttribute("aria-pressed", String(st.ovParent));
    toggleParent.classList.toggle("is-on", st.ovParent);
    toggleChild.setAttribute("aria-pressed", String(st.ovChild));
    toggleChild.classList.toggle("is-on", st.ovChild);

    const sp = SPECS[st.scene];
    specParent.textContent = sp.parent;
    specChild.textContent = sp.child;
    specLocal.textContent = sp.local;
    specEffect.textContent = sp.effect;
    const cols = st.bp === "desktop" ? 12 : st.bp === "tablet" ? 8 : 4;
    colIndicator.textContent = `当前父网格：${cols} 列 · ${st.bp === "mobile" ? "父区纵排，仅保留轻量 2 列局部子网" : "父子双层并排"}`;

    // 同步父网格透视条数量
    const strip = viewport.querySelector(".ex-parent-overlay");
    if (strip && strip.children.length !== cols) {
      strip.innerHTML = Array.from({ length: cols }, (_, i) => `<span>${i + 1}</span>`).join("");
    }
  }

  sceneBtns.forEach((b) => b.addEventListener("click", () => { st.scene = b.dataset.exScene; update(); }));
  bpBtns.forEach((b) => b.addEventListener("click", () => { st.bp = b.dataset.exBp; update(); }));
  toggleParent.addEventListener("click", () => { st.ovParent = !st.ovParent; update(); });
  toggleChild.addEventListener("click", () => { st.ovChild = !st.ovChild; update(); });
  update();
}

// ---------- 05：半个世纪的嵌套演化（可点击时代卡片联动 SVG 标本） ----------
export function initHistoryLab() {
  const root = document.getElementById("lab-history");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-era]")];
  const svgBox = root.querySelector("#era-svg");
  const eraMeta = root.querySelector("#era-meta");
  const eraDesc = root.querySelector("#era-desc");

  const ERAS = {
    gerstner: {
      meta: "1962–1964 · Karl Gerstner ·《Designing Programmes》",
      desc: "瑞士设计师卡尔·格斯特纳为德国财经杂志《Capital》设计的 58 单位活动网格：外框共 58 个基本单位（10pt 基准），中间固定 2 单位栏距，可无损细分成 1、2、3、4、5、6 列，让同一张母网格承载截然不同的局部信息密度。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <rect x="14" y="16" width="332" height="158" fill="#FAF5EC" stroke="#121C17" stroke-width="1.3"/>
        <text x="20" y="32" font-family="DM Mono,monospace" font-size="10" fill="#0E4836">58 UNITS PARENT SPAN · GUTTER = 2u</text>
        <g fill="#E3E2D0" stroke="#0E4836" stroke-width="0.9">
          <rect x="20" y="42" width="156" height="22"/><rect x="184" y="42" width="156" height="22"/>
          <rect x="20" y="72" width="102" height="24" fill="#F2D2B6"/><rect x="129" y="72" width="102" height="24" fill="#F2D2B6"/><rect x="238" y="72" width="102" height="24" fill="#F2D2B6"/>
          <rect x="20" y="104" width="74" height="24"/><rect x="102" y="104" width="74" height="24"/><rect x="184" y="104" width="74" height="24"/><rect x="266" y="104" width="74" height="24"/>
          <rect x="20" y="136" width="47" height="26" fill="#D35D2D" fill-opacity="0.28"/><rect x="74" y="136" width="47" height="26" fill="#D35D2D" fill-opacity="0.28"/><rect x="128" y="136" width="47" height="26" fill="#D35D2D" fill-opacity="0.28"/><rect x="182" y="136" width="47" height="26" fill="#D35D2D" fill-opacity="0.28"/><rect x="236" y="136" width="47" height="26" fill="#D35D2D" fill-opacity="0.28"/><rect x="290" y="136" width="50" height="26" fill="#D35D2D" fill-opacity="0.28"/>
        </g>
        <text x="336" y="57" text-anchor="end" font-family="DM Mono,monospace" font-size="10" fill="#121C17">2 col</text>
        <text x="336" y="88" text-anchor="end" font-family="DM Mono,monospace" font-size="10" fill="#121C17">3 col</text>
        <text x="336" y="120" text-anchor="end" font-family="DM Mono,monospace" font-size="10" fill="#121C17">4 col</text>
        <text x="336" y="153" text-anchor="end" font-family="DM Mono,monospace" font-size="10" fill="#A33D14">6 col</text>
      </svg>`,
    },
    jmb: {
      meta: "1981 · Josef Müller-Brockmann ·《Grid Systems in Graphic Design》",
      desc: "米勒-布罗克曼在 Niggli Verlag 出版的经典手册把瑞士网格系统化为 8 到 32 个网格田（grid fields），示范了如何在同一套父级边距和行距纪律内组合大跨度图片区与高密度正文注栏。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <rect x="14" y="16" width="332" height="158" fill="#FAF5EC" stroke="#121C17" stroke-width="1.3"/>
        <text x="20" y="32" font-family="DM Mono,monospace" font-size="10" fill="#0E4836">8–32 GRID FIELDS · SWISS SYSTEM</text>
        <g stroke="#9AA28E" stroke-dasharray="3 2" fill="none">
          <rect x="20" y="42" width="74" height="58"/><rect x="102" y="42" width="74" height="58"/><rect x="184" y="42" width="74" height="58"/><rect x="266" y="42" width="74" height="58"/>
          <rect x="20" y="108" width="74" height="56"/><rect x="102" y="108" width="74" height="56"/><rect x="184" y="108" width="74" height="56"/><rect x="266" y="108" width="74" height="56"/>
        </g>
        <rect x="20" y="42" width="238" height="58" fill="#0E4836" fill-opacity="0.18" stroke="#0E4836" stroke-width="1.4"/>
        <rect x="266" y="42" width="74" height="122" fill="#E3E2D0" stroke="#0E4836" stroke-width="1.4"/>
        <rect x="20" y="108" width="156" height="56" fill="#F2D2B6" stroke="#D35D2D" stroke-width="1.4"/>
        <rect x="184" y="108" width="74" height="56" fill="#FAF5EC" stroke="#121C17" stroke-width="1.2"/>
      </svg>`,
    },
    web12: {
      meta: "2008 960 Grid System & 2011 Bootstrap 12 列嵌套",
      desc: "Nathan Smith 的 960.gs（2008）以高度可整除的 960px 奠定 12/16 列网页算术；Mark Otto 与 Jacob Thornton 于 2011 年 8 月开源的 Bootstrap 把 .row > .col > .row 的 12 列嵌套列普及到千千万万网站界面。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <rect x="14" y="16" width="332" height="158" fill="#FAF5EC" stroke="#121C17" stroke-width="1.3"/>
        <text x="20" y="32" font-family="DM Mono,monospace" font-size="10" fill="#0E4836">.row (12 COL) &gt; .col-8 &gt; .row (.col-6 × 2)</text>
        <rect x="20" y="42" width="214" height="120" fill="#F4EBDC" stroke="#0E4836" stroke-width="1.4"/>
        <rect x="244" y="42" width="96" height="120" fill="#E3E2D0" stroke="#0E4836" stroke-width="1.4"/>
        <rect x="30" y="64" width="92" height="88" fill="#F2D2B6" stroke="#D35D2D" stroke-width="1.2"/>
        <rect x="132" y="64" width="92" height="88" fill="#F2D2B6" stroke="#D35D2D" stroke-width="1.2"/>
        <text x="30" y="56" font-family="DM Mono,monospace" font-size="10" fill="#0E4836">col-8</text>
        <text x="252" y="56" font-family="DM Mono,monospace" font-size="10" fill="#0E4836">col-4</text>
        <text x="76" y="112" text-anchor="middle" font-family="DM Mono,monospace" font-size="10" fill="#A33D14">nested 6</text>
        <text x="178" y="112" text-anchor="middle" font-family="DM Mono,monospace" font-size="10" fill="#A33D14">nested 6</text>
      </svg>`,
    },
    cssgrid: {
      meta: "2017 W3C CSS Grid Level 1 → 2023 Level 2 Subgrid & Carbon 2x",
      desc: "2017 年原生二维 CSS Grid 在各大浏览器同步落地，任意网格单元直接写 display: grid 即可建局部子网；2023 年 9 月起 Level 2 subgrid 实现全浏览器互通，IBM Carbon 2x Grid 等现代设计系统把父列包嵌套网写进了组件规范。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <rect x="14" y="16" width="332" height="158" fill="#0E4836" stroke="#121C17" stroke-width="1.3"/>
        <text x="22" y="34" font-family="DM Mono,monospace" font-size="10" fill="#FF9566">CSS GRID L1 (NESTED) + L2 (SUBGRID)</text>
        <rect x="22" y="46" width="194" height="114" fill="#133D30" stroke="#73E0B2" stroke-width="1.2"/>
        <g stroke="#73E0B2" stroke-dasharray="3 2" fill="rgba(115,224,178,0.12)">
          <rect x="30" y="66" width="54" height="86"/><rect x="92" y="66" width="54" height="86"/><rect x="154" y="66" width="54" height="86"/>
        </g>
        <rect x="226" y="46" width="112" height="114" fill="#133D30" stroke="#FF9566" stroke-width="1.2"/>
        <rect x="234" y="66" width="96" height="40" fill="rgba(255,149,102,0.22)" stroke="#FF9566"/>
        <rect x="234" y="114" width="96" height="38" fill="rgba(255,149,102,0.22)" stroke="#FF9566"/>
        <text x="30" y="59" font-family="DM Mono,monospace" font-size="10" fill="#FAF5EC">independent 3fr</text>
        <text x="234" y="59" font-family="DM Mono,monospace" font-size="10" fill="#FF9566">subgrid rows</text>
      </svg>`,
    },
  };

  function show(key) {
    const info = ERAS[key];
    eraMeta.textContent = info.meta;
    eraDesc.textContent = info.desc;
    svgBox.innerHTML = info.svg;
    btns.forEach((b) => {
      const on = b.dataset.era === key;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.era)));
  show("gerstner");
}

// ---------- 06：套娃嵌套深度压力计（桌面 1200px vs 手机 375px） ----------
export function initDepthLab() {
  const root = document.getElementById("lab-depth");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-depth]")];
  const deskBar = root.querySelector("#depth-desk-bar");
  const mobBar = root.querySelector("#depth-mob-bar");
  const deskNum = root.querySelector("#depth-desk-num");
  const mobNum = root.querySelector("#depth-mob-num");
  const verdict = root.querySelector("#depth-verdict");
  const boxes = root.querySelector("#depth-visual");

  // 逐层扣除双侧内边距 + 局部栏距的真实像素模型
  const CONFIGS = {
    1: {
      overheadDesk: 64,
      overheadMob: 32,
      colsDesk: 1,
      colsMob: 1,
      note: "1 层单网格：开销最低，几乎全宽都是内容。适合纯长文阅读或极简落页，但无法同时安放差异巨大的主辅区。",
      tone: "ok",
    },
    2: {
      overheadDesk: 156,
      overheadMob: 60,
      colsDesk: 4,
      colsMob: 2,
      note: "2 层（父网 → 子网，经验甜区）：桌面与手机都能保留 84% 以上净内容宽度，结构清楚又不臃肿，90% 以上的界面做到这一层就该停手。",
      tone: "ok",
    },
    3: {
      overheadDesk: 268,
      overheadMob: 112,
      colsDesk: 6,
      colsMob: 2,
      note: "3 层（父 → 子 → 孙，谨慎区）：在 1200px 桌面尚可承受，但在 375px 手机屏里边距和栏距已经吃掉近 30% 宽度，仅适合高密度专业后台表格。",
      tone: "warn",
    },
    4: {
      overheadDesk: 396,
      overheadMob: 184,
      colsDesk: 8,
      colsMob: 3,
      note: "4 层俄罗斯套娃（警报）：375px 手机屏近一半宽度（49%）全被层层内边距和缝隙吞掉，实际内容列只剩 ~63px，字一行装不下四个汉字，维护者也再分不清哪层在管对齐。",
      tone: "err",
    },
  };

  function update(d) {
    const c = CONFIGS[d];
    const deskKeep = Math.round(((1200 - c.overheadDesk) / 1200) * 100);
    const mobKeep = Math.round(((375 - c.overheadMob) / 375) * 100);
    const mobLoss = 100 - mobKeep;
    const mobCol = Math.round((375 - c.overheadMob) / c.colsMob);

    deskBar.style.width = `${deskKeep}%`;
    mobBar.style.width = `${mobKeep}%`;
    deskBar.dataset.tone = c.tone;
    mobBar.dataset.tone = c.tone;
    deskNum.textContent = `净宽 ${1200 - c.overheadDesk}px（留存 ${deskKeep}% · 开销 ${c.overheadDesk}px）`;
    mobNum.textContent = `净宽 ${375 - c.overheadMob}px（留存 ${mobKeep}% · 单列 ≈ ${mobCol}px）`;
    verdict.textContent =
      d === 4
        ? `4 层俄罗斯套娃（警报）：375px 手机屏有 ${mobLoss}% 宽度全被层层内边距和缝隙吞掉，实际内容单列只剩约 ${mobCol}px，字一行装不下四个汉字，维护者也再分不清哪层在管对齐。`
        : c.note;
    verdict.dataset.tone = c.tone;

    // 渲染嵌套盒示意
    let html = `<div class="nest-core">内容净宽 ${mobKeep}%</div>`;
    for (let i = d; i >= 1; i--) {
      html = `<div class="nest-shell nest-shell--${i}"><span>第 ${i} 层</span>${html}</div>`;
    }
    boxes.innerHTML = html;

    btns.forEach((b) => {
      const on = Number(b.dataset.depth) === d;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => update(Number(b.dataset.depth))));
  update(4);
}

// ---------- 07：三轮单变量 A/B/C/D 诊断小练习 ----------
export function initQuizLab() {
  const root = document.getElementById("lab-quiz");
  if (!root) return;
  const qBtns = [...root.querySelectorAll("[data-q-idx]")];
  const promptEl = root.querySelector("#quiz-prompt");
  const optionsEl = root.querySelector("#quiz-options");
  const feedbackEl = root.querySelector("#quiz-feedback");
  const scoreEl = root.querySelector("#quiz-score");

  const svgGap = (og, ig) => {
    const o = Math.min(22, Math.max(3, og * 0.72));
    const i = Math.min(18, Math.max(2, ig * 0.65));
    const modW = (180 - o) / 2;
    const cardW = (modW - 10 - i) / 2;
    const drawMod = (mx) => `
      <rect x="${mx}" y="12" width="${modW}" height="68" fill="#F4EBDC" stroke="#9AA28E" stroke-dasharray="3 2"/>
      <rect x="${mx + 5}" y="18" width="${cardW}" height="24" fill="#F2D2B6" stroke="#121C17"/>
      <rect x="${mx + 5 + cardW + i}" y="18" width="${cardW}" height="24" fill="#F2D2B6" stroke="#121C17"/>
      <rect x="${mx + 5}" y="${18 + 24 + Math.min(10, i * 0.7)}" width="${cardW}" height="24" fill="#E3E2D0" stroke="#121C17"/>
      <rect x="${mx + 5 + cardW + i}" y="${18 + 24 + Math.min(10, i * 0.7)}" width="${cardW}" height="24" fill="#E3E2D0" stroke="#121C17"/>`;
    return `<svg viewBox="0 0 200 92" aria-hidden="true">${drawMod(10)}${drawMod(10 + modW + o)}</svg>`;
  };

  const svgAlign = (split, bottom) => {
    const cols = 12;
    const fw = 180;
    const step = fw / cols;
    const lines = Array.from({ length: cols + 1 }, (_, k) => `<line x1="${10 + k * step}" y1="8" x2="${10 + k * step}" y2="86" stroke="#0E4836" stroke-opacity="0.22" stroke-width="0.8"/>`).join("");
    const sx = 10 + split * step;
    const bw = (fw - (bottom - 1) * 4) / bottom;
    const bCards = Array.from({ length: bottom }, (_, k) => `<rect x="${10 + k * (bw + 4)}" y="60" width="${bw}" height="20" fill="#F2D2B6" stroke="#121C17"/>`).join("");
    return `<svg viewBox="0 0 200 92" aria-hidden="true">
      ${lines}
      <rect x="10" y="14" width="${sx - 12}" height="38" fill="#F4EBDC" stroke="#121C17"/>
      <rect x="${sx + 2}" y="14" width="${190 - sx - 2}" height="38" fill="#E3E2D0" stroke="#121C17"/>
      <line x1="${sx}" y1="10" x2="${sx}" y2="56" stroke="#D35D2D" stroke-width="1.8"/>
      ${bCards}
    </svg>`;
  };

  const svgMobile = (mode) => {
    if (mode === "2x3") {
      const cells = [];
      for (let m = 0; m < 2; m++) {
        const mx = 52 + m * 50;
        cells.push(`<rect x="${mx}" y="14" width="46" height="64" fill="#F4EBDC" stroke="#0E4836"/>`);
        for (let c = 0; c < 3; c++) cells.push(`<rect x="${mx + 3 + c * 14}" y="20" width="11" height="52" fill="#F2D2B6" stroke="#121C17"/>`);
      }
      return `<svg viewBox="0 0 200 92" aria-hidden="true"><rect x="46" y="6" width="108" height="80" rx="4" fill="#FAF5EC" stroke="#121C17" stroke-width="1.3"/>${cells.join("")}</svg>`;
    }
    if (mode === "1x2") {
      return `<svg viewBox="0 0 200 92" aria-hidden="true">
        <rect x="46" y="6" width="108" height="80" rx="4" fill="#FAF5EC" stroke="#121C17" stroke-width="1.3"/>
        <rect x="54" y="14" width="92" height="26" fill="#0E4836" fill-opacity="0.16" stroke="#0E4836"/>
        <rect x="54" y="46" width="43" height="32" fill="#F2D2B6" stroke="#121C17"/>
        <rect x="103" y="46" width="43" height="32" fill="#E3E2D0" stroke="#121C17"/>
      </svg>`;
    }
    if (mode === "3x2") {
      const cells = [];
      for (let m = 0; m < 3; m++) {
        const mx = 52 + m * 33;
        cells.push(`<rect x="${mx}" y="14" width="30" height="64" fill="#F4EBDC" stroke="#0E4836"/>`);
        for (let c = 0; c < 2; c++) cells.push(`<rect x="${mx + 3 + c * 13}" y="20" width="10" height="52" fill="#F2D2B6" stroke="#121C17"/>`);
      }
      return `<svg viewBox="0 0 200 92" aria-hidden="true"><rect x="46" y="6" width="108" height="80" rx="4" fill="#FAF5EC" stroke="#121C17" stroke-width="1.3"/>${cells.join("")}</svg>`;
    }
    // 4x1
    const cols = Array.from({ length: 4 }, (_, i) => `<rect x="${53 + i * 24}" y="14" width="21" height="64" fill="#E3E2D0" stroke="#121C17"/>`).join("");
    return `<svg viewBox="0 0 200 92" aria-hidden="true"><rect x="46" y="6" width="108" height="80" rx="4" fill="#FAF5EC" stroke="#121C17" stroke-width="1.3"/>${cols}</svg>`;
  };

  const QUESTIONS = [
    {
      prompt: "题 1（间距系统）· 左右两个父模块各含 2×2 子卡片，除「外缝 / 内缝」外其余完全相同。哪一套参数最能守住父子归属？",
      answer: "B",
      opts: [
        { key: "A", meta: "外缝 8px / 内缝 24px", svg: svgGap(8, 24), why: "内缝（24px）是外缝（8px）的 3 倍，间距倒挂：左右模块内侧的卡片反而靠得更近，读者瞬间把它们串成一组。" },
        { key: "B", meta: "外缝 24px / 内缝 12px", svg: svgGap(24, 12), why: "正确。外缝 24px 恰好是内缝 12px 的 2 倍，既保持共享的 4px/12px 间距比例，又靠外宽内紧让左右两大父模块一目了然。" },
        { key: "C", meta: "外缝 4px / 内缝 4px", svg: svgGap(4, 4), why: "内外缝全压到 4px 且完全相等，既缺少呼吸留白，又抹平了父模块与子卡片的层级差。" },
        { key: "D", meta: "外缝 16px / 内缝 32px", svg: svgGap(16, 32), why: "虽然外缝到了 16px，但内缝放到了 32px，依然违背「外缝宽于内缝」的邻近性底线。" },
      ],
    },
    {
      prompt: "题 2（父线咬合与整除）· 12 列父网格与 20px / 10px 间距都已固定，仅改动「主辅分界列」与「底部卡片栏数」。哪套方案严丝合缝？",
      answer: "C",
      opts: [
        { key: "A", meta: "分界 6.5 列 · 底区 4 栏", svg: svgAlign(6.5, 4), why: "底区 4 栏能整除 12 列，但上半段主辅分界悬在 6.5 列，脱离了父网格的竖向脊线。" },
        { key: "B", meta: "分界 8 列 · 底区 5 栏", svg: svgAlign(8, 5), why: "上半段 8+4 对齐了父网格，但底区 5 栏在 12 列里每张占 2.4 列，下半页竖线全面错位。" },
        { key: "C", meta: "分界 8 列 · 底区 4 栏", svg: svgAlign(8, 4), why: "正确。主辅分界稳稳落在第 8 列父线，底区 4 张卡每张严格占 3 列（12÷4=3），全页竖向秩序一贯到底。" },
        { key: "D", meta: "分界 7.4 列 · 底区 5 栏", svg: svgAlign(7.4, 5), why: "主辅分界既未落整数父线，底区 5 栏也无法整除 12 列，上下两段都脱离了父骨架。" },
      ],
    },
    {
      prompt: "题 3（375px 手机窄屏防套娃）· 把电商页的商品参数模块缩到 375px 宽手机屏，哪种父子列组合既保持局部秩序又不挤碎文字？",
      answer: "B",
      opts: [
        { key: "A", meta: "父 2 列 → 每列再嵌 3 子列", svg: svgMobile("2x3"), why: "375px 里同时横排 6 条子列，扣掉边距与缝隙后每条只剩约 40px，字都挤成竖排串糖葫芦。" },
        { key: "B", meta: "父 1 列通栏 → 内部嵌 2 子列", svg: svgMobile("1x2"), why: "正确。窄屏下先果断把父网格降平为 1 列通栏，省下父级外缝，再把宽裕的版芯交由 2 列局部子网格排参数卡，单列约 160px 清晰耐读。" },
        { key: "C", meta: "父 3 列 → 每列再嵌 2 子列", svg: svgMobile("3x2"), why: "同样在手机横向上强塞 6 个子列，且多出两道父级外缝，空间损耗更惨重。" },
        { key: "D", meta: "父 4 列 → 不设子网格", svg: svgMobile("4x1"), why: "在 375px 屏宽里硬排 4 列，单列仅约 70px，规格文案会被频繁折行，远不如通栏套 2 列子网舒展。" },
      ],
    },
  ];

  let curQ = 0;
  const picked = {};

  function render() {
    const q = QUESTIONS[curQ];
    promptEl.textContent = q.prompt;
    const chosen = picked[curQ];

    optionsEl.innerHTML = q.opts
      .map((o) => {
        const isSel = chosen === o.key;
        const isRight = chosen && o.key === q.answer;
        const isWrong = isSel && o.key !== q.answer;
        const cls = ["quiz-opt", isSel ? "is-picked" : "", isRight ? "is-right" : "", isWrong ? "is-wrong" : ""].filter(Boolean).join(" ");
        return `<button type="button" class="${cls}" data-opt="${o.key}" aria-pressed="${isSel}">
          <div class="quiz-opt-head"><span class="quiz-letter">方案 ${o.key}</span><span class="quiz-meta">${o.meta}</span></div>
          <div class="quiz-svg">${o.svg}</div>
        </button>`;
      })
      .join("");

    optionsEl.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[curQ] = btn.dataset.opt;
        render();
      });
    });

    if (chosen) {
      const hit = q.opts.find((o) => o.key === chosen);
      const ok = chosen === q.answer;
      feedbackEl.className = `quiz-fb is-show ${ok ? "is-ok" : "is-err"}`;
      feedbackEl.innerHTML = `<strong>${ok ? `答对了（方案 ${q.answer}）` : `选了方案 ${chosen}，再看这一处：`}</strong> ${hit.why}`;
    } else {
      feedbackEl.className = "quiz-fb";
      feedbackEl.textContent = "先比较四张图里的单一变量差异，再点选一套方案。";
    }

    const doneCount = Object.keys(picked).length;
    const rightCount = Object.entries(picked).filter(([i, k]) => QUESTIONS[i].answer === k).length;
    scoreEl.textContent = `已作答 ${doneCount} / 3 · 答对 ${rightCount} 题`;

    qBtns.forEach((b) => {
      const idx = Number(b.dataset.qIdx);
      const on = idx === curQ;
      b.classList.toggle("is-on", on);
      b.classList.toggle("is-done", picked[idx] === QUESTIONS[idx].answer);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  qBtns.forEach((b) => b.addEventListener("click", () => { curQ = Number(b.dataset.qIdx); render(); }));
  render();
}

// ---------- 原海报放大灯箱（缩放 + 拖移 + Esc 关闭） ----------
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-modal");
  if (!poster || !dialog) return;

  const modalImg = dialog.querySelector("#modal-poster-img");
  const closeBtn = dialog.querySelector("#modal-close");
  const zoomIn = dialog.querySelector("#modal-zin");
  const zoomOut = dialog.querySelector("#modal-zout");
  const zoomReset = dialog.querySelector("#modal-zreset");
  const zoomLabel = dialog.querySelector("#modal-zlabel");
  const stage = dialog.querySelector("#modal-stage");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  function apply() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!modalImg.src) modalImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    dialog.hidden = false;
    closeBtn.focus();
  }

  function close() {
    dialog.hidden = true;
    (openBtn || poster).focus();
  }

  (openBtn || poster).addEventListener("click", open);
  poster.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) close();
  });

  zoomIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); apply(); });
  zoomOut.addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } apply(); });
  zoomReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = tx;
    oy = ty;
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    apply();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });
}
