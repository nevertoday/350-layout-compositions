// 159 浮动块版式 · 正文七节互动逻辑与原海报放大镜

export function initSections() {
  initXraySection();
  initElevationBench();
  initFailureCases();
  initHistoryTimeline();
  initResponsiveUnwind();
  initQuiz();
  initPosterLightbox();
}

// ---------- 01 · 暗网透视拉帘 ----------
function initXraySection() {
  const slider = document.getElementById("xray-slider");
  const overlay = document.getElementById("xray-overlay");
  const handle = document.getElementById("xray-handle");
  const modeBtns = [...document.querySelectorAll("[data-xray]")];
  const caption = document.getElementById("xray-caption");
  const chaosLayer = document.getElementById("xray-chaos-layer");
  const cleanLayer = document.getElementById("xray-clean-layer");
  const gridLayer = document.getElementById("xray-grid-layer");
  if (!slider || !overlay) return;

  const MODES = {
    surface: {
      pos: 0,
      chaos: false,
      text: "表层观感：四张卡片看起来自由错落、没有僵硬格子框，读者视线轻快地从深靛主卡滑向四周。",
    },
    xray: {
      pos: 58,
      chaos: false,
      text: "暗网透视：掀开表层后会发现，每张卡片的中心或边沿其实仍踩在隐藏的 12 列基准与对角视线上——松开的是框线，没松的是秩序。",
    },
    chaos: {
      pos: 100,
      chaos: true,
      text: "真散乱反例：如果连底层对齐和留白走廊都一并拆掉，四张卡片立刻撞车、歪斜、失去主次，变成随手乱扔的便利贴。",
    },
  };

  function setCut(pct) {
    const v = Math.max(0, Math.min(100, Number(pct)));
    slider.value = String(v);
    overlay.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    if (handle) handle.style.left = `${v}%`;
  }

  function setMode(mode) {
    const cfg = MODES[mode] || MODES.xray;
    modeBtns.forEach((b) => {
      const active = b.dataset.xray === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    if (chaosLayer) chaosLayer.style.display = cfg.chaos ? "block" : "none";
    if (cleanLayer) cleanLayer.style.display = cfg.chaos ? "none" : "block";
    if (gridLayer) gridLayer.style.display = cfg.chaos ? "none" : "block";
    setCut(cfg.pos);
    if (caption) caption.textContent = cfg.text;
  }

  slider.addEventListener("input", () => {
    const v = Number(slider.value);
    if (chaosLayer && chaosLayer.style.display === "block") {
      chaosLayer.style.display = "none";
      if (cleanLayer) cleanLayer.style.display = "block";
      if (gridLayer) gridLayer.style.display = "block";
    }
    setCut(v);
    modeBtns.forEach((b) => {
      const active = (v < 15 && b.dataset.xray === "surface") || (v >= 15 && b.dataset.xray === "xray");
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    if (caption) {
      caption.textContent =
        v < 15
          ? MODES.surface.text
          : `暗网透视 ${Math.round(v)}%：隐藏的 12 列纵线与斜向主轴托住了四张浮动块的视觉重心，所以「看着自由，读着不乱」。`;
    }
  });

  modeBtns.forEach((btn) => btn.addEventListener("click", () => setMode(btn.dataset.xray)));
  setMode("xray");
}

// ---------- 02 · 三层阴影与 Z 轴高程实验台 ----------
function initElevationBench() {
  const elevBtns = [...document.querySelectorAll("[data-elev]")];
  const chkUmbra = document.getElementById("chk-umbra");
  const chkPenumbra = document.getElementById("chk-penumbra");
  const chkAmbient = document.getElementById("chk-ambient");
  const chkTint = document.getElementById("chk-tint");
  const demoCard = document.getElementById("elev-demo-card");
  const demoBadge = document.getElementById("elev-demo-badge");
  const reading = document.getElementById("elev-reading");
  const cssOut = document.getElementById("elev-css");
  if (!demoCard) return;

  const LEVELS = {
    0: {
      tag: "L0 · 0dp 贴纸层",
      lift: 0,
      umbra: [0, 1, 2, 0, 0.04],
      penumbra: [0, 0, 0, 0, 0],
      ambient: [0, 0, 0, 0, 0],
      bg: "#F3F4FC",
      note: "0dp 紧贴底纸：没有投射距离，靠极轻表面色差与纸面区分，适合作为静态底板，本身没有悬浮感。",
    },
    4: {
      tag: "L1 · 4dp 轻浮层",
      lift: 5,
      umbra: [0, 2, 4, -1, 0.10],
      penumbra: [0, 5, 12, -2, 0.09],
      ambient: [0, 2, 18, 0, 0.06],
      bg: "#FAFAFF",
      note: "4dp 轻离纸面：紧致本影贴住底边，柔和半影刚刚散开，最适合次级说明卡与引言浮块。",
    },
    12: {
      tag: "L2 · 12dp 悬停层",
      lift: 12,
      umbra: [0, 4, 8, -2, 0.11],
      penumbra: [0, 12, 24, -4, 0.12],
      ambient: [0, 5, 32, 0, 0.08],
      bg: "#FFFFFF",
      note: "12dp 明确离纸：阴影开始变宽变软，卡片表面随高度显得更通透，适合主内容卡或被选中的交互浮块。",
    },
    20: {
      tag: "L3 · 20dp 主焦层",
      lift: 20,
      umbra: [0, 6, 12, -3, 0.12],
      penumbra: [0, 18, 36, -6, 0.14],
      ambient: [0, 8, 48, 0, 0.09],
      bg: "#FFFFFF",
      note: "20dp 视觉主角层：只留给全页最核心的一张主焦卡或被手指拎起的拖拽状态；全员都开到 20dp 反而会重新平权发脏。",
    },
  };

  let curDp = 12;

  function update() {
    const spec = LEVELS[curDp] || LEVELS[12];
    const rgb = chkTint && chkTint.checked ? "43, 51, 141" : "18, 18, 22";
    const parts = [];
    if (chkUmbra && chkUmbra.checked && spec.umbra[4] > 0) {
      const [x, y, b, s, a] = spec.umbra;
      parts.push(`${x}px ${y}px ${b}px ${s}px rgba(${rgb}, ${a})`);
    }
    if (chkPenumbra && chkPenumbra.checked && spec.penumbra[4] > 0) {
      const [x, y, b, s, a] = spec.penumbra;
      parts.push(`${x}px ${y}px ${b}px ${s}px rgba(${rgb}, ${a})`);
    }
    if (chkAmbient && chkAmbient.checked && spec.ambient[4] > 0) {
      const [x, y, b, s, a] = spec.ambient;
      parts.push(`${x}px ${y}px ${b}px ${s}px rgba(${rgb}, ${a})`);
    }

    demoCard.style.transform = `translateY(${-spec.lift}px)`;
    demoCard.style.backgroundColor = spec.bg;
    demoCard.style.boxShadow = parts.length ? parts.join(", ") : "none";
    if (demoBadge) demoBadge.textContent = spec.tag;

    let extra = "";
    if (!parts.length && curDp > 0) {
      extra = "（你关掉了全部三层阴影，卡片立刻失去高度锚点，看起来退回 0dp 扁平色块。）";
    } else if (chkTint && !chkTint.checked && curDp >= 12) {
      extra = "（关掉冷靛色相后改为纯灰黑投影，在浅蓝紫纸面上边缘略显沉闷发灰。）";
    }
    if (reading) reading.textContent = spec.note + extra;
    if (cssOut) {
      cssOut.textContent = parts.length
        ? `box-shadow:\n  ${parts.join(",\n  ")};`
        : "box-shadow: none; /* 零投影：仅靠边框与色差区分 */";
    }
  }

  elevBtns.forEach((b) => {
    b.addEventListener("click", () => {
      curDp = Number(b.dataset.elev);
      elevBtns.forEach((x) => {
        const active = Number(x.dataset.elev) === curDp;
        x.classList.toggle("is-active", active);
        x.setAttribute("aria-pressed", String(active));
      });
      update();
    });
  });
  [chkUmbra, chkPenumbra, chkAmbient, chkTint].forEach((c) => c && c.addEventListener("change", update));
  update();
}

// ---------- 03 · 五种翻车现场（深靛暗室 + 一键急救变形） ----------
function initFailureCases() {
  const caseBtns = [...document.querySelectorAll("[data-case]")];
  const rescueBtn = document.getElementById("btn-case-rescue");
  const stage = document.getElementById("case-stage");
  const badge = document.getElementById("case-state-badge");
  const titleEl = document.getElementById("case-title");
  const bodyEl = document.getElementById("case-body");
  const metricEl = document.getElementById("case-metric");
  if (!stage || !caseBtns.length) return;

  const CASES = [
    {
      id: "overlap",
      short: "01 贴纸盖字",
      badTitle: "次卡直接糊住主焦标题，重叠 34%",
      goodTitle: "急救完成：退让到 6% 边角轻触，正文全露",
      badBody: "把「叠压制造纵深」误解成随便互相压住。下层卡片正被遮住半句核心标题，眼睛不得不猜字，层次没出来，先把可读性毁了。",
      goodBody: "只让次级淡紫卡的左上空白角轻吻深靛主卡右下装饰边（重叠约 6%），前后 Z 轴关系立刻成立，且四张卡文字零遮挡。",
      badMetric: "正文遮挡 34% · 无法顺畅通读",
      goodMetric: "正文遮挡 0% · 装饰角轻叠 6%",
      badCards: [
        { x: 18, y: 20, w: 36, h: 52, rot: -4, z: 1, cls: "indigo", shadow: "normal" },
        { x: 34, y: 26, w: 34, h: 44, rot: 5, z: 3, cls: "white", shadow: "normal", warn: true },
        { x: 56, y: 42, w: 30, h: 42, rot: -3, z: 2, cls: "lilac", shadow: "normal" },
      ],
      goodCards: [
        { x: 12, y: 22, w: 35, h: 52, rot: -3.5, z: 3, cls: "indigo", shadow: "high" },
        { x: 52, y: 12, w: 34, h: 36, rot: 3, z: 2, cls: "white", shadow: "mid" },
        { x: 45, y: 52, w: 34, h: 36, rot: 2.5, z: 1, cls: "lilac", shadow: "low" },
      ],
    },
    {
      id: "tilt",
      short: "02 倾角狂甩",
      badTitle: "三张卡各甩 16°–22°，版面像打翻的便签盒",
      goodTitle: "急救完成：倾角收进 ±4° 内，动感稳住不晕眼",
      badBody: "倾斜角度一旦超过经验上限 ±8°，横排中文基线剧烈抖动，读者的视线在每个词尾都要重新校正水平，轻盈节奏瞬间变成躁动杂乱。",
      goodBody: "把所有卡片的倾角拉回 -3.5° 与 +3° 的克制微斜，只留一点离开绝对直角的呼吸弹性，既保留手工拼贴般的灵气又毫不费眼。",
      badMetric: "最大倾角 22° · 超出安全带 2.7 倍",
      goodMetric: "最大倾角 3.5° · 轻松水平扫读",
      badCards: [
        { x: 14, y: 22, w: 34, h: 48, rot: -20, z: 3, cls: "indigo", shadow: "mid", warn: true },
        { x: 52, y: 14, w: 34, h: 36, rot: 22, z: 2, cls: "white", shadow: "mid", warn: true },
        { x: 48, y: 54, w: 34, h: 36, rot: -16, z: 1, cls: "lilac", shadow: "mid", warn: true },
      ],
      goodCards: [
        { x: 14, y: 22, w: 34, h: 48, rot: -3.5, z: 3, cls: "indigo", shadow: "high" },
        { x: 53, y: 13, w: 34, h: 36, rot: 3, z: 2, cls: "white", shadow: "mid" },
        { x: 49, y: 53, w: 34, h: 36, rot: -2, z: 1, cls: "lilac", shadow: "low" },
      ],
    },
    {
      id: "flat",
      short: "03 全员平权",
      badTitle: "齐平对齐 + 零投影差，彻底退回扁平格子",
      goodTitle: "急救完成：拉开三级 Z 高程与垂直错位",
      badBody: "三张卡上沿齐平、等宽等高、投影全部压平在 1dp。没有第一落点，也没有前后景深，读者只能像读表格一样从左扫到右。",
      goodBody: "把深靛主焦卡抬到 18dp 最高层并放大面积，两张辅卡错开纵坐标分居 8dp 与 3dp，视线一秒先锁主焦再沿对角延展。",
      badMetric: "高程跨度 0dp · 视觉主次缺失",
      goodMetric: "高程跨度 15dp · 主焦落点清晰",
      badCards: [
        { x: 7, y: 26, w: 27, h: 48, rot: 0, z: 1, cls: "indigo", shadow: "flat", warn: true },
        { x: 37, y: 26, w: 27, h: 48, rot: 0, z: 1, cls: "white", shadow: "flat" },
        { x: 67, y: 26, w: 27, h: 48, rot: 0, z: 1, cls: "lilac", shadow: "flat" },
      ],
      goodCards: [
        { x: 11, y: 18, w: 36, h: 56, rot: 0, z: 3, cls: "indigo", shadow: "high" },
        { x: 53, y: 11, w: 35, h: 34, rot: 0, z: 2, cls: "white", shadow: "mid" },
        { x: 56, y: 52, w: 33, h: 36, rot: 0, z: 1, cls: "lilac", shadow: "low" },
      ],
    },
    {
      id: "island",
      short: "04 四角孤岛",
      badTitle: "卡片被推到边角极限，中间塌出一口空洞",
      goodTitle: "急救完成：向中心聚拢形成连贯留白溪流",
      badBody: "以为留白越多越高级，结果把卡片甩到画幅最外缘，卡片之间的距离远大于卡片自身宽度，格式塔接近性断裂，像三张毫无关系的散页。",
      goodBody: "让留白沿着画幅四周自然环抱，块与块之间保持约 0.25–0.45 倍卡宽的紧凑呼吸缝，整组模块既松弛又紧紧抱成一团。",
      badMetric: "块间跨距过大 · 中央空洞失联",
      goodMetric: "外放内聚 · 群岛呼吸连贯",
      badCards: [
        { x: 3, y: 5, w: 28, h: 34, rot: -2, z: 3, cls: "indigo", shadow: "high", warn: true },
        { x: 69, y: 6, w: 28, h: 30, rot: 2, z: 2, cls: "white", shadow: "mid", warn: true },
        { x: 68, y: 64, w: 28, h: 30, rot: -2, z: 1, cls: "lilac", shadow: "low", warn: true },
      ],
      goodCards: [
        { x: 16, y: 22, w: 34, h: 52, rot: -3, z: 3, cls: "indigo", shadow: "high" },
        { x: 54, y: 15, w: 32, h: 34, rot: 2.5, z: 2, cls: "white", shadow: "mid" },
        { x: 52, y: 54, w: 32, h: 33, rot: 2, z: 1, cls: "lilac", shadow: "low" },
      ],
    },
    {
      id: "muddy",
      short: "05 黑雾重影",
      badTitle: "全员拉满浓黑重影，空气感被脏雾吞没",
      goodTitle: "急救完成：改用浅蓝紫清透漫射影",
      badBody: "新手为了让卡片「浮得更明显」，常把纯黑投影的透明度和模糊半径猛拉到底，导致浅色底纸像沾了煤灰一样浑浊沉重。",
      goodBody: "降低透明度并把投影色相微调至与底色协调的深蓝紫（rgba 0.12–0.18），再按 Z 层拉出轻重梯度，版面立刻轻盈透亮。",
      badMetric: "阴影浓度 48% · 浅底显脏沉重",
      goodMetric: "分阶柔和冷影 · 清透悬浮",
      badCards: [
        { x: 13, y: 20, w: 35, h: 52, rot: -3, z: 3, cls: "indigo", shadow: "muddy", warn: true },
        { x: 53, y: 13, w: 33, h: 35, rot: 3, z: 2, cls: "white", shadow: "muddy", warn: true },
        { x: 49, y: 53, w: 33, h: 35, rot: 2, z: 1, cls: "lilac", shadow: "muddy", warn: true },
      ],
      goodCards: [
        { x: 13, y: 20, w: 35, h: 52, rot: -3, z: 3, cls: "indigo", shadow: "high" },
        { x: 53, y: 13, w: 33, h: 35, rot: 3, z: 2, cls: "white", shadow: "mid" },
        { x: 49, y: 53, w: 33, h: 35, rot: 2, z: 1, cls: "lilac", shadow: "low" },
      ],
    },
  ];

  let curIdx = 0;
  let rescued = false;

  // 创建 3 张可流畅过渡的 DOM 标本卡片
  stage.innerHTML = "";
  const nodes = [0, 1, 2].map((i) => {
    const el = document.createElement("div");
    el.className = "case-mini-card";
    el.innerHTML =
      i === 0
        ? `<span class="cmc-tag">01 主焦</span><span class="cmc-line w80"></span><span class="cmc-line w55"></span>`
        : i === 1
          ? `<span class="cmc-tag">02 引言</span><span class="cmc-line w75"></span><span class="cmc-line w60"></span>`
          : `<span class="cmc-tag">03 要点</span><span class="cmc-line w70"></span><span class="cmc-line w50"></span>`;
    stage.appendChild(el);
    return el;
  });

  function render() {
    const c = CASES[curIdx];
    const list = rescued ? c.goodCards : c.badCards;
    list.forEach((spec, idx) => {
      const el = nodes[idx];
      el.className = `case-mini-card is-${spec.cls} sh-${spec.shadow}${spec.warn ? " is-warn" : ""}`;
      el.style.left = `${spec.x}%`;
      el.style.top = `${spec.y}%`;
      el.style.width = `${spec.w}%`;
      el.style.height = `${spec.h}%`;
      el.style.zIndex = String(spec.z);
      el.style.transform = `rotate(${spec.rot}deg)`;
    });

    if (badge) {
      badge.textContent = rescued ? "急救后 · 正常浮动" : "翻车态 · 问题解剖";
      badge.className = `case-badge ${rescued ? "is-ok" : "is-bad"}`;
    }
    if (titleEl) titleEl.textContent = rescued ? c.goodTitle : c.badTitle;
    if (bodyEl) bodyEl.textContent = rescued ? c.goodBody : c.badBody;
    if (metricEl) metricEl.textContent = rescued ? c.goodMetric : c.badMetric;
    if (rescueBtn) {
      rescueBtn.textContent = rescued ? "还原翻车态对比" : "一键急救修复";
      rescueBtn.setAttribute("aria-pressed", String(rescued));
    }
  }

  caseBtns.forEach((b) => {
    b.addEventListener("click", () => {
      curIdx = Number(b.dataset.case);
      rescued = false;
      caseBtns.forEach((x) => {
        const active = Number(x.dataset.case) === curIdx;
        x.classList.toggle("is-active", active);
        x.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });

  if (rescueBtn) {
    rescueBtn.addEventListener("click", () => {
      rescued = !rescued;
      render();
    });
  }

  render();
}

// ---------- 04 · 1919–2021 构成史五标本时间轴 ----------
function initHistoryTimeline() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const yearEl = document.getElementById("era-year");
  const titleEl = document.getElementById("era-title");
  const textEl = document.getElementById("era-text");
  const sourceEl = document.getElementById("era-source");
  const svg = document.getElementById("era-svg");
  if (!btns.length || !svg) return;

  const ERAS = [
    {
      year: "1919–1923",
      title: "埃尔·利西茨基《普朗》(Proun) · 脱离重力的悬浮几何",
      text: "俄国构成主义设计师 El Lissitzky 把《普朗》系列称为「绘画与建筑之间的中转站」。几何体块不再安稳坐在地面基线上，而是悬浮在多向度开放空间中，靠比例差与斜向张力互相牵引——这是现代平面里「元素离地浮起」的源头之一。",
      source: "藏品文献：Guggenheim / MoMA 永久馆藏（1919–1923《Proun》与 1923《Proun Room》）",
      svg: `
        <rect x="0" y="0" width="320" height="200" fill="#F8FAFE"/>
        <line x1="28" y1="170" x2="292" y2="30" stroke="#DCEC80" stroke-width="2.5"/>
        <rect x="74" y="42" width="110" height="24" transform="rotate(-14 129 54)" fill="#2B338D"/>
        <rect x="138" y="84" width="96" height="66" transform="rotate(8 186 117)" fill="#D2CBFB"/>
        <circle cx="98" cy="134" r="24" fill="#5A4CC7"/>
        <rect x="196" y="48" width="44" height="44" transform="rotate(-8 218 70)" fill="#1D2148"/>
      `,
    },
    {
      year: "1928",
      title: "扬·奇肖尔德《新字体排印》 · 留白第一次成为主动角色",
      text: "Jan Tschichold 在柏林出版《Die neue Typographie》（1928），系统总结欧洲现代主义排版：告别古典居中对称，把白纸不再看成「没印字的剩余面积」，而是与黑字同等主动的构成块，靠不对称留白拉开视觉停顿与阅读节奏。",
      source: "出版核实：Die neue Typographie（柏林，1928）；加州大学出版社英译本（1995）与 MoMA 特展（2009–2010）",
      svg: `
        <rect x="0" y="0" width="320" height="200" fill="#F8FAFE"/>
        <rect x="34" y="24" width="14" height="152" fill="#2B338D"/>
        <rect x="64" y="34" width="128" height="20" fill="#1D2148"/>
        <rect x="64" y="64" width="88" height="8" fill="#5A4CC7"/>
        <rect x="172" y="106" width="112" height="58" fill="#EEEDFD" stroke="#2B338D" stroke-width="1.5"/>
        <rect x="184" y="120" width="76" height="7" fill="#2B338D"/>
        <rect x="184" y="135" width="58" height="6" fill="#5A4CC7"/>
        <line x1="64" y1="106" x2="156" y2="106" stroke="#C5D94A" stroke-width="3"/>
      `,
    },
    {
      year: "1934–1958",
      title: "阿列克谢·布罗多维奇《Harper's Bazaar》 · 跨页流动剧场",
      text: "担任《Harper's Bazaar》艺术总监的 24 年间，Alexey Brodovitch 把双页跨页看作一整张连续画布，用大面积负空间托起大小悬殊的影像与文字块，让翻页节奏像乐章一样有疾有徐，奠定了当代杂志浮动跨页的视觉语法。",
      source: "史料核实：Encyclopaedia Britannica — Alexey Brodovitch（1934–1958 任《Harper's Bazaar》艺术总监）",
      svg: `
        <rect x="0" y="0" width="320" height="200" fill="#F8FAFE"/>
        <line x1="160" y1="14" x2="160" y2="186" stroke="#D2CBFB" stroke-width="1.5" stroke-dasharray="4 4"/>
        <rect x="28" y="36" width="106" height="122" rx="4" fill="#2B338D"/>
        <circle cx="81" cy="84" r="22" fill="#DCEC80"/>
        <rect x="182" y="28" width="104" height="44" rx="4" fill="#FFFFFF" stroke="#D2CBFB" stroke-width="1.5"/>
        <rect x="194" y="42" width="70" height="7" fill="#2B338D"/>
        <rect x="194" y="55" width="52" height="5" fill="#5A4CC7"/>
        <rect x="142" y="112" width="132" height="54" rx="4" fill="#EEEDFD" stroke="#5A4CC7" stroke-width="1.2"/>
        <rect x="156" y="128" width="84" height="7" fill="#2B338D"/>
        <rect x="156" y="142" width="60" height="5" fill="#5A4CC7"/>
      `,
    },
    {
      year: "1981",
      title: "米勒-布罗克曼《网格系统》 · 先立秩序，破格才有力量",
      text: "瑞士设计师 Josef Müller-Brockmann 在 Niggli 出版社推出《Rastersysteme für die visuelle Gestaltung》（1981）。网格并不是为了把版面锁死，恰恰相反：只有底层存在可感知的秩序，少数脱离格线的「浮动破格块」才会产生张力与强调，而不是杂乱。",
      source: "出版核实：Verlag Niggli — Rastersysteme für die visuelle Gestaltung / Grid Systems in Graphic Design（1981）",
      svg: `
        <rect x="0" y="0" width="320" height="200" fill="#F8FAFE"/>
        <g stroke="#D2CBFB" stroke-width="1">
          <line x1="64" y1="16" x2="64" y2="184"/><line x1="128" y1="16" x2="128" y2="184"/>
          <line x1="192" y1="16" x2="192" y2="184"/><line x1="256" y1="16" x2="256" y2="184"/>
          <line x1="20" y1="66" x2="300" y2="66"/><line x1="20" y1="132" x2="300" y2="132"/>
        </g>
        <rect x="64" y="66" width="64" height="66" fill="#EEEDFD"/>
        <rect x="192" y="66" width="64" height="66" fill="#EEEDFD"/>
        <rect x="108" y="42" width="112" height="74" rx="8" fill="#2B338D" transform="rotate(-4 164 79)"/>
        <rect x="126" y="66" width="66" height="8" fill="#DCEC80" transform="rotate(-4 164 79)"/>
      `,
    },
    {
      year: "2014–2021",
      title: "Google Material Design (M2 → M3) · 数字化 Z 轴高程",
      text: "2014 年发布的 Material Design 将平面悬浮块推进到交互屏幕的 Z 轴：规定 0–24dp 高度标尺，用本影、半影、环境光三层阴影标识前后层序，并在 Material Design 3 进一步引入表面色调层级，让界面卡片无需沉重边框也能「浮」出清晰层级。",
      source: "官方文档核实：m2.material.io/design/environment/elevation.html & m3.material.io/styles/elevation/overview",
      svg: `
        <rect x="0" y="0" width="320" height="200" fill="#F8FAFE"/>
        <line x1="34" y1="164" x2="286" y2="164" stroke="#2B338D" stroke-width="1.5"/>
        <polygon points="88,128 190,128 214,164 64,164" fill="rgba(90,76,199,0.12)"/>
        <rect x="84" y="114" width="112" height="18" rx="6" fill="#EEEDFD" stroke="#5A4CC7" stroke-width="1.2"/>
        <polygon points="118,86 224,86 244,164 98,164" fill="rgba(43,51,141,0.10)"/>
        <rect x="114" y="70" width="114" height="20" rx="6" fill="#FFFFFF" stroke="#2B338D" stroke-width="1.5"/>
        <rect x="140" y="30" width="118" height="22" rx="7" fill="#2B338D"/>
        <circle cx="242" cy="41" r="4.5" fill="#DCEC80"/>
        <text x="36" y="156" fill="#484D78" font-size="10" font-family="Space Mono, monospace">0dp</text>
        <text x="36" y="124" fill="#484D78" font-size="10" font-family="Space Mono, monospace">4dp</text>
        <text x="36" y="82" fill="#484D78" font-size="10" font-family="Space Mono, monospace">12dp</text>
        <text x="36" y="44" fill="#2B338D" font-size="10" font-weight="700" font-family="Space Mono, monospace">20dp</text>
      `,
    },
  ];

  function showEra(idx) {
    const e = ERAS[idx] || ERAS[0];
    btns.forEach((b) => {
      const active = Number(b.dataset.era) === idx;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    if (yearEl) yearEl.textContent = e.year;
    if (titleEl) titleEl.textContent = e.title;
    if (textEl) textEl.textContent = e.text;
    if (sourceEl) sourceEl.textContent = e.source;
    svg.innerHTML = e.svg;
  }

  btns.forEach((b) => b.addEventListener("click", () => showEra(Number(b.dataset.era))));
  showEra(0);
}

// ---------- 05 · 多屏折叠退化测试器 ----------
function initResponsiveUnwind() {
  const btns = [...document.querySelectorAll("[data-bp]")];
  const frame = document.getElementById("bp-frame");
  const readout = document.getElementById("bp-readout");
  if (!frame || !btns.length) return;

  const NOTES = {
    desktop: "1280px 宽屏：纸面横向富余，四张卡可以保留 -3°~+4° 轻斜、3–6% 边角轻叠与三级投影，形成画册级错落流动。",
    tablet: "768px 平板：横向空间收窄，此时应先解除互相叠压、将倾角收敛到 ±1.5° 以内，改为错位双列保持呼吸感。",
    mobile: "375px 手机：绝不能在窄屏里硬留歪斜叠压！归正为 0° 单列，用轻微左右缩进错位、充足段间留白与轻柔阴影保留「浮动感」。",
  };

  function setBp(bp) {
    frame.dataset.mode = bp;
    btns.forEach((b) => {
      const active = b.dataset.bp === bp;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    if (readout) readout.textContent = NOTES[bp] || NOTES.desktop;
  }

  btns.forEach((b) => b.addEventListener("click", () => setBp(b.dataset.bp)));
  setBp("desktop");
}

// ---------- 06 · 单变量四选一图文小练习 ----------
function initQuiz() {
  const opts = [...document.querySelectorAll("[data-quiz]")];
  const feedback = document.getElementById("quiz-feedback");
  if (!opts.length || !feedback) return;

  const ANSWERS = {
    A: {
      ok: false,
      title: "方案 A · 四块平权（缺少视觉主焦与前后纵深）",
      body: "四张卡片虽然没有撞车，但全都停在 L1（4dp）且阴影深浅完全一致。眼睛进来时四张卡抢着说话，缺少「浮出纸面」的强弱节奏。",
    },
    B: {
      ok: true,
      title: "选对了！方案 B · 三级纵深 + 装饰角轻叠 6%",
      body: "深靛主卡独自升至 L3（18dp）拿下第一落点；两张辅卡居 L2（8dp），仅在无字装饰边角轻触 6% 交代前后空间；底卡退居 L1（2dp）。主次分明、留白通畅、文字零遮挡。",
    },
    C: {
      ok: false,
      title: "方案 C · 双主抢戏且正文被遮 24%",
      body: "两张卡同时升到 L3（20dp）争夺视觉中心，更糟的是重叠区切进了正文区域 24%，纵深变成了阅读障碍。",
    },
    D: {
      ok: false,
      title: "方案 D · 重影发脏且主次倒置",
      body: "四张卡一律配了浓黑大阴影把浅纸抹脏，同时次级淡紫卡反盖在深靛主卡上方，视觉权重与空间高度互相打架。",
    },
  };

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.quiz;
      const ans = ANSWERS[key];
      opts.forEach((b) => {
        b.classList.remove("is-selected", "is-correct", "is-wrong");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-selected", ans.ok ? "is-correct" : "is-wrong");
      btn.setAttribute("aria-pressed", "true");
      feedback.hidden = false;
      feedback.className = `quiz-feedback ${ans.ok ? "is-ok" : "is-bad"}`;
      feedback.innerHTML = `<strong>${ans.title}</strong><p>${ans.body}</p>`;
    });
  });
}

// ---------- 07 · 原海报放大镜（支持缩放、鼠标/触屏拖拽、Esc 关闭） ----------
function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("modal-poster-img");
  const closeBtn = document.getElementById("modal-close");
  const zoomBtns = [...document.querySelectorAll("[data-zoom]")];
  const viewport = document.getElementById("modal-viewport");
  if (!trigger || !modal || !modalImg || !posterImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomBtns.forEach((b) => {
      const active = Number(b.dataset.zoom) === scale;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  function open() {
    modalImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn && closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn && closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  zoomBtns.forEach((b) => {
    b.addEventListener("click", () => {
      scale = Number(b.dataset.zoom);
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    });
  });

  if (viewport) {
    viewport.addEventListener("pointerdown", (e) => {
      if (scale <= 1) return;
      drag = { x: e.clientX, y: e.clientY, tx, ty };
      viewport.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!drag) return;
      tx = drag.tx + (e.clientX - drag.x);
      ty = drag.ty + (e.clientY - drag.y);
      applyTransform();
    });
    const end = () => {
      drag = null;
    };
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
  }
}
