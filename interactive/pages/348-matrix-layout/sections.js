// 348 矩阵页 幻灯片版式 — 正文七节（01–07）独立交互与核实数据模块
// 严守：相邻两节绝不用同一种控件做同一件事；历史年份与文献严格出自核实来源。

// ---------- 01 双轴正交推演仪（滑杆控制相关系数 r -> SVG 实时重算 12 个议题落点） ----------
const ORTHO_BASE_POINTS = [
  { id: 1, u: -0.78, v: 0.72, name: "架构升级" },
  { id: 2, u: -0.52, v: 0.56, name: "流程沉淀" },
  { id: 3, u: -0.26, v: 0.80, name: "人才梯队" },
  { id: 4, u: 0.74, v: 0.76, name: "故障抢修" },
  { id: 5, u: 0.50, v: 0.48, name: "大客续约" },
  { id: 6, u: 0.84, v: 0.28, name: "合规整改" },
  { id: 7, u: -0.76, v: -0.68, name: "旧表翻新" },
  { id: 8, u: -0.44, v: -0.36, name: "皮肤配色" },
  { id: 9, u: -0.22, v: -0.82, name: "零散调研" },
  { id: 10, u: 0.68, v: -0.58, name: "临时报送" },
  { id: 11, u: 0.42, v: -0.74, name: "跨组会务" },
  { id: 12, u: 0.82, v: -0.26, name: "常规审批" },
];

export function initSection01() {
  const slider = document.getElementById("s01-corr");
  const valEl = document.getElementById("s01-corr-val");
  const svg = document.getElementById("s01-svg");
  const statusEl = document.getElementById("s01-status");
  const axisXEl = document.getElementById("s01-axis-x");
  const axisYEl = document.getElementById("s01-axis-y");
  const statsEl = document.getElementById("s01-stats");
  if (!slider || !svg) return;

  function render() {
    const r = parseFloat(slider.value); // 0.00 .. 0.95
    const rPct = Math.round(r * 100);
    if (valEl) valEl.textContent = `r = ${r.toFixed(2)}`;

    // Cholesky 混合：x' = u, y' = r*u + sqrt(1 - r^2)*v
    const k = Math.sqrt(Math.max(0, 1 - r * r));
    const counts = { tl: 0, tr: 0, bl: 0, br: 0 };
    const pts = ORTHO_BASE_POINTS.map((p) => {
      const x = p.u;
      const y = Math.max(-0.92, Math.min(0.92, r * p.u + k * p.v));
      if (x < 0 && y >= 0) counts.tl++;
      else if (x >= 0 && y >= 0) counts.tr++;
      else if (x < 0 && y < 0) counts.bl++;
      else counts.br++;
      return { ...p, x, y };
    });

    const empty = Object.values(counts).filter((c) => c === 0).length;
    const offDiag = counts.tl + counts.br;

    // 重绘 SVG（视口 360×280，严格等比坐标区 280×220）
    const ox = 42;
    const oy = 30;
    const w = 276;
    const h = 216;
    const cx = ox + w / 2;
    const cy = oy + h / 2;

    const tlWarn = counts.tl === 0;
    const brWarn = counts.br === 0;

    const dotsMarkup = pts
      .map((p) => {
        const px = (cx + p.x * (w * 0.45)).toFixed(1);
        const py = (cy - p.y * (h * 0.44)).toFixed(1);
        const inFocus = p.x >= 0 && p.y >= 0;
        const fill = inFocus ? "#0A1428" : "#F9CB15";
        const stroke = inFocus ? "#0A1428" : "#FCFCFC";
        return `<circle cx="${px}" cy="${py}" r="5.5" fill="${fill}" stroke="${stroke}" stroke-width="1.5"><title>${p.name}</title></circle>`;
      })
      .join("");

    const diagOpacity = Math.max(0, (r - 0.35) / 0.6).toFixed(2);
    const xTitle = r >= 0.65 ? "重要性（与纵轴同义）→" : "紧急性（独立变量 X）→";
    const yTitle = r >= 0.65 ? "↑ 价值度（高度重合）" : "↑ 重要性（独立变量 Y）";

    svg.innerHTML = `
      <rect x="${ox}" y="${oy}" width="${w / 2 - 3}" height="${h / 2 - 3}" fill="${tlWarn ? "#9C1C26" : "#0043AE"}" stroke="#FCFCFC" stroke-width="1.5"/>
      <rect x="${cx + 3}" y="${oy}" width="${w / 2 - 3}" height="${h / 2 - 3}" fill="#F9CB15" stroke="#FCFCFC" stroke-width="1.5"/>
      <rect x="${ox}" y="${cy + 3}" width="${w / 2 - 3}" height="${h / 2 - 3}" fill="#0043AE" stroke="#FCFCFC" stroke-width="1.5"/>
      <rect x="${cx + 3}" y="${cy + 3}" width="${w / 2 - 3}" height="${h / 2 - 3}" fill="${brWarn ? "#9C1C26" : "#0043AE"}" stroke="#FCFCFC" stroke-width="1.5"/>
      <line x1="${ox + 10}" y1="${oy + h - 10}" x2="${ox + w - 10}" y2="${oy + 10}" stroke="#FF6B6B" stroke-width="2" stroke-dasharray="6 5" opacity="${diagOpacity}"/>
      <line x1="${ox - 10}" y1="${cy}" x2="${ox + w + 10}" y2="${cy}" stroke="#FCFCFC" stroke-width="1.5"/>
      <line x1="${cx}" y1="${oy - 10}" x2="${cx}" y2="${oy + h + 10}" stroke="#FCFCFC" stroke-width="1.5"/>
      <text x="${ox + 8}" y="${oy + 16}" fill="#FCFCFC" font-size="11" font-family="DM Mono, monospace">Q2 · ${counts.tl}项${tlWarn ? " (空)" : ""}</text>
      <text x="${cx + 11}" y="${oy + 16}" fill="#0A1428" font-size="11" font-weight="700" font-family="DM Mono, monospace">Q1 · ${counts.tr}项</text>
      <text x="${ox + 8}" y="${oy + h - 8}" fill="#D6E4FF" font-size="11" font-family="DM Mono, monospace">Q4 · ${counts.bl}项</text>
      <text x="${cx + 11}" y="${oy + h - 8}" fill="#FCFCFC" font-size="11" font-family="DM Mono, monospace">Q3 · ${counts.br}项${brWarn ? " (空)" : ""}</text>
      ${dotsMarkup}
      <text x="${cx}" y="${oy - 14}" text-anchor="middle" fill="#0B1733" font-size="12" font-weight="700">${yTitle}</text>
      <text x="${cx}" y="${oy + h + 22}" text-anchor="middle" fill="#0B1733" font-size="12" font-weight="700">${xTitle}</text>
    `;

    if (axisXEl) axisXEl.textContent = r >= 0.65 ? "重要性（近义重复）" : "紧急性（独立轴）";
    if (axisYEl) axisYEl.textContent = r >= 0.65 ? "价值度（近义重复）" : "重要性（独立轴）";

    if (statsEl) {
      statsEl.textContent = `左上 ${counts.tl} · 右上 ${counts.tr} · 左下 ${counts.bl} · 右下 ${counts.br}（反对角落点 ${offDiag}/12）`;
    }

    if (statusEl) {
      if (r < 0.35) {
        statusEl.className = "s01-verdict is-ok";
        statusEl.innerHTML = `<strong>正交成立（相关度 ${rPct}% · 空象限 ${empty} 格）</strong>：12 个事项均匀铺开到四个象限，每一格都代表一种真实的权衡组合，四格面积物尽其用。`;
      } else if (r < 0.72) {
        statusEl.className = "s01-verdict is-mid";
        statusEl.innerHTML = `<strong>开始斜向漂移（相关度 ${rPct}% · 反对角仅剩 ${offDiag} 项）</strong>：两条轴有一部分在重复衡量同一件事，左上与右下象限逐渐变空，决策区分度正在衰减。`;
      } else {
        statusEl.className = "s01-verdict is-bad";
        statusEl.innerHTML = `<strong>退化成伪矩阵（相关度 ${rPct}% · 空置 ${empty} 格）</strong>：当两轴同义时，所有点被迫排成一条从左下到右上的斜线——花了一整张四象限版面，其实只表达了一个维度的排序。`;
      }
    }
  }

  slider.addEventListener("input", render);
  render();
}

// ---------- 02 只亮一格与结构平齐解剖盘（原生按钮组，完全不同于 01 的滑杆） ----------
const S02_MODES = {
  poster_q1: {
    active: ["tr"],
    tag: "原海报视角 · 抢险冲刺会",
    title: "仅亮右上「重点聚焦区」：立刻先救火",
    body: "原海报把 3/4 象限沉入深钴蓝，只给右上角「重要且紧急」铺满信号黄 #F9CB15。适合版本发版前夜或事故复盘会——让团队 1 秒对齐「今天先集中兵力突破什么」。",
  },
  covey_q2: {
    active: ["tl"],
    tag: "柯维视角（1989）· 季度战略会",
    title: "仅亮左上「长期规划区」：温和校订原海报的语境边界",
    body: "史蒂芬·柯维在《高效能人士的七个习惯》里特别指出：长期高效的团队要把重心投向「重要但不紧急」的第二象限，靠提前布局减少救火。同一张矩阵，会议目标变了，唯一亮黄的象限就该跟着换。",
  },
  all_blue: {
    active: [],
    tag: "反例 A · 0 格高亮",
    title: "四格全蓝平铺：分清了类别，却看不出立场",
    body: "没有视觉权重落差时，四块信息在眼球里完全平等。听众必须自己逐格读完四段话，再反问演讲者：「所以今天到底要我们拍板哪一格？」",
  },
  all_yellow: {
    active: ["tl", "tr", "bl", "br"],
    tag: "反例 B · 4 格全亮",
    title: "四角全涂信号黄：色彩通胀直接毁掉聚焦",
    body: "高亮之所以有效，全靠面积稀缺。当 100% 版面都在用高饱和明黄尖叫，明黄反而退化成了新的普通底色，既刺眼又丢失层级。",
  },
};

export function initSection02() {
  const modeBtns = document.querySelectorAll("[data-s02-mode]");
  const structBtns = document.querySelectorAll("[data-s02-struct]");
  const grid = document.getElementById("s02-grid");
  const readout = document.getElementById("s02-readout");
  if (!grid || !modeBtns.length) return;

  let curMode = "poster_q1";
  let curStruct = "parallel"; // "parallel" | "ragged"

  const RAGGED_COPY = {
    tl: ["长期规划区", "先沉淀一些中长期技术债和流程文档，最好每个季度都能安排骨干抽时间梳理一遍，不要等到系统出故障才补课。"],
    tr: ["重点聚焦区", "立即行动！"],
    bl: ["低优先区", "不重要也不紧急。", "可以不急着做。"],
    br: ["短期应对区", "把常规审批与报送交给标准模板或授权同伴处理，减少核心成员的上下文切换耗时，同时保持响应速度。"],
  };

  const PARALLEL_COPY = {
    tl: ["长期规划区", "重要但不紧急", "策略：提前布局，持续积累"],
    tr: ["重点聚焦区", "重要且紧急", "策略：集中精力，快速突破"],
    bl: ["低优先区", "不重要也不紧急", "策略：减少干预，定期回顾"],
    br: ["短期应对区", "紧急但不重要", "策略：提高效率，减少耗时"],
  };

  function render() {
    const cfg = S02_MODES[curMode];
    const cells = grid.querySelectorAll("[data-s02-cell]");
    cells.forEach((cell) => {
      const k = cell.dataset.s02Cell;
      const lit = cfg.active.includes(k);
      cell.classList.toggle("is-lit", lit);
      const lines = curStruct === "parallel" ? PARALLEL_COPY[k] : RAGGED_COPY[k];
      cell.querySelector(".s02-cell-title").textContent = lines[0];
      const p1 = cell.querySelector(".s02-cell-l1");
      const p2 = cell.querySelector(".s02-cell-l2");
      p1.textContent = lines[1] || "";
      p2.textContent = lines[2] || "";
      p2.hidden = !lines[2];
    });
    grid.classList.toggle("is-ragged", curStruct === "ragged");

    modeBtns.forEach((b) => {
      const active = b.dataset.s02Mode === curMode;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });
    structBtns.forEach((b) => {
      const active = b.dataset.s02Struct === curStruct;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });

    if (readout) {
      const structNote =
        curStruct === "parallel"
          ? "当前四格保持「区名 + 特征 + 策略」三行严格平齐，眼球横向扫过即可瞬间比对差异。"
          : "当前四格字数与结构参差不齐（有的只有 4 字，有的塞满一整段），视线会在最密的那一格被强行拖住，破坏横向对照。";
      readout.innerHTML = `
        <span class="s02-tag">${cfg.tag}</span>
        <h3>${cfg.title}</h3>
        <p>${cfg.body}</p>
        <p class="s02-struct-note">${structNote}</p>
      `;
    }
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curMode = b.dataset.s02Mode;
      render();
    })
  );
  structBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curStruct = b.dataset.s02Struct;
      render();
    })
  );
  render();
}

// ---------- 03 深蓝图暗室：六大经典矩阵图谱（6 组标本签 + 实时矢量坐标图） ----------
const ARCHETYPES = [
  {
    id: "eisenhower",
    name: "艾森豪威尔矩阵",
    en: "EISENHOWER / TIME MATRIX",
    axes: { top: "重要性高", bottom: "重要性低", left: "紧急性低", right: "紧急性高" },
    focus: "tr",
    focusNote: "抢险会亮右上；长期规划会改亮左上（柯维第二象限）",
    meeting: "周会排期 / 突发事件优先级对齐",
    cells: {
      tl: { t: "长期规划", s: "提前布局" },
      tr: { t: "重点聚焦", s: "立即突破" },
      bl: { t: "低优先区", s: "果断削减" },
      br: { t: "短期应对", s: "授权提效" },
    },
  },
  {
    id: "effort",
    name: "投入 × 影响矩阵",
    en: "EFFORT VS. IMPACT",
    axes: { top: "业务影响高", bottom: "业务影响低", left: "开发投入低", right: "开发投入高" },
    focus: "tl",
    focusNote: "焦点在「左上角」而非右上角：低成本换高回报的速赢区",
    meeting: "产品需求评审 / 迭代资源取舍",
    cells: {
      tl: { t: "速赢突破", s: "立刻上线" },
      tr: { t: "战略攻坚", s: "拆期立项" },
      bl: { t: "顺手补丁", s: "空档穿插" },
      br: { t: "重投低产", s: "果断暂缓" },
    },
  },
  {
    id: "bcg",
    name: "波士顿矩阵",
    en: "BCG GROWTH-SHARE (1970)",
    axes: { top: "市场增速高", bottom: "市场增速低", left: "相对份额低", right: "相对份额高" },
    focus: "br",
    focusNote: "预算守卫会可亮右下「现金牛」，增长会亮右上「明星」",
    meeting: "多业务线预算与现金流配置会",
    cells: {
      tl: { t: "问号业务", s: "精选押注" },
      tr: { t: "明星业务", s: "持续加码" },
      bl: { t: "瘦狗业务", s: "收缩退出" },
      br: { t: "现金牛", s: "稳收反哺" },
    },
  },
  {
    id: "ansoff",
    name: "安索夫矩阵",
    en: "ANSOFF GROWTH GRID (1957)",
    axes: { top: "新市场", bottom: "现有市场", left: "现有产品", right: "新产品" },
    focus: "bl",
    focusNote: "稳健期亮左下「市场渗透」（最低风险）；转型期亮右上「多元化」",
    meeting: "年度增长路径与风险边界评估",
    cells: {
      tl: { t: "市场开发", s: "拓新人群" },
      tr: { t: "多元化", s: "高风险探索" },
      bl: { t: "市场渗透", s: "深挖复购" },
      br: { t: "产品开发", s: "老客推新" },
    },
  },
  {
    id: "johari",
    name: "乔哈里视窗",
    en: "JOHARI WINDOW (1955)",
    axes: { top: "他人已知", bottom: "他人未知", left: "自己已知", right: "自己未知" },
    focus: "tl",
    focusNote: "通过反馈与自我揭示，把左上「公开区」面积不断推大",
    meeting: "团队复盘 / 跨职能透明协作工作坊",
    cells: {
      tl: { t: "公开区", s: "持续扩大" },
      tr: { t: "盲区", s: "倾听反馈" },
      bl: { t: "隐藏区", s: "适度坦诚" },
      br: { t: "未知区", s: "共同探索" },
    },
  },
  {
    id: "risk",
    name: "风险评估矩阵",
    en: "PROBABILITY VS. SEVERITY",
    axes: { top: "后果严重高", bottom: "后果严重低", left: "发生概率低", right: "发生概率高" },
    focus: "tr",
    focusNote: "亮右上「高概率·高损区」先做硬兜底，再为左上黑天鹅备预案",
    meeting: "上线前安全审计 / 项目红黄灯评审",
    cells: {
      tl: { t: "黑天鹅险", s: "预备兜底" },
      tr: { t: "红灯主险", s: "上线前清零" },
      bl: { t: "可接受区", s: "常态观察" },
      br: { t: "高频微损", s: "自动化拦截" },
    },
  },
];

export function initSection03() {
  const tabs = document.querySelectorAll("[data-s03-id]");
  const svg = document.getElementById("s03-svg");
  const info = document.getElementById("s03-info");
  if (!tabs.length || !svg || !info) return;

  let activeId = "eisenhower";

  function render() {
    const a = ARCHETYPES.find((x) => x.id === activeId) || ARCHETYPES[0];
    tabs.forEach((btn) => {
      const on = btn.dataset.s03Id === activeId;
      btn.setAttribute("aria-selected", String(on));
      btn.classList.toggle("is-active", on);
    });

    const box = (key, x, y, w, h) => {
      const lit = a.focus === key;
      const cell = a.cells[key];
      const bg = lit ? "#F9CB15" : "#0B2C75";
      const fg = lit ? "#0A1428" : "#FCFCFC";
      const sub = lit ? "#1E2D4C" : "#C9DCFF";
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}" stroke="#FCFCFC" stroke-width="1.6"/>
        <text x="${x + 14}" y="${y + 32}" fill="${fg}" font-size="15" font-weight="900">${cell.t}</text>
        <rect x="${x + 14}" y="${y + 40}" width="22" height="2" fill="${fg}"/>
        <text x="${x + 14}" y="${y + 62}" fill="${sub}" font-size="12.5" font-weight="600">${cell.s}</text>
        ${lit ? `<text x="${x + w - 12}" y="${y + 20}" text-anchor="end" fill="#0A1428" font-size="11" font-family="DM Mono, monospace" font-weight="700">FOCUS</text>` : ""}
      `;
    };

    svg.innerHTML = `
      ${box("tl", 68, 36, 150, 96)}
      ${box("tr", 230, 36, 150, 96)}
      ${box("bl", 68, 144, 150, 96)}
      ${box("br", 230, 144, 150, 96)}
      <line x1="224" y1="22" x2="224" y2="254" stroke="#FCFCFC" stroke-width="1.6"/>
      <line x1="52" y1="138" x2="396" y2="138" stroke="#FCFCFC" stroke-width="1.6"/>
      <polygon points="224,18 219,27 229,27" fill="#FCFCFC"/>
      <polygon points="224,258 219,249 229,249" fill="#FCFCFC"/>
      <polygon points="48,138 57,133 57,143" fill="#FCFCFC"/>
      <polygon points="400,138 391,133 391,143" fill="#FCFCFC"/>
      <text x="224" y="13" text-anchor="middle" fill="#F9CB15" font-size="12.5" font-weight="700">${a.axes.top}</text>
      <text x="224" y="274" text-anchor="middle" fill="#D6E4FF" font-size="12" font-weight="600">${a.axes.bottom}</text>
      <text x="24" y="138" text-anchor="middle" fill="#D6E4FF" font-size="12" font-weight="600" writing-mode="tb">${a.axes.left}</text>
      <text x="424" y="138" text-anchor="middle" fill="#F9CB15" font-size="12.5" font-weight="700" writing-mode="tb">${a.axes.right}</text>
    `;

    const focusPosLabel = { tl: "左上象限", tr: "右上象限", bl: "左下象限", br: "右下象限" }[a.focus];
    info.innerHTML = `
      <div class="s03-en">${a.en}</div>
      <h3>${a.name}</h3>
      <dl class="s03-meta">
        <div><dt>典型焦点落点</dt><dd>${focusPosLabel} · ${a.cells[a.focus].t}</dd></div>
        <div><dt>为什么亮这一格</dt><dd>${a.focusNote}</dd></div>
        <div><dt>最适合的会议</dt><dd>${a.meeting}</dd></div>
      </dl>
    `;
  }

  tabs.forEach((btn) =>
    btn.addEventListener("click", () => {
      activeId = btn.dataset.s03Id;
      render();
    })
  );
  render();
}

// ---------- 04 四格矩阵从哪来（核实史实步进展开卡，绝不杜撰） ----------
const HISTORY_NODES = [
  {
    year: "1637",
    title: "笛卡尔《几何学》与正交参照思想",
    who: "René Descartes · 《方法谈》附录 La Géométrie",
    body: "法国哲学家兼数学家勒内·笛卡尔在《几何学》中把几何曲线与代数方程结合起来，为后世建立垂直相交的双轴平面坐标系打下基础。严谨地说，原著主要处理正量并按曲线选参考线，现代标准的四象限直角平面是在随后几个世纪逐步定型的。",
    quote: "Each point on a plane can be located by its ordered distance along two intersecting axes.",
    cite: "史实核验：Encyclopaedia Britannica — Cartesian coordinates",
  },
  {
    year: "1954",
    title: "艾森豪威尔演讲：转引「紧急与重要」",
    who: "Dwight D. Eisenhower · 1954 年 8 月 19 日，西北大学",
    body: "许多人以为艾森豪威尔亲手画了「艾森豪威尔矩阵」。核查加州大学圣塔芭芭拉分校美国总统项目档案可见：他在 1954 年世界基督教协进会致辞中明确说明，自己是转引某位前大学校长的话，用来说明现代领导者的两难困境，现场并未画成四象限格子。",
    quote: "I have two kinds of problems, the urgent and the important. The urgent are not important, and the important are never urgent.",
    cite: "一手档案：The American Presidency Project (UCSB) & Quote Investigator",
  },
  {
    year: "1955",
    title: "乔哈里视窗：2×2 首次进入认知沟通",
    who: "Joseph Luft & Harrington Ingham · UCLA 西部训练实验室",
    body: "两位美国心理学家把名字拼在一起命名了 Johari Window，用「自己已知 / 未知 × 他人已知 / 未知」把人际沟通拆为公开、盲区、隐藏、未知四格，证明四象限不仅能算几何，也能清晰切分抽象的人际与组织状态。",
    quote: "Four panes of awareness framed by what is known to self and what is known to others.",
    cite: "出处：Western Training Laboratory in Group Development, UCLA, 1955",
  },
  {
    year: "1957",
    title: "安索夫矩阵：商业战略的第一张 2×2",
    who: "H. Igor Ansoff · Harvard Business Review (Vol. 35, No. 5)",
    body: "战略管理先驱伊戈尔·安索夫在《哈佛商业评论》1957 年 9–10 月号发表《多元化战略》（Strategies for Diversification），以「现有/新产品 × 现有/新市场」构建了增长矩阵，首次把 2×2 变成企业高管权衡战略风险的标准视觉框架。",
    quote: "Product-market strategy mapped across present and new products against present and new markets.",
    cite: "出处：Harvard Business Review, Sept–Oct 1957, pp. 113–124",
  },
  {
    year: "1970",
    title: "波士顿矩阵：把 2×2 送上全球咨询幻灯片",
    who: "Bruce D. Henderson · BCG Perspectives No. 66《产品组合》",
    body: "波士顿咨询创始人布鲁斯·亨德森在 1970 年系统阐述了「市场增速 × 相对市场份额」四象限（明星、现金牛、问号、瘦狗）。它之所以风靡会议室半个世纪，靠的正是把复杂的现金流平衡压缩到一页就能拍板的视觉结构。",
    quote: "To be successful, a company should have a portfolio of products with different growth rates and different market shares.",
    cite: "一手文献：BCG Perspectives (1970), The Product Portfolio",
  },
  {
    year: "1989 / 2004",
    title: "柯维定型时间四象限与《2×2 矩阵的力量》",
    who: "Stephen R. Covey (1989) & Alex Lowy / Phil Hood (2004)",
    body: "1989 年史蒂芬·柯维在《高效能人士的七个习惯》第三习惯里把「重要 × 紧急」正式画成四象限时间管理矩阵并传遍职场；2004 年洛维与胡德在 Jossey-Bass 出版《2×2 矩阵的力量》，将商业中数十种 2×2 提炼为处理「两难张力」的视觉思维方法。",
    quote: "Great 2x2 frameworks tackle enduring dilemmas rather than collapsing reality into a one-dimensional list.",
    cite: "出版核验：Simon & Schuster (1989) / Jossey-Bass, Wiley (2004)",
  },
];

export function initSection04() {
  const buttons = document.querySelectorAll("[data-s04-idx]");
  const card = document.getElementById("s04-detail");
  if (!buttons.length || !card) return;

  let cur = 1; // 默认落到 1954 艾森豪威尔史实澄清，立刻带来阅读惊喜

  function render() {
    const h = HISTORY_NODES[cur] || HISTORY_NODES[0];
    buttons.forEach((b) => {
      const on = Number(b.dataset.s04Idx) === cur;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    card.innerHTML = `
      <div class="s04-year-big">${h.year}</div>
      <div class="s04-body-wrap">
        <h3>${h.title}</h3>
        <p class="s04-who">${h.who}</p>
        <p class="s04-text">${h.body}</p>
        <blockquote class="s04-quote" lang="en">“${h.quote}”</blockquote>
        <p class="s04-cite">${h.cite}</p>
      </div>
    `;
  }

  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      cur = Number(b.dataset.s04Idx);
      render();
    })
  );
  render();
}

// ---------- 05 什么时候别用矩阵（原生单选分诊器 + 串联同小类 344–350） ----------
const TRIAGE_CASES = {
  steps: {
    verdict: "别硬塞进矩阵 · 改用时间线或流程页",
    keep: false,
    reason: "你的信息有明确的先后顺序或因果流向（先 A 后 B 再 C）。硬切成 2×2 四象限会打断时间顺序，听众看完还得自己在脑中重新排队。",
    links: [
      { id: "346", label: "346 时间线页幻灯片版式", href: "https://layout.xiaoxiaodong.ai/346/play/" },
      { id: "347", label: "347 流程页幻灯片版式", href: "https://layout.xiaoxiaodong.ai/347/play/" },
    ],
  },
  single: {
    verdict: "别用矩阵稀释冲击 · 改用大数字或引语页",
    keep: false,
    reason: "当整页只需要听众记住一个压倒性的核心指标或一句定调金句时，四格框架只会把视觉注意力切成四份，削弱现场记忆点。",
    links: [
      { id: "344", label: "344 大数字页幻灯片版式", href: "https://layout.xiaoxiaodong.ai/344/play/" },
      { id: "345", label: "345 引语页幻灯片版式", href: "https://layout.xiaoxiaodong.ai/345/play/" },
    ],
  },
  continuous: {
    verdict: "别用粗粒度四象限硬切 · 改用数据图表页",
    keep: false,
    reason: "面对 20 个连续分布的量化样本或需要展示趋势斜率与精确数值差距时，强行划一条十字线做「高/低」二分会丢失关键精度（统计上的伪二分失真）。",
    links: [
      { id: "349", label: "349 数据图表页幻灯片版式", href: "https://layout.xiaoxiaodong.ai/349/play/" },
    ],
  },
  mood: {
    verdict: "别用理性坐标打断沉浸 · 改用全图页",
    keep: false,
    reason: "发布会开场或品牌宣言追求的是瞬间的情绪张力与视觉代入，而不是理性权衡取舍；硬加十字坐标与四格边框只会让画面显得像内部周报。",
    links: [
      { id: "350", label: "350 全图页幻灯片版式", href: "https://layout.xiaoxiaodong.ai/350/play/" },
    ],
  },
  tradeoff: {
    verdict: "正是矩阵页（348）的主场",
    keep: true,
    reason: "你需要同时权衡两个独立维度（例如投入与影响、紧急性与重要性），把候选项分成互斥四类，并当场点亮 1 个最该优先拍板的焦点区。",
    links: [],
  },
};

export function initSection05() {
  const radios = document.querySelectorAll('input[name="s05-triage"]');
  const out = document.getElementById("s05-result");
  if (!radios.length || !out) return;

  function render() {
    const checked = document.querySelector('input[name="s05-triage"]:checked');
    const key = checked ? checked.value : "steps";
    const c = TRIAGE_CASES[key] || TRIAGE_CASES.steps;
    const linkHtml = c.links.length
      ? `<div class="s05-links">${c.links
          .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">前往 ${l.label} ↗</a>`)
          .join("")}</div>`
      : "";
    out.className = `s05-result ${c.keep ? "is-keep" : "is-switch"}`;
    out.innerHTML = `
      <span class="s05-badge">${c.keep ? "推荐留用 348" : "建议转用同小类其他页"}</span>
      <h3>${c.verdict}</h3>
      <p>${c.reason}</p>
      ${linkHtml}
    `;
  }

  radios.forEach((r) => r.addEventListener("change", render));
  render();
}

// ---------- 06 实战诊断小练习（四张等比中性 SVG 选项，零剧透标签，单变量差异） ----------
const QUIZ_OPTIONS = [
  {
    key: "A",
    correct: false,
    axes: { top: "影响高", bottom: "影响低", left: "投入低", right: "投入高", show: true },
    lit: ["tl", "tr", "bl", "br"],
    why: "方案 A 虽然选对了「投入 × 影响」正交双轴且方向标完整，却把四个象限全部涂满信号黄。色彩面积失去稀缺性后，主焦点消失，听众无法一眼判断先做哪一格。",
  },
  {
    key: "B",
    correct: false,
    axes: { top: "价值高", bottom: "价值低", left: "重要低", right: "重要高", show: true },
    lit: ["tr"],
    why: "方案 B 看起来只亮了一格很干净，但仔细看轴端：纵轴「价值度」与横轴「重要性」高度同义。两轴没有形成成本与收益的张力，左上和右下变成空壳，属于伪矩阵。",
  },
  {
    key: "C",
    correct: true,
    axes: { top: "影响高", bottom: "影响低", left: "投入低", right: "投入高", show: true },
    lit: ["tl"],
    why: "完全正确！方案 C 同时守住了矩阵页的三条底线：①「开发投入 × 业务影响」真正正交；② 四端高低方向与箭头清晰可读；③ 仅高亮左上「低投入·高影响（速赢区）」，精准对齐下月优先排期的决策目标。",
  },
  {
    key: "D",
    correct: false,
    axes: { top: "", bottom: "", left: "", right: "", show: false },
    lit: ["tl"],
    why: "方案 D 的双轴和唯一高亮位置都对，却漏掉了四端的「高 / 低」极性标注和箭头。听众在会场里只能猜左上角到底是「低投入高影响」还是「高投入低影响」，矩阵的瞬时解码优势当场失效。",
  },
];

function buildQuizSvg(opt) {
  const cell = (k, x, y, title, sub) => {
    const isLit = opt.lit.includes(k);
    const bg = isLit ? "#F9CB15" : "#0B2C75";
    const fg = isLit ? "#0A1428" : "#FCFCFC";
    const subCol = isLit ? "#1D2C4A" : "#C8DCFF";
    return `
      <rect x="${x}" y="${y}" width="88" height="58" fill="${bg}" stroke="#FCFCFC" stroke-width="1.3"/>
      <text x="${x + 8}" y="${y + 20}" fill="${fg}" font-size="10.5" font-weight="800">${title}</text>
      <rect x="${x + 8}" y="${y + 26}" width="16" height="1.5" fill="${fg}"/>
      <text x="${x + 8}" y="${y + 42}" fill="${subCol}" font-size="9.2">${sub}</text>
    `;
  };
  const labels = opt.axes.show
    ? `
      <polygon points="140,12 136,19 144,19" fill="#FCFCFC"/>
      <polygon points="140,164 136,157 144,157" fill="#FCFCFC"/>
      <polygon points="36,88 43,84 43,92" fill="#FCFCFC"/>
      <polygon points="244,88 237,84 237,92" fill="#FCFCFC"/>
      <text x="140" y="9" text-anchor="middle" fill="#F9CB15" font-size="9.8" font-weight="700">${opt.axes.top}</text>
      <text x="140" y="175" text-anchor="middle" fill="#D6E4FF" font-size="9.5">${opt.axes.bottom}</text>
      <text x="20" y="88" text-anchor="middle" fill="#D6E4FF" font-size="9.5" writing-mode="tb">${opt.axes.left}</text>
      <text x="260" y="88" text-anchor="middle" fill="#F9CB15" font-size="9.8" font-weight="700" writing-mode="tb">${opt.axes.right}</text>
    `
    : `
      <text x="140" y="10" text-anchor="middle" fill="#9BB5E8" font-size="9">—</text>
      <text x="140" y="175" text-anchor="middle" fill="#9BB5E8" font-size="9">—</text>
    `;

  const titles =
    opt.key === "B"
      ? { tl: ["高价低重", "空置区"], tr: ["高价高重", "立刻执行"], bl: ["低价低重", "暂缓处理"], br: ["低价高重", "空置区"] }
      : { tl: ["速赢突破", "立刻排期"], tr: ["战略攻坚", "拆期立项"], bl: ["顺手补丁", "空档穿插"], br: ["重投低产", "暂缓立项"] };

  return `<svg viewBox="0 0 280 180" role="img" aria-label="方案 ${opt.key} 矩阵草图">
    <rect x="0" y="0" width="280" height="180" fill="#06225E"/>
    ${cell("tl", 48, 26, titles.tl[0], titles.tl[1])}
    ${cell("tr", 144, 26, titles.tr[0], titles.tr[1])}
    ${cell("bl", 48, 92, titles.bl[0], titles.bl[1])}
    ${cell("br", 144, 92, titles.br[0], titles.br[1])}
    <line x1="140" y1="16" x2="140" y2="160" stroke="#FCFCFC" stroke-width="1.3"/>
    <line x1="40" y1="88" x2="240" y2="88" stroke="#FCFCFC" stroke-width="1.3"/>
    ${labels}
  </svg>`;
}

export function initSection06() {
  const wrap = document.getElementById("s06-options");
  const fb = document.getElementById("s06-feedback");
  if (!wrap || !fb) return;

  let chosen = null;

  function render() {
    wrap.innerHTML = QUIZ_OPTIONS.map((opt) => {
      const isChosen = chosen === opt.key;
      const stateCls =
        chosen === null
          ? ""
          : opt.correct
            ? "is-correct"
            : isChosen
              ? "is-wrong"
              : "is-dim";
      return `
        <button type="button" class="quiz-card ${stateCls}" data-quiz-key="${opt.key}" aria-pressed="${isChosen}">
          <div class="quiz-svg-wrap">${buildQuizSvg(opt)}</div>
          <div class="quiz-label">
            <span class="quiz-code">方案 ${opt.key}</span>
            ${chosen !== null && opt.correct ? '<span class="quiz-mark is-ok">推荐答案</span>' : ""}
            ${chosen === opt.key && !opt.correct ? '<span class="quiz-mark is-err">存在偏差</span>' : ""}
          </div>
        </button>
      `;
    }).join("");

    wrap.querySelectorAll("[data-quiz-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        chosen = btn.dataset.quizKey;
        render();
      });
    });

    if (chosen === null) {
      fb.className = "s06-feedback";
      fb.innerHTML = `<p>点击上面任意一张矩阵草图提交判断（四张图仅各改了 1 个结构变量，请留心坐标轴词、方向标与信号黄数量）。</p>`;
    } else {
      const picked = QUIZ_OPTIONS.find((x) => x.key === chosen);
      const others = QUIZ_OPTIONS.filter((x) => x.key !== chosen)
        .map((x) => `<li><strong>方案 ${x.key}</strong>：${x.why}</li>`)
        .join("");
      fb.className = `s06-feedback ${picked.correct ? "is-ok" : "is-err"}`;
      fb.innerHTML = `
        <div class="s06-fb-head">
          <strong>${picked.correct ? "答对了 · 选中方案 C" : `再仔细看看 · 你选了方案 ${picked.key}`}</strong>
          <button type="button" class="btn-outline-light" id="s06-retry">重新作答</button>
        </div>
        <p class="s06-fb-main">${picked.why}</p>
        <ul class="s06-fb-list">${others}</ul>
      `;
      const retry = document.getElementById("s06-retry");
      if (retry) {
        retry.addEventListener("click", () => {
          chosen = null;
          render();
        });
      }
    }
  }

  render();
}

// ---------- 07 原海报灯箱（复用 #poster.src，绝不二次内联图片；支持缩放、拖动 draggable=false、Esc 退出） ----------
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const zoomImg = document.getElementById("lightbox-img");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  const scaleRead = document.getElementById("lb-scale");
  const stage = document.getElementById("lb-stage");

  if (!trigger || !posterImg || !dialog || !zoomImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseTx = 0;
  let baseTy = 0;

  function applyTransform() {
    zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (scaleRead) scaleRead.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLightbox() {
    if (!zoomImg.getAttribute("src")) {
      zoomImg.src = posterImg.currentSrc || posterImg.src;
    }
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeLightbox() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  resetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      scale = Math.max(0.75, Math.min(3, +(scale + delta).toFixed(2)));
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  zoomImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    baseTx = tx;
    baseTy = ty;
    zoomImg.setPointerCapture(e.pointerId);
  });
  zoomImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = baseTx + (e.clientX - startX);
    ty = baseTy + (e.clientY - startY);
    applyTransform();
  });
  zoomImg.addEventListener("pointerup", () => {
    dragging = false;
  });

  document.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") {
      e.preventDefault();
      closeLightbox();
    }
  });
}
