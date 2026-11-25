// 193 水平文字排版 · 第 01–08 节交互模块（相邻节各用完全不同的交互机制）
import {
  GAZE_DEMOS,
  MATRIX_LEADINGS,
  MATRIX_MEASURES,
  PRACTICE_OPTIONS,
  evalMatrixCell,
  wrapParagraph,
} from "./model.js";

// ---------- 01 节：不对称感知广度逐字步进器 ----------
export function initGazeSection() {
  const track = document.getElementById("gaze-track");
  if (!track) return;
  const noteEl = document.getElementById("gaze-note");
  const posEl = document.getElementById("gaze-pos");
  const dirEl = document.getElementById("gaze-dir-badge");
  const playBtn = document.getElementById("gaze-play");
  const prevBtn = document.getElementById("gaze-prev");
  const nextBtn = document.getElementById("gaze-next");
  const modeBtns = [...document.querySelectorAll("[data-gaze-mode]")];

  let mode = "zh";
  let idx = GAZE_DEMOS.zh.defaultIdx;
  let timer = 0;

  function render() {
    const d = GAZE_DEMOS[mode];
    const len = d.tokens.length;
    idx = Math.max(0, Math.min(len - 1, idx));

    modeBtns.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.gazeMode === mode))
    );
    track.dataset.dir = d.dir;
    track.innerHTML = "";

    // 对于 RTL 示意，用视觉从右向左的排列让读者亲身感受到预视窗镜像朝左
    d.tokens.forEach((tok, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gaze-tok";
      if (mode === "rtl") btn.classList.add("is-word");
      if (mode === "en") btn.classList.add("is-char");
      btn.textContent = tok === " " ? "\u00A0" : tok;

      const delta = i - idx; // 沿阅读顺序：>0 为前进方向预视，<0 为身后回望
      let role = "out";
      if (delta === 0) {
        role = "fix";
      } else if (d.dir === "ltr") {
        if (delta > 0 && delta <= d.rightSpan) role = "ahead";
        else if (delta < 0 && -delta <= d.leftSpan) role = "behind";
      } else {
        // RTL：前进方向是屏幕向左（index 递增即往左延伸 leftSpan 个词）
        if (delta > 0 && delta <= d.leftSpan) role = "ahead";
        else if (delta < 0 && -delta <= d.rightSpan) role = "behind";
      }
      btn.dataset.role = role;
      btn.setAttribute("aria-label", `注视第 ${i + 1} 位：${tok}`);
      btn.addEventListener("click", () => {
        stopAuto();
        idx = i;
        render();
      });
      track.append(btn);
    });

    if (noteEl) noteEl.textContent = d.note;
    if (posEl) {
      const ahead = d.dir === "ltr" ? d.rightSpan : d.leftSpan;
      const behind = d.dir === "ltr" ? d.leftSpan : d.rightSpan;
      const unit = mode === "en" ? "字母" : mode === "rtl" ? "词块" : "汉字";
      posEl.textContent = `注视第 ${idx + 1} / ${len} · 身后回望 ${behind} ${unit} · 前方预视 ${ahead} ${unit}`;
    }
    if (dirEl) {
      dirEl.textContent =
        d.dir === "ltr" ? "阅读推进方向：左 → 右（LTR）" : "阅读推进方向：右 → 左（RTL 镜像）";
    }
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = 0;
      if (playBtn) {
        playBtn.setAttribute("aria-pressed", "false");
        playBtn.textContent = "自动扫读";
      }
    }
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      stopAuto();
      mode = b.dataset.gazeMode;
      idx = GAZE_DEMOS[mode].defaultIdx;
      render();
    })
  );

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      stopAuto();
      const step = mode === "en" ? 4 : mode === "rtl" ? 1 : 2;
      idx = Math.max(0, idx - step);
      render();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      stopAuto();
      const d = GAZE_DEMOS[mode];
      const step = mode === "en" ? 5 : mode === "rtl" ? 1 : 2;
      idx = (idx + step) % d.tokens.length;
      render();
    });
  }
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (timer) {
        stopAuto();
        return;
      }
      playBtn.setAttribute("aria-pressed", "true");
      playBtn.textContent = "暂停扫读";
      timer = setInterval(() => {
        const d = GAZE_DEMOS[mode];
        const step = mode === "en" ? 5 : mode === "rtl" ? 1 : 2;
        idx = (idx + step) % d.tokens.length;
        render();
      }, 650);
    });
  }

  render();
}

// ---------- 02 节：4×4 行长 × 行距耦合热力矩阵 ----------
export function initMatrixSection() {
  const grid = document.getElementById("matrix-grid");
  if (!grid) return;
  const spec = document.getElementById("matrix-specimen");
  const badgeEl = document.getElementById("matrix-badge");
  const angleEl = document.getElementById("matrix-angle");
  const summaryEl = document.getElementById("matrix-summary");
  const slopeLine = document.getElementById("slope-diag");
  const slopeLabel = document.getElementById("slope-deg-label");

  const SAMPLE =
    "优秀的水平排版并非把文字塞满整个页面宽度，而是替人眼预先计算好每一次前行与回扫的距离。行长放宽时，行间留白必须同步增厚，才能在折返途中稳稳托住视线，避免重读同一行或误跳下一行。";

  let activeM = 44;
  let activeL = 1.15; // 开场落在高危右下格，鼓励点击进绿区对比

  function buildGrid() {
    grid.innerHTML = "";
    // 顶部列标（行长）
    const corner = document.createElement("div");
    corner.className = "mx-corner";
    corner.textContent = "距 \\ 长";
    grid.append(corner);

    MATRIX_MEASURES.forEach((m) => {
      const th = document.createElement("div");
      th.className = "mx-head";
      th.textContent = `${m} 字`;
      grid.append(th);
    });

    MATRIX_LEADINGS.forEach((l) => {
      const rh = document.createElement("div");
      rh.className = "mx-rhead";
      rh.textContent = `${l.toFixed(2)}×`;
      grid.append(rh);

      MATRIX_MEASURES.forEach((m) => {
        const info = evalMatrixCell(m, l);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mx-cell";
        btn.dataset.zone = info.zone;
        btn.dataset.m = String(m);
        btn.dataset.l = String(l);
        btn.innerHTML = `<span class="mx-deg" lang="en">${info.angle.toFixed(1)}°</span><span class="mx-tag">${info.badge.slice(0, 4)}</span>`;
        btn.addEventListener("click", () => {
          activeM = m;
          activeL = l;
          update();
        });
        grid.append(btn);
      });
    });
  }

  function update() {
    const info = evalMatrixCell(activeM, activeL);
    grid.querySelectorAll(".mx-cell").forEach((c) => {
      const on = Number(c.dataset.m) === activeM && Number(c.dataset.l) === activeL;
      c.setAttribute("aria-pressed", String(on));
    });

    if (badgeEl) {
      badgeEl.textContent = info.badge;
      badgeEl.dataset.zone = info.zone;
    }
    if (angleEl) {
      angleEl.textContent = `${activeM} 字 × ${activeL.toFixed(2)}× · 回扫倾角 ${info.angle.toFixed(1)}°（安全下限 ${info.minL.toFixed(2)}×）`;
    }
    if (summaryEl) summaryEl.textContent = info.summary;

    if (spec) {
      const lines = wrapParagraph(SAMPLE, "zh", activeM);
      spec.style.setProperty("--mx-lh", String(activeL));
      spec.style.setProperty("--mx-fs", activeM >= 40 ? "12px" : activeM <= 15 ? "14.5px" : "14px");
      spec.innerHTML = lines
        .map((ln) => `<span class="mx-line">${ln.text}</span>`)
        .join("");
    }

    // 更新 SVG 回扫倾角示意三角形（夸大纵轴以清晰可辨，角度文字严格报真值）
    if (slopeLine && slopeLabel) {
      const x1 = 22 + Math.min(220, activeM * 4.9);
      const y1 = 18;
      const y2 = 18 + Math.min(68, activeL * 24);
      slopeLine.setAttribute("d", `M ${x1.toFixed(1)} ${y1} L 22 ${y2.toFixed(1)}`);
      slopeLabel.textContent = `倾角 ${info.angle.toFixed(1)}°`;
    }
  }

  buildGrid();
  update();
}

// ---------- 03 节：X 光解剖层叠开关 ----------
export function initAnatomySection() {
  const plate = document.getElementById("anatomy-plate");
  if (!plate) return;
  const toggles = [...document.querySelectorAll("[data-layer]")];
  const modeBtns = [...document.querySelectorAll("[data-anatomy-mode]")];
  const readout = document.getElementById("anatomy-readout");

  const NOTES = {
    broken:
      "失调样张：标题与正文各自漂移，行距 1.18× 且段距为 0，中英文之间完全紧贴，视觉上浑成一团灰砖。",
    calibrated:
      "校准样张：四层隐形秩序同时咬合——基线托住每一行重心，左缘垂线固定回扫落点，1.72× 行距配 1.1em 段距形成三级呼吸，中英之间留出约 0.2em 微隙。",
  };

  function sync() {
    const active = [];
    toggles.forEach((cb) => {
      const key = cb.dataset.layer;
      plate.classList.toggle(`show-${key}`, cb.checked);
      if (cb.checked) active.push(cb.dataset.label);
    });
    const mode = plate.dataset.mode || "calibrated";
    if (readout) {
      readout.textContent = `${NOTES[mode]} 当前已掀开：${active.length ? active.join("、") : "无参考层（纯阅读态）"}。`;
    }
  }

  toggles.forEach((cb) => cb.addEventListener("change", sync));
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const m = b.dataset.anatomyMode;
      plate.dataset.mode = m;
      modeBtns.forEach((x) =>
        x.setAttribute("aria-pressed", String(x.dataset.anatomyMode === m))
      );
      sync();
    })
  );
  sync();
}

// ---------- 04 节：千年转向历史活体标本台 ----------
export function initHistorySection() {
  const stage = document.getElementById("era-stage");
  if (!stage) return;
  const tabs = [...document.querySelectorAll("[data-era]")];
  const titleEl = document.getElementById("era-title");
  const descEl = document.getElementById("era-desc");

  const ERAS = {
    boustrophedon: {
      title: "约公元前 6 世纪 → 前 500 年 · 从牛耕式折返到左起横排",
      desc: "古希腊铭文最初沿袭腓尼基自右向左书写，随后盛行「牛耕式（Boustrophedon）」——像牛耕地一样一行左向右、下一行右向左折返。约公元前 500 年后全面定型为统一左向右横排，让眼睛只需掌握单一方向扫视。",
      html: `
        <div class="era-stone" aria-label="古希腊牛耕式折返排字示意">
          <p class="era-row ltr"><span>LINE 01 · LEFT TO RIGHT</span><i aria-hidden="true">→</i></p>
          <p class="era-row rtl"><i aria-hidden="true">←</i><span>THGIR OT TFEL · 20 ENIL</span></p>
          <p class="era-row ltr"><span>LINE 03 · EYE REVERSES AGAIN</span><i aria-hidden="true">→</i></p>
          <p class="era-cap">偶数行文字反向折返，人眼必须反复切换扫视方向；定型左起横排后阅读效率大增。</p>
        </div>
      `,
    },
    science1915: {
      title: "1915 年 1 月 · 《科学》月刊率先打破千年竖排",
      desc: "由任鸿隽、赵元任等发起的中国科学社在上海创刊《科学》月刊（商务印书馆印行）。自然科学论文离不开数学公式、化学方程式与拉丁字母，竖排下符号东倒西歪，促使《科学》成为中国最早全面采用左起横排与西式标点的现代期刊。",
      html: `
        <div class="era-journal">
          <div class="ej-head"><span class="ej-vol">第一卷 · 第一期</span><b>科 學</b><span class="ej-vol">1915 · 上海</span></div>
          <p class="ej-body">凡论力学与化学反应，如 <span class="ej-eq" lang="en">F = m · a</span> 及 <span class="ej-eq" lang="en">2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O</span>，皆以左起横行排列，算式与正文共居一基线，免除竖行倒置之弊。</p>
          <p class="ej-cap">公式、阿拉伯数字与西文术语的刚需，直接撬动了中文出版的横排实验。</p>
        </div>
      `,
    },
    guangming1955: {
      title: "1955 年 1 月 1 日 · 《光明日报》首开全国报纸横排先河",
      desc: "1955 年元旦，《光明日报》头版刊出《为本报改成横排告读者》，同日发表胡愈之论证横排符合视动与生活习惯的文章；报社美编还专门手写刻制扁方形横排标题字模。次年 1956 年 1 月 1 日，《人民日报》等全国各大报纸全面改为横排。",
      html: `
        <div class="era-paper">
          <div class="ep-mast"><span>1955年1月1日</span><b>光 明 日 报</b><span>率先改版横排</span></div>
          <div class="ep-cols">
            <div><h4>为本报改成横排告读者</h4><p>报刊书籍的排版方式，应跟着现代文化与生活习惯的需要而改变。自左向右横排更便于长文、表格与科技词汇清晰呈现。</p></div>
            <div><h4>1956 年全面普及</h4><p>次年元旦《人民日报》等大报相继改用横排，此后教科书、公文与现代中文出版全面确立水平阅读秩序。</p></div>
          </div>
        </div>
      `,
    },
    cssModern: {
      title: "当代数字屏幕 · W3C horizontal-tb 与多语种逻辑流",
      desc: "W3C CSS Writing Modes Level 3 将 horizontal-tb 定为网页默认书写模式：行内沿水平推进、块级自上而下堆叠，并用逻辑属性（inline-start / block-start）无缝兼顾中文、拉丁文（LTR）与阿拉伯语（RTL）。",
      html: `
        <div class="era-css">
          <pre class="ec-code" lang="en"><code>.article {
  writing-mode: horizontal-tb;
  max-inline-size: 28em;   /* 约 26–28 汉字经验舒适带 */
  line-height: 1.72;       /* 托住回扫坡度 */
  text-align: start;       /* LTR 靠左，RTL 自动靠右 */
}</code></pre>
          <p class="ec-cap">同一套水平书写流与逻辑属性，支撑起今天跨设备、跨语言的全球信息版面。</p>
        </div>
      `,
    },
  };

  function show(id) {
    const e = ERAS[id];
    if (!e) return;
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.era === id)));
    if (titleEl) titleEl.textContent = e.title;
    if (descEl) descEl.textContent = e.desc;
    stage.innerHTML = e.html;
  }

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.era)));
  show("boustrophedon");
}

// ---------- 05 节：三联原海报应用示例媒介自适应切换 ----------
export function initMediaSection() {
  const gallery = document.getElementById("media-gallery");
  if (!gallery) return;
  const btns = [...document.querySelectorAll("[data-media-vp]")];
  const note = document.getElementById("media-note");

  const NOTES = {
    desktop:
      "桌面宽幅（印刷名片 / 横幅 / 专题卡）：三张原海报示例从左到右展开，主标题与正文拉出清晰字号级差，每行控制在 18–26 字或短英文词组，大面积留白托出专业质感。",
    tablet:
      "平板中等开本：卡片略收窄，横排文本自然重排为更紧致的短行，仍保持统一的左侧垂直锚线与段前赤陶短杠节奏。",
    mobile:
      "手机竖屏（窄幅承载）：横排的强项在窄屏立刻显现——段落自然折成每行 14–20 字，图文改为纵栈，无需横向滚动，手指一路竖滑就能顺畅扫完三张卡片。",
  };

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      const vp = b.dataset.mediaVp;
      gallery.dataset.vp = vp;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mediaVp === vp)));
      if (note) note.textContent = NOTES[vp];
    })
  );
}

// ---------- 06 节：什么时候别用标准横排（四场景翻面对比） ----------
export function initAvoidSection() {
  const stage = document.getElementById("avoid-stage");
  if (!stage) return;
  const sceneBtns = [...document.querySelectorAll("[data-avoid-scene]")];
  const modeBtns = [...document.querySelectorAll("[data-avoid-mode]")];
  const caption = document.getElementById("avoid-caption");

  const SCENES = {
    scroll: {
      force: {
        title: "硬用横排：竖幅立轴被横字拦腰切断",
        desc: "在传统东亚竖幅书画、古典诗笺与牌匾楹联里，画面势能自上而下倾泻。强行横排几行小字会截断纵向气韵，还与古籍题跋视觉冲突。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <rect x="115" y="10" width="130" height="200" fill="#E9DFD0" stroke="#DF6B52" stroke-width="2"/>
          <circle cx="152" cy="54" r="20" fill="#B84430" opacity="0.22"/>
          <path d="M115 165 Q165 130 245 170 L245 210 L115 210 Z" fill="#182331" opacity="0.22"/>
          <rect x="124" y="84" width="112" height="58" fill="rgba(184,68,48,0.14)" stroke="#B84430" stroke-dasharray="4 3"/>
          <text x="130" y="102" font-size="11" fill="#0A1622">山川有声岁月成</text>
          <text x="130" y="120" font-size="11" fill="#0A1622">诗横排硬生生把</text>
          <text x="130" y="136" font-size="11" fill="#0A1622">立轴腰斩成两段</text>
          <text x="180" y="22" text-anchor="middle" font-size="10" fill="#962F1E">× 横行截断纵势</text>
        </svg>`,
      },
      better: {
        title: "改用 192 垂直文字排版：顺立轴自上而下成流",
        desc: "把诗句改回由右向左、自上而下的竖排，文字本身化作画面的纵向山脊，与留白和印章浑然一体。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <rect x="115" y="10" width="130" height="200" fill="#E9DFD0" stroke="#68D0B9" stroke-width="2"/>
          <circle cx="150" cy="60" r="22" fill="#B84430" opacity="0.25"/>
          <path d="M115 170 Q168 138 245 174 L245 210 L115 210 Z" fill="#182331" opacity="0.22"/>
          <g fill="#0A1622" font-size="13" text-anchor="middle">
            <text x="218" y="42">山</text><text x="218" y="60">川</text><text x="218" y="78">有</text><text x="218" y="96">声</text>
            <text x="196" y="42">岁</text><text x="196" y="60">月</text><text x="196" y="78">成</text><text x="196" y="96">诗</text>
          </g>
          <rect x="190" y="106" width="12" height="12" fill="#B84430"/>
          <text x="180" y="200" text-anchor="middle" font-size="10" fill="#1B6B5A">✓ 纵轴通透 · 移步 192 竖排</text>
        </svg>`,
      },
    },
    spine: {
      force: {
        title: "硬用横排：窄书脊里每行只剩 2 个字",
        desc: "书脊、窄柱广告、折叠菜单侧边栏宽度只有三四十像素。硬用水平排版会把书名切成两字一行的碎块，远看完全认不出词义。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <rect x="150" y="14" width="60" height="192" fill="#E9DFD0" stroke="#DF6B52" stroke-width="2"/>
          <g fill="#0A1622" font-size="13" text-anchor="middle">
            <text x="180" y="48">水 平</text>
            <text x="180" y="68">文 字</text>
            <text x="180" y="88">排 版</text>
            <text x="180" y="108">设 计</text>
            <text x="180" y="128">手 册</text>
          </g>
          <line x1="154" y1="53" x2="206" y2="53" stroke="#B84430" stroke-dasharray="3 2"/>
          <line x1="154" y1="73" x2="206" y2="73" stroke="#B84430" stroke-dasharray="3 2"/>
          <text x="180" y="190" text-anchor="middle" font-size="10" fill="#962F1E">× 碎裂断词</text>
        </svg>`,
      },
      better: {
        title: "改用顺脊单列排布：一气贯通、远距可辨",
        desc: "在极窄竖容器里顺着最长边单列排字（中文竖排或西文 90° 旋转），字号可以放大近一倍，书架三米外也能一眼读清。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <rect x="150" y="14" width="60" height="192" fill="#E9DFD0" stroke="#68D0B9" stroke-width="2"/>
          <g fill="#0A1622" font-size="17" font-weight="700" text-anchor="middle">
            <text x="180" y="46">排</text><text x="180" y="70">版</text><text x="180" y="94">设</text><text x="180" y="118">计</text><text x="180" y="142">手</text><text x="180" y="166">册</text>
          </g>
          <text x="180" y="194" text-anchor="middle" font-size="10" fill="#1B6B5A">✓ 顺脊大字直读</text>
        </svg>`,
      },
    },
    emblem: {
      force: {
        title: "硬用横排：圆章徽标里方字硬怼弧边",
        desc: "品牌圆章、黑胶唱片标签、动感海报需要文字贴合圆形或弧线形成向心张力。平直横排塞进圆里，四角憋闷、边缘留白支离破碎。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <circle cx="180" cy="110" r="82" fill="#E9DFD0" stroke="#DF6B52" stroke-width="2"/>
          <circle cx="180" cy="110" r="46" fill="#B84430" opacity="0.18"/>
          <rect x="108" y="88" width="144" height="44" fill="none" stroke="#B84430" stroke-dasharray="4 3"/>
          <text x="180" y="106" text-anchor="middle" font-size="12" font-weight="700" fill="#0A1622">HORIZONTAL DESIGN</text>
          <text x="180" y="124" text-anchor="middle" font-size="11" fill="#0A1622">STUDIO · 2026</text>
          <text x="180" y="176" text-anchor="middle" font-size="10" fill="#962F1E">× 方块与圆弧互撞</text>
        </svg>`,
      },
      better: {
        title: "改用 191 路径文字：沿弧轨建立徽章向心力",
        desc: "让短标识沿着圆周路径舒展，文字直接充当图形外框，中心留出干净视觉焦点（正文仍归横排，绝不拿路径排长文）。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <defs><path id="av-arc" d="M 116 110 A 64 64 0 1 1 244 110"/></defs>
          <circle cx="180" cy="110" r="82" fill="#E9DFD0" stroke="#68D0B9" stroke-width="2"/>
          <circle cx="180" cy="110" r="38" fill="#B84430"/>
          <text font-size="11.5" font-weight="700" fill="#0A1622" letter-spacing="2.2"><textPath href="#av-arc" startOffset="50%" text-anchor="middle">DESIGN STUDIO · 193</textPath></text>
          <text x="180" y="176" text-anchor="middle" font-size="10" fill="#1B6B5A">✓ 弧轨贴合 · 移步 191</text>
        </svg>`,
      },
    },
    spread: {
      force: {
        title: "硬用平铺横排：杂志大跨页沦为说明书",
        desc: "在需要第一眼抓人的画报跨页或展览主视觉里，通篇规规矩矩的等宽左齐横排虽清楚，却缺少体量反差与情绪张力。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <rect x="26" y="18" width="308" height="184" fill="#E9DFD0" stroke="#DF6B52" stroke-width="2"/>
          <line x1="180" y1="18" x2="180" y2="202" stroke="rgba(10,22,34,0.2)"/>
          <g fill="#0A1622" opacity="0.55">
            <rect x="44" y="40" width="118" height="7"/><rect x="44" y="56" width="118" height="5"/>
            <rect x="44" y="68" width="112" height="5"/><rect x="44" y="80" width="118" height="5"/>
            <rect x="44" y="92" width="96" height="5"/><rect x="44" y="114" width="118" height="5"/>
            <rect x="198" y="40" width="118" height="5"/><rect x="198" y="52" width="118" height="5"/>
            <rect x="198" y="64" width="110" height="5"/><rect x="198" y="84" width="118" height="5"/>
          </g>
          <text x="180" y="186" text-anchor="middle" font-size="10" fill="#962F1E">× 平铺等重，缺少视线入口</text>
        </svg>`,
      },
      better: {
        title: "配合 184 跨栏标题与 181 非对称留白造张力",
        desc: "保留横排正文的可读性，同时用跨栏巨型标题、大幅留白与偏心色块制造冲击——功能交给横排，情绪交给层级反差。",
        svg: `<svg viewBox="0 0 360 220" class="av-svg" aria-hidden="true">
          <rect x="26" y="18" width="308" height="184" fill="#E9DFD0" stroke="#68D0B9" stroke-width="2"/>
          <line x1="180" y1="18" x2="180" y2="202" stroke="rgba(10,22,34,0.16)"/>
          <rect x="228" y="34" width="88" height="74" fill="#B84430"/>
          <text x="42" y="82" font-size="28" font-weight="900" fill="#0A1622">清晰流动</text>
          <g fill="#0A1622" opacity="0.65">
            <rect x="44" y="122" width="114" height="5"/><rect x="44" y="134" width="108" height="5"/><rect x="44" y="146" width="94" height="5"/>
            <rect x="198" y="122" width="114" height="5"/><rect x="198" y="134" width="104" height="5"/>
          </g>
          <text x="180" y="186" text-anchor="middle" font-size="10" fill="#1B6B5A">✓ 巨标破局 + 稳健横排正文</text>
        </svg>`,
      },
    },
  };

  let scene = "scroll";
  let mode = "force";

  function render() {
    sceneBtns.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.avoidScene === scene))
    );
    modeBtns.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.avoidMode === mode))
    );
    const data = SCENES[scene][mode];
    stage.innerHTML = data.svg;
    if (caption) {
      caption.innerHTML = `<strong>${data.title}</strong><span>${data.desc}</span>`;
    }
  }

  sceneBtns.forEach((b) =>
    b.addEventListener("click", () => {
      scene = b.dataset.avoidScene;
      render();
    })
  );
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.avoidMode;
      render();
    })
  );
  render();
}

// ---------- 07 节：四选一单变量盲测 ----------
export function initPracticeSection() {
  const cards = [...document.querySelectorAll(".prac-card")];
  const verdict = document.getElementById("prac-verdict");
  const vTitle = document.getElementById("prac-v-title");
  const vText = document.getElementById("prac-v-text");
  if (!cards.length || !verdict) return;

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.choice;
      const opt = PRACTICE_OPTIONS[id];
      if (!opt) return;

      cards.forEach((c) => {
        const cid = c.dataset.choice;
        const cOpt = PRACTICE_OPTIONS[cid];
        c.setAttribute("aria-pressed", String(cid === id));
        c.classList.add("is-revealed");
        c.dataset.verdict = cOpt.correct ? "right" : cid === id ? "wrong" : "other";
      });

      verdict.dataset.state = opt.correct ? "right" : "wrong";
      if (vTitle) vTitle.textContent = opt.title;
      if (vText) vText.textContent = opt.detail;
    });
  });
}

// ---------- 08 节：原海报灯箱缩放与拖动 ----------
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-btn");
  const dialog = document.getElementById("poster-modal");
  const closeBtn = document.getElementById("modal-close");
  const zoomInBtn = document.getElementById("modal-zoom-in");
  const zoomOutBtn = document.getElementById("modal-zoom-out");
  const resetBtn = document.getElementById("modal-zoom-reset");
  const viewport = document.getElementById("modal-viewport");
  const img = document.getElementById("modal-img");
  const posterImg = document.getElementById("poster");
  if (!openBtn || !dialog || !img || !posterImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function apply() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }
  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  }

  openBtn.addEventListener("click", () => {
    // 复用页面里已内联的 poster.webp，不重复打包图片
    if (!img.getAttribute("src")) img.src = posterImg.src;
    reset();
    dialog.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn?.focus();
  });

  function close() {
    dialog.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  window.addEventListener("keydown", (e) => {
    if (dialog.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") {
      scale = Math.min(3, +(scale + 0.35).toFixed(2));
      apply();
    } else if (e.key === "-") {
      scale = Math.max(1, +(scale - 0.35).toFixed(2));
      if (scale === 1) {
        tx = 0;
        ty = 0;
      }
      apply();
    }
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    apply();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.35).toFixed(2));
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });
  resetBtn?.addEventListener("click", reset);

  viewport?.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(1, Math.min(3, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });

  viewport?.addEventListener("pointerdown", (e) => {
    panning = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport?.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    apply();
  });
  viewport?.addEventListener("pointerup", () => {
    panning = false;
  });
  viewport?.addEventListener("pointercancel", () => {
    panning = false;
  });
}
