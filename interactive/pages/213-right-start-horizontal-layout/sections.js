// 213 横排右起 · 01–07 七大节独立交互模块（每节控件互不重复）

// =========================================================================
// 01 节：右锚为什么也能站稳 — 四拍视动分步解剖器 + 三种横幅结构对照
// =========================================================================
const S1_BEATS = [
  {
    step: 1,
    tag: "第 1 拍 · 破惯性停顿",
    title: "用大字重与绯红锚标，把第一眼稳稳吸到右侧",
    body: "现代读者看屏幕默认从左上角扫进来。若右侧只有普通小字，视线根本不会右移；必须靠特粗体量、强调色标与外侧留白把视觉重心抬高到左侧的 2 倍以上，才能一进画面就先把右眼锁住。",
    metric: "首落区域：右 75%–90%",
  },
  {
    step: 2,
    tag: "第 2 拍 · 垂直右轴收边",
    title: "眉标、主标、副标全部贴齐同一条右垂线",
    body: "一旦眼睛落在右侧，立刻需要一条干脆的边界确认「这是整个版面的起跑线」。把标题各行与短横统一右对齐，让右边像切纸刀裁过一样平齐，左边则自由长短透气。",
    metric: "右缘基准误差：0 px",
  },
  {
    step: 3,
    tag: "第 3 拍 · 中段梯度向左拉动",
    title: "靠渐散波点或线性留白，把视线温和地拽向左方",
    body: "读完右侧主题后，如果中间是一道死空白，左右两边会像两张割裂的贴纸。原海报用「右浓左淡」的粉红波点阵搭起视觉斜坡，顺手把视线一路牵引到次级卖点。",
    metric: "梯度流向：右密 → 左疏",
  },
  {
    step: 4,
    tag: "第 4 拍 · 左侧轻巧收束",
    title: "辅助信息退守左端、缩小体量，完成有序层级",
    body: "服务保障、展期、产地等辅助说明安放在最左端，用极细线性图标配小号字稳稳接住视线尾声。不抢风头，也不悬空，整张横幅形成从右到左「重 → 轻」的完整收束。",
    metric: "扫读折返：0 次（示意）",
  },
];

const S1_MODES = {
  "right-start": {
    label: "横排右起（右锚左展）",
    verdict: "右侧建立单一重锚，借梯度由右向左有序展开，适合宽横幅与视觉重点在右的版面。",
    badge: "单一右锚 · 零折返",
  },
  "left-start": {
    label: "普通横排左起",
    verdict: "最符合日常长文阅读惯性，顺势向右展开；但当右侧已放了核心商品或建筑主图时，文字全堆在左端会让画面两头撕扯。",
    badge: "默认左起 · 常规流",
  },
  symmetric: {
    label: "左右均分对称",
    verdict: "左右两边一样重、一样宽时，眼睛进画后在两头来回犹豫，失去主次顺序与推动方向。",
    badge: "双头争焦 · 易犹豫",
  },
};

function initSection01() {
  const root = document.getElementById("s01-lab");
  if (!root) return;
  const modeBtns = [...root.querySelectorAll("[data-s1-mode]")];
  const beatBtns = [...root.querySelectorAll("[data-s1-beat]")];
  const svg = root.querySelector("#s01-svg");
  const modeVerdict = root.querySelector("#s01-mode-verdict");
  const modeBadge = root.querySelector("#s01-mode-badge");
  const beatTag = root.querySelector("#s01-beat-tag");
  const beatTitle = root.querySelector("#s01-beat-title");
  const beatBody = root.querySelector("#s01-beat-body");
  const beatMetric = root.querySelector("#s01-beat-metric");
  const nextBtn = root.querySelector("#s01-next-beat");

  let mode = "right-start";
  let beat = 1;

  function render() {
    modeBtns.forEach((b) => {
      const on = b.dataset.s1Mode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    beatBtns.forEach((b) => {
      const n = Number(b.dataset.s1Beat);
      b.classList.toggle("is-active", n === beat);
      b.classList.toggle("is-done", n < beat);
      b.setAttribute("aria-pressed", String(n === beat));
    });

    const m = S1_MODES[mode];
    modeVerdict.textContent = m.verdict;
    modeBadge.textContent = m.badge;

    const bInfo = S1_BEATS[beat - 1];
    beatTag.textContent = bInfo.tag;
    beatTitle.textContent = bInfo.title;
    beatBody.textContent = bInfo.body;
    beatMetric.textContent = bInfo.metric;

    // 切换 SVG 模式层与高亮拍位
    svg.dataset.mode = mode;
    svg.dataset.beat = String(beat);
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.s1Mode;
    render();
  }));
  beatBtns.forEach((b) => b.addEventListener("click", () => {
    beat = Number(b.dataset.s1Beat);
    mode = "right-start";
    render();
  }));
  nextBtn?.addEventListener("click", () => {
    mode = "right-start";
    beat = (beat % 4) + 1;
    render();
  });

  render();
}

// =========================================================================
// 02 节：两种右起，别混为一谈 — 真实 DOM 三轨标本显微镜
// =========================================================================
const PLAQUES = [
  {
    id: "zdgm",
    chars: ["正", "大", "光", "明"],
    place: "故宫乾清宫正殿匾额（顺治御笔原型）",
    colophon: "落款印章必居最左",
    note: "表面上是横向四字，本质是从右往左排开的 4 列「每列仅 1 字」的传统竖排——所以读完第 4 列「明」字后，落款自然落在最左侧。",
  },
  {
    id: "dxbd",
    chars: ["大", "雄", "宝", "殿"],
    place: "传统佛寺大殿门楣横额",
    colophon: "题年款识在左端",
    note: "受门楣高度限制无法竖写长行，工匠把每一纵列压成单字，仍恪守传统直排由右向左的列序；若误当成现代左起去读，就会念成「殿宝雄大」。",
  },
  {
    id: "rbz",
    chars: ["荣", "宝", "斋"],
    place: "传统老字号商号牌匾",
    colophon: "左缘铃印收尾",
    note: "传统三字商号同样遵循由右向左的列序，老匾至今保留这一形制以示渊源；但当代新招牌若做长句，则应优先顺应现代左起习惯。",
  },
];

function initSection02() {
  const root = document.getElementById("s02-lab");
  if (!root) return;
  const trackBtns = [...root.querySelectorAll("[data-s2-track]")];
  const panels = [...root.querySelectorAll("[data-s2-panel]")];
  const plaqueBtns = [...root.querySelectorAll("[data-plaque]")];
  const plaqueGrid = root.querySelector("#s02-plaque-grid");
  const plaquePlace = root.querySelector("#s02-plaque-place");
  const plaqueNote = root.querySelector("#s02-plaque-note");
  const plaqueColophon = root.querySelector("#s02-plaque-colophon");
  const plaqueOrderToggle = root.querySelector("#s02-plaque-order");
  const rtlDirToggle = root.querySelector("#s02-rtl-toggle");
  const rtlCard = root.querySelector("#s02-rtl-demo");
  const rtlStatus = root.querySelector("#s02-rtl-status");

  let activeTrack = "layout";
  let activePlaque = 0;
  let showOrder = true;
  let isRtl = true;

  function renderTrack() {
    trackBtns.forEach((b) => {
      const on = b.dataset.s2Track === activeTrack;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.s2Panel !== activeTrack;
    });
  }

  function renderPlaque() {
    const item = PLAQUES[activePlaque];
    plaqueBtns.forEach((b, i) => {
      b.classList.toggle("is-active", i === activePlaque);
      b.setAttribute("aria-pressed", String(i === activePlaque));
    });
    // 按物理从左到右放入 DOM，视觉上最右是第 1 字（chars[0]），最左是末字
    const visual = [...item.chars].reverse();
    plaqueGrid.innerHTML = visual
      .map((ch, idx) => {
        const readIdx = item.chars.length - idx;
        return `<span class="plaque-col"><span class="plaque-char">${ch}</span>${showOrder ? `<span class="plaque-ord">第 ${readIdx} 列</span>` : ""}</span>`;
      })
      .join("");
    plaquePlace.textContent = item.place;
    plaqueNote.textContent = item.note;
    plaqueColophon.textContent = item.colophon;
    plaqueOrderToggle.setAttribute("aria-pressed", String(showOrder));
    plaqueOrderToggle.textContent = showOrder ? "隐藏列序标号" : "显示一行一字列序";
  }

  function renderRtl() {
    rtlCard.setAttribute("dir", isRtl ? "rtl" : "ltr");
    rtlCard.dataset.dir = isRtl ? "rtl" : "ltr";
    rtlDirToggle.setAttribute("aria-pressed", String(isRtl));
    rtlDirToggle.textContent = isRtl ? '当前 dir="rtl" · 点切回 ltr 对照' : '当前 dir="ltr" · 点切为 rtl 镜像';
    rtlStatus.textContent = isRtl
      ? '已启用 dir="rtl"：起始边切到右侧，margin-inline-start 与返回箭头自动镜像；但时刻 14:30 与编号 #213 保持自左向右。'
      : '已切回 dir="ltr"：起始边回到左侧，同一份逻辑属性 CSS 无需改写即可双向切换。';
  }

  trackBtns.forEach((b) => b.addEventListener("click", () => {
    activeTrack = b.dataset.s2Track;
    renderTrack();
  }));
  plaqueBtns.forEach((b, i) => b.addEventListener("click", () => {
    activePlaque = i;
    renderPlaque();
  }));
  plaqueOrderToggle?.addEventListener("click", () => {
    showOrder = !showOrder;
    renderPlaque();
  });
  rtlDirToggle?.addEventListener("click", () => {
    isRtl = !isRtl;
    renderRtl();
  });

  renderTrack();
  renderPlaque();
  renderRtl();
}

// =========================================================================
// 03 节：从哪来：匾额到网页规范 — 深绯暗室年代卷轴抽屉
// =========================================================================
const HISTORY_NODES = [
  {
    id: "plaque",
    era: "传统东亚",
    year: "古代至近代",
    title: "古建牌匾与「一行一字」的右起横书",
    source: "屋名池诚《横書き登場：日本語表記の近代》（岩波新书，2003）",
    body: "东亚传统书写的本位是自上而下、列由右向左的直排。当门楣、牌坊、匾额或画卷引首高度有限、每列只写得下一个字时，就自然呈现为「从右向左横列」。语言学者屋名池诚指出，这类横额严格说来不是现代横排，而是压缩成「一行一字」的直排，因此题款与印章永远落在最左端。直到近代车体、老报眉与广告招牌，才陆续衍生出多字成行的右横书。",
    specimenTag: "一行一字 · 竖列右起缩影",
    specimenKind: "plaque",
  },
  {
    id: "reform",
    era: "东亚改制",
    year: "1942 — 1956",
    title: "公文与报刊转向左起，右起退居特定语境",
    source: "日本文化厅《公用文作成の要領》（1952.4.4）；《光明日报》（1955.1.1）；《人民日报》（1956.1.1）",
    body: "20 世纪中叶，为适应算式、外文与横排效率，东亚相继确立左起横排：日本国语审议会于 1942 年 7 月答申横书统一为左横书，战后于 1952 年 4 月 4 日经内阁官房长官依命通知《公用文作成の要領》全面推行公文左横书；中国于 1955 年 1 月 1 日由《光明日报》率先改版横排并发表《为本报改成横排告读者》，次年 1956 年 1 月 1 日《人民日报》全面改为左起横排。自此，中文日常阅读彻底左起，右起转而成为古建匾额与现代右锚视觉设计的专门手法。",
    specimenTag: "1955 — 1956 报刊横排改制",
    specimenKind: "reform",
  },
  {
    id: "bringhurst",
    era: "书籍排版",
    year: "1992",
    title: "西方经典书籍里的偶页右齐与边界警示",
    source: "Robert Bringhurst, The Elements of Typographic Style（Hartley & Marks, 1992）",
    body: "加拿大字体学者罗伯特·布林赫斯特在 1992 年首版的《字体排印风格要素》中把右对齐说得很透彻：对左起阅读的文字而言，右对齐强调的是行尾而不是行首，因此绝不适合大段长文；但在书籍对页里，偶数页（左页）的眉题与边注靠书脊或右缘采用右对齐，与奇数页左对齐形成镜像呼应，正是右锚在现代编排中最克制优雅的用法。",
    specimenTag: "双页跨页 · 偶页右齐 / 奇页左齐",
    specimenKind: "spread",
  },
  {
    id: "w3c",
    era: "网页标准",
    year: "2019 — 今",
    title: "Unicode 双向算法与 W3C 逻辑流布局",
    source: "Unicode UAX #9；W3C CSS Writing Modes Level 3（2019.12.10）；W3C CSS Logical Properties Level 1",
    body: "面对阿拉伯语、希伯来语、波斯语等数亿使用天然右起横排的读者，计算机界面不再靠手动反转字符串，而是把内存中的「逻辑顺序」交给 Unicode 双向算法（UAX #9）重排为屏幕上的「视觉顺序」。W3C 于 2019 年 12 月 10 日正式推荐 CSS Writing Modes Level 3，并配合 CSS Logical Properties 用 inline-start 替代写死的 left/right，让一套版面在左起与右起语境之间原生翻转。",
    specimenTag: "W3C 逻辑轴 · inline-start = right",
    specimenKind: "w3c",
  },
];

function initSection03() {
  const root = document.getElementById("s03-lab");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-era]")];
  const range = root.querySelector("#s03-era-range");
  const eraLabel = root.querySelector("#s03-era-label");
  const yearLabel = root.querySelector("#s03-year");
  const titleEl = root.querySelector("#s03-title");
  const bodyEl = root.querySelector("#s03-body");
  const sourceEl = root.querySelector("#s03-source");
  const specTag = root.querySelector("#s03-spec-tag");
  const specPanels = [...root.querySelectorAll("[data-spec]")];

  let idx = 0;

  function render() {
    const item = HISTORY_NODES[idx];
    btns.forEach((b, i) => {
      b.classList.toggle("is-active", i === idx);
      b.setAttribute("aria-selected", String(i === idx));
    });
    if (range) range.value = String(idx);
    eraLabel.textContent = item.era;
    yearLabel.textContent = item.year;
    titleEl.textContent = item.title;
    bodyEl.textContent = item.body;
    sourceEl.textContent = item.source;
    specTag.textContent = item.specimenTag;
    specPanels.forEach((p) => {
      p.hidden = p.dataset.spec !== item.specimenKind;
    });
  }

  btns.forEach((b, i) => b.addEventListener("click", () => {
    idx = i;
    render();
  }));
  range?.addEventListener("input", () => {
    idx = Number(range.value);
    render();
  });

  render();
}

// =========================================================================
// 04 节：什么时候用，什么时候别用 — 长文回扫压力实测机（单真源实测锯齿度）
// =========================================================================
const S4_LINES_POOL = [
  "右侧锚点在短标题里非常干脆，",
  "眼睛先踩住右边那条垂直靠山，",
  "再顺着留白把次要说明向左铺开。",
  "可一旦把右对齐硬套到更长的段落里，",
  "每行字数和标点长短并不一致，",
  "右侧虽平，左侧起点却成了参差锯齿。",
  "大脑扫完行尾准备向左回扫换行时，",
  "每次都要重找下一行起头躲在多远，",
  "行距再宽也抵消不了左缘晃动。",
  "右对齐强调的是行尾，而不是行首：",
  "短标、图注、偶页眉注适合右齐，",
  "要让人一口气读完的长文请用左起。",
];

const S4_SHORT_POOL = [
  "★ 节气新作 · 秋分茶会",
  "高山荒野白茶，慢焙留香",
  "十月廿四 · 东厅茶席敬候",
  "每日限量十二席，提前预约",
];

function initSection04() {
  const root = document.getElementById("s04-lab");
  if (!root) return;
  const genreBtns = [...root.querySelectorAll("[data-s4-genre]")];
  const lineRange = root.querySelector("#s04-lines");
  const lineOut = root.querySelector("#s04-lines-val");
  const linesWrap = root.querySelector("#s04-lines-wrap");
  const textSample = root.querySelector("#s04-text-sample");
  const tableSample = root.querySelector("#s04-table-sample");
  const ragMetric = root.querySelector("#s04-rag-px");
  const verdictBadge = root.querySelector("#s04-verdict-badge");
  const verdictText = root.querySelector("#s04-verdict-text");

  let genre = "prose"; // 'short' | 'prose' | 'table'
  let lineCount = 8;

  // 用真实字符宽估算每行长度并绘制真实 DOM 行与左缘锯齿标尺
  function measureLineRatio(str) {
    let u = 0;
    for (const ch of str) u += ch.charCodeAt(0) > 0x2e80 ? 1.0 : 0.56;
    return u;
  }

  function render() {
    genreBtns.forEach((b) => {
      const on = b.dataset.s4Genre === genre;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const isTable = genre === "table";
    linesWrap.hidden = isTable;
    textSample.hidden = isTable;
    tableSample.hidden = !isTable;

    if (isTable) {
      ragMetric.textContent = "小数点纵齐 · 0 px";
      verdictBadge.textContent = "数值列：强烈推荐右对齐";
      verdictBadge.dataset.state = "ok";
      verdictText.textContent = "数据表里的「金额、件数、百分比」是右对齐最硬核的日常主场：文字说明列保持左对齐便于扫词头，数值列统一右对齐（配等宽数字 tabular-nums），个位、十位与小数点严丝合缝纵向排开，扫一眼就知道哪一行最大。";
      return;
    }

    const pool = genre === "short" ? S4_SHORT_POOL : S4_LINES_POOL;
    const maxN = pool.length;
    lineRange.max = String(maxN);
    if (lineCount > maxN) lineCount = maxN;
    lineRange.value = String(lineCount);
    lineOut.textContent = `${lineCount} 行`;

    const shown = pool.slice(0, lineCount);
    const units = shown.map(measureLineRatio);
    const maxU = Math.max(...units);
    const minU = Math.min(...units);
    // 按 14.5px 正文字号换算真实左缘起读点最大差值
    const ragPx = Math.round((maxU - minU) * 14.5);

    textSample.innerHTML = shown
      .map((line, i) => {
        const diffPx = Math.round((maxU - units[i]) * 14.5);
        const warnLine = lineCount >= 5 && diffPx > 26;
        return `<div class="s4-line${warnLine ? " is-ragged" : ""}">
          <span class="s4-rag-tag" aria-hidden="true">${diffPx > 4 ? `+${diffPx}px` : "最左行"}</span>
          <span class="s4-line-text">${line}</span>
        </div>`;
      })
      .join("");

    ragMetric.textContent = `左缘最大跳差 ${ragPx} px`;

    if (lineCount <= 3) {
      verdictBadge.textContent = "短标 / 图注：右对齐清晰利落";
      verdictBadge.dataset.state = "ok";
      verdictText.textContent = `当前仅 ${lineCount} 行短信息，一眼即可整块收入视野，不需要频繁长距离换行回扫；统一右对齐反而把标题组锁成利落的右侧块面。`;
    } else if (lineCount <= 5) {
      verdictBadge.textContent = "临界带（4–5 行）：开始吃力";
      verdictBadge.dataset.state = "warn";
      verdictText.textContent = `到第 ${lineCount} 行时，左缘起读点前后跳动已达 ${ragPx} px。若非偶页边注或窄幅配图说明，继续加长就会拖慢扫读节奏。`;
    } else {
      verdictBadge.textContent = `长正文（${lineCount} 行）：切忌右对齐`;
      verdictBadge.dataset.state = "err";
      verdictText.textContent = `${lineCount} 行中文正文右对齐后，左缘起读位置锯齿跳动达 ${ragPx} px。读完每一行回扫时眼睛都要重新摸索下一行起点，极易串行疲劳——长文请切回横排左起。`;
    }
  }

  genreBtns.forEach((b) => b.addEventListener("click", () => {
    genre = b.dataset.s4Genre;
    lineCount = genre === "short" ? 3 : 8;
    render();
  }));
  lineRange?.addEventListener("input", () => {
    lineCount = Number(lineRange.value);
    render();
  });

  render();
}

// =========================================================================
// 05 节：做好右锚的四条硬规矩 — 4 枚拟物拨动开关实时联动迷你茶会横幅
// =========================================================================
function initSection05() {
  const root = document.getElementById("s05-lab");
  if (!root) return;
  const toggles = [...root.querySelectorAll("[data-rule]")];
  const card = root.querySelector("#s05-mini-card");
  const scoreEl = root.querySelector("#s05-score");
  const noteEl = root.querySelector("#s05-live-note");

  const rules = {
    axis: true,
    weight: true,
    margin: true,
    bridge: false, // 默认关掉 1 条，让用户亲手点亮体会「中段波点桥」的差别！
  };

  function render() {
    toggles.forEach((btn) => {
      const k = btn.dataset.rule;
      const on = !!rules[k];
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
      const stateText = btn.querySelector(".rule-switch-state");
      if (stateText) stateText.textContent = on ? "已开启" : "已关闭";
    });

    card.dataset.axis = rules.axis ? "on" : "off";
    card.dataset.weight = rules.weight ? "on" : "off";
    card.dataset.margin = rules.margin ? "on" : "off";
    card.dataset.bridge = rules.bridge ? "on" : "off";

    const pass = Object.values(rules).filter(Boolean).length;
    scoreEl.textContent = `${pass} / 4 条达标`;
    scoreEl.dataset.ok = String(pass === 4);

    if (pass === 4) {
      noteEl.textContent = "四条硬规矩全部守住：右侧留白托住大字、右基准线齐平、主次拉开、中段波点平滑牵引向左端，整张横幅像一块整砖一样稳。";
    } else {
      const missing = [];
      if (!rules.axis) missing.push("右基准线散开（主副标右缘参差）");
      if (!rules.weight) missing.push("左右权重拉平（辅助列与主标抢第一眼）");
      if (!rules.margin) missing.push("右外侧留白消失（大字紧贴右框窒息）");
      if (!rules.bridge) missing.push("中段缺少渐散波点桥（左右割裂成两块）");
      noteEl.textContent = `当前缺口：${missing.join("；")}。点击开关逐条补齐，对比旁边预览卡的变化。`;
    }
  }

  toggles.forEach((btn) => btn.addEventListener("click", () => {
    const k = btn.dataset.rule;
    rules[k] = !rules[k];
    render();
  }));

  render();
}

// =========================================================================
// 06 节：眼力练习 — 仅差一个变量的 A/B/C/D 中性四选一
// =========================================================================
const QUIZ_EXPLAIN = {
  A: {
    ok: false,
    title: "方案 A 差在「右对齐基准线」",
    body: "主标锚在右侧、波点向左渐散、辅助在左都对，但焦点区三行字用了左对齐——右边边缘高低参差，右侧原点瞬间松散漏气。",
  },
  B: {
    ok: true,
    title: "选对了！方案 B 四项条件同时成立",
    body: "「素瓷新器」主副标稳稳锚定在右侧且严丝合缝右对齐，右外侧留出舒适呼吸边；中段绯红波点由右向左渐散牵引，左侧三项工艺亮点轻巧退让，形成清晰的单向右起阅读流。",
  },
  C: {
    ok: false,
    title: "方案 C 差在「主次权重反差」",
    body: "对齐和波点方向都没错，但左侧三条工艺标签放得太大并加上深绯底块，重量直逼右侧主标，读者的第一眼在左右两头来回拉扯。",
  },
  D: {
    ok: false,
    title: "方案 D 差在「中段波点牵引方向」",
    body: "主标右对齐、权重分配都正常，唯独中段波点装成了「左浓右淡」，视觉梯度把眼睛往右推回，与「由右向左延展」的信息流互相拧着。",
  },
};

function initSection06() {
  const root = document.getElementById("s06-quiz");
  if (!root) return;
  const cards = [...root.querySelectorAll("[data-choice]")];
  const feedback = root.querySelector("#s06-feedback");
  const fbBadge = root.querySelector("#s06-fb-badge");
  const fbTitle = root.querySelector("#s06-fb-title");
  const fbBody = root.querySelector("#s06-fb-body");
  const resetBtn = root.querySelector("#s06-reset");

  let picked = null;

  function render() {
    cards.forEach((c) => {
      const ch = c.dataset.choice;
      const isPicked = picked === ch;
      c.classList.toggle("is-picked", isPicked);
      c.classList.toggle("is-correct", picked !== null && ch === "B");
      c.classList.toggle("is-wrong", isPicked && ch !== "B");
      c.setAttribute("aria-pressed", String(isPicked));
    });

    if (!picked) {
      feedback.hidden = true;
      return;
    }
    const info = QUIZ_EXPLAIN[picked];
    feedback.hidden = false;
    feedback.dataset.ok = String(info.ok);
    fbBadge.textContent = info.ok ? "判断正确 · 方案 B" : `已选方案 ${picked} · 可继续点看其他方案`;
    fbTitle.textContent = info.title;
    fbBody.textContent = info.body;
  }

  cards.forEach((c) => c.addEventListener("click", () => {
    picked = c.dataset.choice;
    render();
  }));
  resetBtn?.addEventListener("click", () => {
    picked = null;
    render();
  });

  render();
}

// =========================================================================
// 07 节：原海报点击放大灯箱（支持缩放、指针拖拽平移、Esc 关闭，draggable="false"）
// =========================================================================
function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const zoomLabel = document.getElementById("lb-zoom-label");
  if (!trigger || !posterImg || !dialog || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    // 复用页面里唯一那份内联 data URI，绝不二次内联图片
    if (lbImg.src !== posterImg.src) lbImg.src = posterImg.src;
    resetView();
    dialog.hidden = false;
    document.body.classList.add("lb-open");
    closeBtn?.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.classList.remove("lb-open");
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === lbStage) close();
  });
  window.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(2.8, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.35).toFixed(2));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", resetView);

  lbStage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(1, Math.min(2.8, +(scale + delta).toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener("pointerdown", (e) => {
    if (scale <= 1.02) return;
    e.preventDefault();
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, bx: tx, by: ty };
    try { lbImg.setPointerCapture(e.pointerId); } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = drag.bx + (e.clientX - drag.sx);
    ty = drag.by + (e.clientY - drag.sy);
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { drag = null; });
  lbImg.addEventListener("pointercancel", () => { drag = null; });
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initPosterLightbox();
}
