// 212 横排左起 · 正文七节独立交互组件
// 每节使用不同交互机制：01 滑动阅读窗、02 透视拉帘、03 五时代史料标本、04 五组件真属性开关、05 四场景验真卡、06 单变量盲测、07 原海报灯箱

// ---------- 01：不对称知觉广度 · 滑动阅读窗（Inhoff & Liu 1998；Rayner 1998） ----------
export function mountSpanLab() {
  const root = document.getElementById("span-lab");
  if (!root) return;

  const SAMPLES = {
    zh: {
      label: "中文（左 1 · 右 3 字）",
      leftSpan: 1,
      rightSpan: 3,
      text: "当每一行都在左侧同一条基准轴起步，视线回扫落点稳定，就能顺着右侧预览窗一路读下去。",
      source: "Inhoff & Liu (1998) 移动窗口眼动实验：中文读者单次注视有效知觉广度约为注视点左侧 1 字、右侧 3 字（总计约 5 字宽）。",
    },
    en: {
      label: "英文（左 4 · 右 14 字母）",
      leftSpan: 4,
      rightSpan: 14,
      text: "When every line starts cleanly on one shared left axis, return sweeps land accurately and preview flows rightward.",
      source: "Keith Rayner (1998) 眼动综述：英语等拉丁字母阅读者的知觉广度约为注视点左侧 3–4 个字母、右侧 14–15 个字母。",
    },
  };

  let lang = "zh";
  let pos = 5;
  let playing = false;
  let timer = 0;

  const stripEl = root.querySelector("#span-strip");
  const rangeEl = root.querySelector("#span-range");
  const posOut = root.querySelector("#span-pos");
  const noteEl = root.querySelector("#span-note");
  const playBtn = root.querySelector("#span-play");
  const langBtns = [...root.querySelectorAll("[data-span-lang]")];

  function render() {
    const cfg = SAMPLES[lang];
    const chars = [...cfg.text];
    pos = Math.max(0, Math.min(chars.length - 1, pos));
    rangeEl.max = String(chars.length - 1);
    rangeEl.value = String(pos);

    const frag = document.createDocumentFragment();
    chars.forEach((ch, i) => {
      const sp = document.createElement("span");
      sp.textContent = ch;
      if (i === pos) {
        sp.className = "sp-ch is-fix";
      } else if (i >= pos - cfg.leftSpan && i < pos) {
        sp.className = "sp-ch is-left";
      } else if (i > pos && i <= pos + cfg.rightSpan) {
        sp.className = "sp-ch is-right";
      } else {
        sp.className = "sp-ch is-blur";
      }
      frag.appendChild(sp);
    });
    stripEl.replaceChildren(frag);
    stripEl.dataset.lang = lang;

    const unit = lang === "zh" ? "字" : "字符";
    const fixChar = chars[pos] === " " ? "空格" : `「${chars[pos]}」`;
    posOut.textContent = `注视第 ${pos + 1} ${unit} ${fixChar} · 左侧余光 ${cfg.leftSpan} ${unit} / 右侧预览 ${cfg.rightSpan} ${unit}`;
    noteEl.textContent = cfg.source;

    langBtns.forEach((b) => {
      const on = b.dataset.spanLang === lang;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
  }

  function stopPlay() {
    playing = false;
    clearInterval(timer);
    timer = 0;
    playBtn.textContent = "自动扫读";
    playBtn.setAttribute("aria-pressed", "false");
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      stopPlay();
      lang = btn.dataset.spanLang;
      pos = lang === "zh" ? 5 : 12;
      render();
    });
  });

  rangeEl.addEventListener("input", () => {
    stopPlay();
    pos = Number(rangeEl.value);
    render();
  });

  playBtn.addEventListener("click", () => {
    if (playing) {
      stopPlay();
      return;
    }
    playing = true;
    playBtn.textContent = "暂停扫读";
    playBtn.setAttribute("aria-pressed", "true");
    const step = lang === "zh" ? 2 : 5;
    timer = setInterval(() => {
      const max = [...SAMPLES[lang].text].length - 1;
      pos = pos + step > max ? 0 : pos + step;
      render();
    }, 340);
  });

  render();
}

// ---------- 02：原海报好坏透视拉帘 ----------
export function mountCurtainLab() {
  const root = document.getElementById("curtain-lab");
  if (!root) return;

  const stage = root.querySelector("#curtain-stage");
  const range = root.querySelector("#curtain-range");
  const pctOut = root.querySelector("#curtain-pct");
  const caption = root.querySelector("#curtain-caption");
  const checks = [...root.querySelectorAll("[data-xray]")];

  let split = 52;
  let dragging = false;

  function applySplit(val) {
    split = Math.max(10, Math.min(90, Math.round(val)));
    stage.style.setProperty("--split", `${split}%`);
    range.value = String(split);
    pctOut.textContent = `左起正确例 ${split}% / 错位散乱例 ${100 - split}%`;
    if (split >= 72) {
      caption.textContent = "拉帘偏右：完整看到原海报左侧「正确示例」——金色点与标题、中英文正文全部锁在一条竖直左起轴上，回扫落点完全可预测。";
    } else if (split <= 28) {
      caption.textContent = "拉帘偏左：完整露出原海报右侧「错误示例」——标题、正文、英译各自起行偏位，左缘参差不齐，每换一行都要重新寻址。";
    } else {
      caption.textContent = "拉帘居中对比：同一句「高效沟通，始于清晰的排版」，只改变了起读左缘是否对齐，阅读轻松感立刻天差地别。";
    }
  }

  function applyXray() {
    for (const cb of checks) {
      stage.classList.toggle(`xray-${cb.dataset.xray}`, cb.checked);
    }
  }

  range.addEventListener("input", () => applySplit(Number(range.value)));
  checks.forEach((cb) => cb.addEventListener("change", applyXray));

  // 画布舞台直接横向拖动拉帘
  function updateFromClientX(clientX) {
    const r = stage.getBoundingClientRect();
    if (r.width < 20) return;
    applySplit(((clientX - r.left) / r.width) * 100);
  }

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    try { stage.setPointerCapture(e.pointerId); } catch {}
    updateFromClientX(e.clientX);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  });
  stage.addEventListener("pointerup", (e) => {
    dragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch {}
  });

  applySplit(52);
  applyXray();
}

// ---------- 03：1915–2019 汉字横排演进时间轴 ----------
export function mountHistoryLab() {
  const root = document.getElementById("history-lab");
  if (!root) return;

  const ERAS = [
    {
      year: "1915",
      short: "《科学》创刊",
      title: "1915 年 1 月 · 中国科学社《科学》第 1 卷第 1 期",
      badge: "旁行上左",
      summary: "中国近代最早采用自左向右横排与新式标点的综合性科学期刊。创刊号《例言》直白写明原因：「本杂志印法，旁行上左，并用西文句读点之，以便插写算术及物理化学诸程式。」",
      specimenTitle: "科学 · 第一卷第一期（1915）",
      specimenBody: "物体加速度 a 与所受合外力 F 成正比：F = ma。自左向右横行，则西文算式与中文句读顺势衔接，不致横直相抵。",
      specimenMeta: "横排 + 新式句读 + 行内算式直排",
      mode: "science1915",
    },
    {
      year: "1917",
      short: "《新青年》倡议",
      title: "1917 年 5 月 · 钱玄同致陈独秀书（《新青年》第 3 卷第 3 号）",
      badge: "目力横扫",
      summary: "钱玄同在《新青年》通信栏公开倡议汉字改用左起横排，并从生理构造与混排实用角度论证：「人目系左右相并，而非上下相重……知看横行较易于直行……若从西文写法，自左至右横迤而出，则无一不便。」",
      specimenTitle: "新青年 · 通信（1917）",
      specimenBody: "「人目左右相并，看横行较易于直行。」同年 7–8 月第 3 卷第 5、6 号中，钱玄同再次力促书刊改横式。",
      specimenMeta: "新文化运动文字排版改革思潮",
      mode: "xinqingnian1917",
    },
    {
      year: "1955",
      short: "《光明日报》改横",
      title: "1955 年 1 月 1 日 · 《光明日报》在全国大报中率先改横排",
      badge: "报业破冰",
      summary: "《光明日报》在 1955 年元旦正式由传统竖排改为自左向右横排，并刊发《为本报改成横排告读者》，成为新中国全国性大报推行横排的第一块里程碑。",
      specimenTitle: "光明日报 · 1955 年 1 月 1 日",
      specimenBody: "为本报改成横排告读者：横排横写符合现代科学文献与日常书写习惯，标题与正文均自左向右依次展开。",
      specimenMeta: "全国大报首例全面左起横排",
      mode: "gmrb1955",
    },
    {
      year: "1956",
      short: "《人民日报》改横",
      title: "1956 年 1 月 1 日 · 《人民日报》及全国主流报刊全面横排",
      badge: "成为主流",
      summary: "紧随《光明日报》试点成功，1956 年元旦起《人民日报》及全国各大报刊、出版社陆续全面改用自左向右横排，确立了现代简体中文印刷与数字屏幕的默认阅读方向。",
      specimenTitle: "人民日报 · 1956 年 1 月 1 日",
      specimenBody: "自此报纸、教材、科技图书与后来的电脑操作系统、网页界面均沿用左起横排，跨学科数据与外文词组得以无缝并排。",
      specimenMeta: "现代简体中文通用排版基线确立",
      mode: "rmrb1956",
    },
    {
      year: "2019",
      short: "W3C 书写规范",
      title: "2019 年 12 月 10 日 · W3C 发布 CSS Writing Modes Level 3 推荐标准",
      badge: "Web 逻辑轴",
      summary: "W3C 正式推荐 CSS Writing Modes Level 3，并与 W3C 中文排版需求（CLREQ）协同：网页中横排左起对应 writing-mode: horizontal-tb 与 direction: ltr，并倡导用逻辑属性 text-align: start 取代写死的物理 left。",
      specimenTitle: "W3C CLREQ & CSS Writing Modes 3",
      specimenBody: "writing-mode: horizontal-tb; direction: ltr; text-align: start; margin-inline-start: 0; —— 把「左起」抽象为「行首起读边」。",
      specimenMeta: "现代浏览器多书写方向底层标准",
      mode: "w3c2019",
    },
  ];

  const btns = [...root.querySelectorAll("[data-era]")];
  const titleEl = root.querySelector("#era-title");
  const badgeEl = root.querySelector("#era-badge");
  const sumEl = root.querySelector("#era-summary");
  const spTitle = root.querySelector("#era-sp-title");
  const spBody = root.querySelector("#era-sp-body");
  const spMeta = root.querySelector("#era-sp-meta");
  const cardEl = root.querySelector("#era-specimen");

  function select(idx) {
    const era = ERAS[idx] || ERAS[0];
    btns.forEach((b, i) => {
      const on = i === idx;
      b.setAttribute("aria-selected", String(on));
      b.classList.toggle("is-active", on);
    });
    titleEl.textContent = era.title;
    badgeEl.textContent = era.badge;
    sumEl.textContent = era.summary;
    spTitle.textContent = era.specimenTitle;
    spBody.textContent = era.specimenBody;
    spMeta.textContent = era.specimenMeta;
    cardEl.dataset.mode = era.mode;
  }

  btns.forEach((b, i) => b.addEventListener("click", () => select(i)));
  select(0);
}

// ---------- 04：五类组件实操台（含对原海报「说多了一点」的温和修正） ----------
export function mountComponentLab() {
  const root = document.getElementById("comp-lab");
  if (!root) return;

  const tabs = [...root.querySelectorAll("[data-comp]")];
  const toggleBtn = root.querySelector("#comp-toggle");
  const preview = root.querySelector("#comp-preview");
  const explain = root.querySelector("#comp-explain");
  const codeEl = root.querySelector("#comp-code");

  const STATE = { active: "table", refined: false };

  const DATA = {
    table: {
      toggleOff: "当前：全部左对齐（海报字面做法）",
      toggleOn: "当前：文本左齐 + 数值右齐等宽（修正做法）",
      btnToOn: "切到「数值右齐 + 等宽数字」看差距",
      btnToOff: "切回「全部机械左对齐」对照",
      explainOff: "原海报建议「表格均遵循左起横排」，这里说多了一点：左侧项目名应该左对齐，但右侧金额与百分比若也左对齐，个位和千位上下错开，眼睛根本扫不出谁大谁小。",
      explainOn: "修正后：文字标签继续严格左起，数值列改为右对齐并开启 tabular-nums 等宽数字，小数点与位数垂直串成一条线，一眼就能比出 1,280.00 远大于 42.50。",
      codeOff: "th, td { text-align: left; }",
      codeOn: "th, td { text-align: start; }\ntd.num { text-align: end; font-variant-numeric: tabular-nums; }",
      render(refined) {
        return `
          <table class="demo-tbl ${refined ? "is-refined" : "is-naive"}">
            <thead><tr><th>版式检查项</th><th class="num">实测耗时 (ms)</th><th class="num">字数上限</th></tr></thead>
            <tbody>
              <tr><td>主标题单行</td><td class="num">18.40</td><td class="num">12</td></tr>
              <tr><td>左起正文栏</td><td class="num">1,280.00</td><td class="num">32</td></tr>
              <tr><td>双语脚注栏</td><td class="num">42.50</td><td class="num">28</td></tr>
            </tbody>
          </table>`;
      },
    },
    paragraph: {
      btnToOn: "开启「行首全角标点视觉悬挂」",
      btnToOff: "切回「行首全角标点机械齐左」",
      explainOff: "中文全角引号「」与书名号《》左半格自带空白。如果只按字框机械左齐，带引号的那一行视觉上会比下一行凹进去半格，左轴像缺了一个口子。",
      explainOn: "参照 W3C CLREQ 行首标点挤压与光学悬挂思路，把行首开引号微调前出半格，左侧墨迹边缘重新站成笔直的一条线。",
      codeOff: "p { text-align: start; /* 全角开引号占满前导半格空白 */ }",
      codeOn: "p { text-align: start; text-spacing-trim: space-first; /* 行首开引号挤压半格 */ }",
      render(refined) {
        return `
          <div class="demo-para ${refined ? "is-refined" : "is-naive"}">
            <span class="demo-axis" aria-hidden="true"></span>
            <p class="dp-q"><span class="dp-mark">「</span>横排左起并非只靠设置属性，还要留意行首标点。</p>
            <p class="dp-n">如果全角引号留白太宽，这一行看起来就像无故缩进了一截。</p>
            <p class="dp-q"><span class="dp-mark">《</span>中文排版需求》建议在行首对开括号与引号做半角压缩。</p>
          </div>`;
      },
    },
    list: {
      btnToOn: "开启「悬挂缩进 · 文字同轴」",
      btnToOff: "切回「折行回退顶格」对照",
      explainOff: "当列表采用 inside 样式（折行退回圆点正下方）时，第一行和折行文字的左起位置错开了一个符号宽度，长列表扫读时视线左右晃动。",
      explainOn: "采用标准悬挂缩进（list-style-position: outside），编号与圆点挂在基准线外侧，所有正文首字和折行都钉在同一条竖直左起轴上。",
      codeOff: "ul { list-style-position: inside; padding-inline-start: 0; }",
      codeOn: "ul { list-style-position: outside; padding-inline-start: 1.4em; }",
      render(refined) {
        return `
          <div class="demo-list-wrap ${refined ? "is-refined" : "is-naive"}">
            <span class="demo-axis" aria-hidden="true"></span>
            <ul class="demo-list">
              <li>左侧起读轴负责承接每一次换行回扫，不能被列表符号打断。</li>
              <li>较长条目折到第二行时，首字必须继续与第一行首字保持垂直对齐。</li>
            </ul>
          </div>`;
      },
    },
    heading: {
      btnToOn: "对齐「标题与正文共享左轴」",
      btnToOff: "切回「标题居中 + 正文左齐」对照",
      explainOff: "许多新手把标题居中、正文左对齐。结果读者刚把视线放在中间读完标题，读正文第一行时又得向左大跳半个屏幕去重新找起点。",
      explainOn: "标题、副标题与正文共享同一条左侧基准轴：眼球从标题左端垂直滑下即可直接进入第一行正文，层级靠字号和字重拉开，不必靠左右乱跳。",
      codeOff: "h3 { text-align: center; } p { text-align: left; }",
      codeOn: "h3, p { text-align: start; margin-inline-start: 0; }",
      render(refined) {
        return `
          <div class="demo-head ${refined ? "is-refined" : "is-naive"}">
            <span class="demo-axis" aria-hidden="true"></span>
            <h4>横排左起的层级衔接</h4>
            <p class="dh-sub">SHARED LEFT ANCHOR FOR HEADING &amp; BODY</p>
            <p class="dh-body">同一篇文章里，标题和正文站在同一条左起垂线上，眼球只需向下微落即可接续正文，不会在左右之间来回折返。</p>
          </div>`;
      },
    },
    logical: {
      btnToOn: "模拟切换为 RTL 语境（dir=\"rtl\"）",
      btnToOff: "切回常规中文 LTR 语境（dir=\"ltr\"）",
      explainOff: "在左起横排（dir=\"ltr\"）下，物理属性 text-align: left 和逻辑属性 text-align: start 结果完全一致，都落在左边缘。",
      explainOn: "一旦页面本地化为右起语言（dir=\"rtl\"），写死的 text-align: left 会固执锁在左边导致排版错乱；而 text-align: start 会自动镜像到右侧起读端！",
      codeOff: "/* dir=\"ltr\" 下两者一致 */\n.bad { text-align: left; }   .good { text-align: start; }",
      codeOn: "/* dir=\"rtl\" 下物理 left 失效，逻辑 start 自动翻右 */\n.bad { text-align: left; }   .good { text-align: start; }",
      render(refined) {
        return `
          <div class="demo-logical ${refined ? "is-rtl" : "is-ltr"}">
            <div class="dl-box dl-bad" dir="${refined ? "rtl" : "ltr"}">
              <span class="dl-tag">写死 text-align: left</span>
              <p>${refined ? "مرحباً — 物理 left 锁死在左缘，与右起语序冲突。" : "横排左起文字从左边缘出发，读向右侧。"}</p>
            </div>
            <div class="dl-box dl-good" dir="${refined ? "rtl" : "ltr"}">
              <span class="dl-tag">逻辑 text-align: start</span>
              <p>${refined ? "مرحباً — 逻辑 start 自动翻转至右缘起读轴。" : "横排左起文字从左边缘出发，读向右侧。"}</p>
            </div>
          </div>`;
      },
    },
  };

  function render() {
    const item = DATA[STATE.active];
    tabs.forEach((t) => {
      const on = t.dataset.comp === STATE.active;
      t.setAttribute("aria-selected", String(on));
      t.classList.toggle("is-active", on);
    });
    toggleBtn.textContent = STATE.refined ? item.btnToOff : item.btnToOn;
    toggleBtn.setAttribute("aria-pressed", String(STATE.refined));
    preview.innerHTML = item.render(STATE.refined);
    explain.textContent = STATE.refined ? item.explainOn : item.explainOff;
    codeEl.textContent = STATE.refined ? item.codeOn : item.codeOff;
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      STATE.active = t.dataset.comp;
      STATE.refined = false;
      render();
    });
  });
  toggleBtn.addEventListener("click", () => {
    STATE.refined = !STATE.refined;
    render();
  });

  render();
}

// ---------- 05：什么时候别死守左起 · 四场景验真卡 ----------
export function mountBoundaryLab() {
  const cards = [...document.querySelectorAll(".bound-card")];
  cards.forEach((card) => {
    const btn = card.querySelector(".bound-flip");
    const note = card.querySelector(".bound-note");
    if (!btn || !note) return;
    btn.addEventListener("click", () => {
      const next = card.dataset.mode !== "proper";
      card.dataset.mode = next ? "proper" : "forced";
      btn.setAttribute("aria-pressed", String(next));
      btn.textContent = next ? "切回「硬套左起」对照" : "切到「顺应场景」排法";
      note.textContent = next ? card.dataset.properNote : card.dataset.forcedNote;
    });
  });
}

// ---------- 06：单变量盲测小练习（A / B / C / D 中性标签） ----------
export function mountPracticeLab() {
  const root = document.getElementById("practice-lab");
  if (!root) return;

  const cards = [...root.querySelectorAll(".quiz-card")];
  const verdictBox = root.querySelector("#quiz-verdict");
  const vTitle = root.querySelector("#quiz-v-title");
  const vText = root.querySelector("#quiz-v-text");
  const resetBtn = root.querySelector("#quiz-reset");

  const FEEDBACK = {
    A: {
      ok: false,
      title: "方案 A：左侧虽然齐了，但单行拉得太宽、行距又压得太紧",
      text: "A 和正确答案 B 都在左起轴对齐，唯一差别是 A 把单行拉满整栏（约 44 字/行）并压紧行距至 1.18×。读到行尾往回扫时跨度太大、上下行又贴得很近，眼睛很容易回扫落错行。",
    },
    B: {
      ok: true,
      title: "答对了！方案 B 同时守住了「共享左轴 + 适中行宽 + 清晰行距」",
      text: "标题、正文与时间地点全部锚定在同一条左侧基准线上，每行约 22–26 字、行距 1.65×。每一次换行回扫距离短、落点固定、行间通道宽裕，连续扫读最省力。",
    },
    C: {
      ok: false,
      title: "方案 C：行宽和行距都没问题，输在多行正文用了居中对齐",
      text: "C 与 B 只有「对齐方式」一个变量不同：改成居中后，这五行的左起位置随每行字数长短左右跳动，读者每次换到下一行都得重新瞄准起点，白白增加眼动寻址成本。",
    },
    D: {
      ok: false,
      title: "方案 D：左对齐、行宽、行距都合适，却把左起基准轴拆成了三截",
      text: "D 与 B 只有「共享左轴」一个变量不同：标题顶格、正文缩进、底部时间再右推一截，整张卡片出现了三条彼此打架的左起线，视线往下滑时被迫折线跳动。",
    },
  };

  function pick(choice) {
    const info = FEEDBACK[choice];
    if (!info) return;
    root.classList.add("is-revealed");
    verdictBox.dataset.state = info.ok ? "ok" : "miss";
    vTitle.textContent = info.title;
    vText.textContent = info.text;

    cards.forEach((c) => {
      const id = c.dataset.choice;
      const isPicked = id === choice;
      const isCorrect = id === "B";
      c.setAttribute("aria-pressed", String(isPicked));
      c.classList.toggle("is-picked", isPicked);
      c.classList.toggle("is-correct", isCorrect);
      c.classList.toggle("is-wrong", isPicked && !isCorrect);
    });
    resetBtn.hidden = false;
  }

  function reset() {
    root.classList.remove("is-revealed");
    verdictBox.dataset.state = "idle";
    vTitle.textContent = "先凭阅读体感挑出最好读的一栏。";
    vText.textContent = "四张卡片使用完全相同的文字、字号与配色，彼此只差一个排版变量。选完后会叠出金色左轴与回扫透视。";
    cards.forEach((c) => {
      c.setAttribute("aria-pressed", "false");
      c.classList.remove("is-picked", "is-correct", "is-wrong");
    });
    resetBtn.hidden = true;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.choice)));
  resetBtn.addEventListener("click", reset);
}

// ---------- 07：原海报灯箱（复用 #poster.src，点击放大、拖动平移、Esc 关） ----------
export function mountPosterLightbox() {
  const trigger = document.getElementById("poster-btn");
  const thumb = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const fullImg = document.getElementById("poster-full");
  const stage = document.getElementById("poster-stage");
  const zoomBtn = document.getElementById("poster-zoom");
  const closeBtn = document.getElementById("poster-close");
  if (!trigger || !thumb || !modal || !fullImg || !stage) return;

  let zoomed = false;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  function syncTransform() {
    fullImg.style.transform = zoomed ? `translate(${panX}px, ${panY}px) scale(1.9)` : "translate(0px, 0px) scale(1)";
    stage.classList.toggle("is-zoomed", zoomed);
    zoomBtn.textContent = zoomed ? "缩回整张 1×" : "放大细节 1.9×";
    zoomBtn.setAttribute("aria-pressed", String(zoomed));
  }

  function open() {
    if (!fullImg.src) fullImg.src = thumb.currentSrc || thumb.src;
    zoomed = false;
    panX = 0;
    panY = 0;
    syncTransform();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomBtn.addEventListener("click", () => {
    zoomed = !zoomed;
    if (!zoomed) { panX = 0; panY = 0; }
    syncTransform();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (!zoomed || e.button !== 0) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = panX;
    oy = panY;
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging || !zoomed) return;
    panX = Math.max(-360, Math.min(360, ox + (e.clientX - sx)));
    panY = Math.max(-460, Math.min(460, oy + (e.clientY - sy)));
    syncTransform();
  });
  stage.addEventListener("pointerup", (e) => {
    dragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch {}
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
