// 216 横直混排 · 正文 01–07 节独立特色交互模块（每节控件完全不重复）

// =====================================================================
// 01 节：信息角色双轴分拣台（点击 6 个出版元素归入横流/纵流 + 实时样页检验）
// =====================================================================
const ROLE_ITEMS = [
  { id: "headline", name: "主标题", sample: "城市更新", ideal: "either", defaultAxis: "H", tipH: "横向定调稳重清晰", tipV: "竖排大标强立视觉脊柱" },
  { id: "paragraph", name: "说明正文", sample: "六十字连续段落", ideal: "H", defaultAxis: "V", tipH: "水平扫视最利连续理解", tipV: "长段强竖排导致频折碎读" },
  { id: "issue", name: "期号标签", sample: "NO.216", ideal: "V", defaultAxis: "H", tipH: "混在横流里容易被忽略", tipV: "竖排边签一眼立出索引锚点" },
  { id: "nav", name: "章节导视", sample: "共建美好生活", ideal: "V", defaultAxis: "H", tipH: "和正文同向，缺少节奏停顿", tipV: "纵向切出视觉护栏与引导流" },
  { id: "table", name: "数据明细表", sample: "2024—2026 指标", ideal: "H", defaultAxis: "H", tipH: "行列对齐便于横向比对数字", tipV: "数字表翻竖排会彻底打散列对齐" },
  { id: "seal", name: "展期落款", sample: "十月秋展", ideal: "V", defaultAxis: "V", tipH: "平放略显普通", tipV: "短字竖落宛如东亚书画题款" },
];

export function initRoleSorter() {
  const host = document.getElementById("role-sorter");
  if (!host) return;
  const state = Object.fromEntries(ROLE_ITEMS.map((it) => [it.id, it.defaultAxis]));

  const listEl = host.querySelector("[data-role-list]");
  const previewEl = host.querySelector("[data-role-preview]");
  const verdictEl = host.querySelector("[data-role-verdict]");
  const resetBtn = host.querySelector("[data-role-reset]");
  const idealBtn = host.querySelector("[data-role-ideal]");

  function render() {
    listEl.innerHTML = ROLE_ITEMS.map((it) => {
      const axis = state[it.id];
      const bad = (it.ideal === "H" && axis === "V") || (it.ideal === "V" && axis === "H");
      return `
        <div class="role-row ${bad ? "is-bad" : "is-good"}">
          <div class="role-meta">
            <strong>${it.name}</strong>
            <span>${it.sample}</span>
          </div>
          <div class="role-switch" role="group" aria-label="${it.name}方向">
            <button type="button" class="role-btn ${axis === "H" ? "is-active" : ""}" data-id="${it.id}" data-axis="H" aria-pressed="${axis === "H"}">横流</button>
            <button type="button" class="role-btn ${axis === "V" ? "is-active" : ""}" data-id="${it.id}" data-axis="V" aria-pressed="${axis === "V"}">纵流</button>
          </div>
        </div>`;
    }).join("");

    const hItems = ROLE_ITEMS.filter((it) => state[it.id] === "H");
    const vItems = ROLE_ITEMS.filter((it) => state[it.id] === "V");
    const mistakes = ROLE_ITEMS.filter(
      (it) => (it.ideal === "H" && state[it.id] === "V") || (it.ideal === "V" && state[it.id] === "H")
    );

    const hasLongVert = state.paragraph === "V" || state.table === "V";
    const noVert = vItems.length === 0;
    const noHoriz = hItems.length === 0;

    // 实时样页微缩渲染
    previewEl.innerHTML = `
      <div class="mini-spread ${hasLongVert ? "is-strained" : ""}">
        <div class="mini-h-zone">
          <span class="mini-zone-cap">横流主区（${hItems.length} 项）</span>
          ${
            hItems.length
              ? hItems
                  .map(
                    (it) =>
                      `<div class="mini-chip ${it.id === "paragraph" || it.id === "table" ? "is-wide" : ""} ${it.ideal === "V" ? "is-warn" : ""}">
                        <b>${it.name}</b><small>${it.sample}</small>
                      </div>`
                  )
                  .join("")
              : `<div class="mini-empty">横流区已空</div>`
          }
        </div>
        <div class="mini-seam" aria-hidden="true"></div>
        <div class="mini-v-zone">
          <span class="mini-zone-cap">纵流（${vItems.length}）</span>
          <div class="mini-v-cols">
            ${
              vItems.length
                ? vItems
                    .map(
                      (it) =>
                        `<div class="mini-vcol ${it.ideal === "H" ? "is-err" : ""}">${it.name}</div>`
                    )
                    .join("")
                : `<div class="mini-empty">无竖锚</div>`
            }
          </div>
        </div>
      </div>
    `;

    if (noVert || noHoriz) {
      verdictEl.className = "role-verdict is-err";
      verdictEl.innerHTML = `<strong>单向退化</strong>：现在所有元素都挤进了${noVert ? "横流" : "纵流"}，缺少正交对比，混排不再成立。`;
    } else if (hasLongVert) {
      verdictEl.className = "role-verdict is-err";
      const badNames = [state.paragraph === "V" ? "说明正文" : "", state.table === "V" ? "数据明细表" : ""]
        .filter(Boolean)
        .join("与");
      verdictEl.innerHTML = `<strong>主读受阻</strong>：把「${badNames}」塞进纵流后，连续阅读与数字对照被迫反复断列；长信息应回到横流，把短标签交给纵流。`;
    } else if (mistakes.length > 0) {
      verdictEl.className = "role-verdict is-warn";
      verdictEl.innerHTML = `<strong>纵锚偏弱</strong>：「${mistakes.map((m) => m.name).join("、")}」这类短导视留在横流里容易和正文混成一片，放进纵流更能截停视线。`;
    } else {
      verdictEl.className = "role-verdict is-ok";
      verdictEl.innerHTML = `<strong>分工顺畅</strong>：主标题${state.headline === "V" ? "竖立破势" : "横排定调"}，说明正文与数据表稳坐横流，期号、导视与落款在纵流立出清晰节奏。`;
    }
  }

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    state[btn.dataset.id] = btn.dataset.axis;
    render();
  });

  resetBtn?.addEventListener("click", () => {
    for (const it of ROLE_ITEMS) state[it.id] = it.defaultAxis;
    render();
  });

  idealBtn?.addEventListener("click", () => {
    state.headline = "H";
    state.paragraph = "H";
    state.table = "H";
    state.issue = "V";
    state.nav = "V";
    state.seal = "V";
    render();
  });

  render();
}

// =====================================================================
// 02 节：交界缝显微镜（滑杆改物理净空 + 4 种过渡介质精细 SVG 剖面）
// =====================================================================
const SEAM_MODES = {
  none: {
    name: "无媒介",
    minEm: 0.2,
    note: "仅靠裸空隙隔离。一旦小于 1.2 个汉字宽（约 18–22px），横行末尾的字就会和竖排字列按邻近性粘成一团。",
  },
  rule: {
    name: "1px 细界线",
    minEm: 1.0,
    note: "一条克制的竖向细线把两个方向利落劈开，左右各自保留 ≥0.5em 呼吸距，最省版面空间，书报杂志最常用。",
  },
  hatch: {
    name: "斜线纹理带",
    minEm: 1.6,
    note: "216 原海报《城市的更新与未来》所用的手法：用 45° 细斜线排成视觉减速带，既隔开横直两流，又自带装饰节奏。",
  },
  space: {
    name: "宽留白通道",
    minEm: 2.2,
    note: "不画任何线条，纯粹用 2–3 个汉字宽的纸白充当缓冲河道，留白越充裕，版面越显东方画册的清朗气质。",
  },
};

export function initSeamMicroscope() {
  const host = document.getElementById("seam-lab");
  if (!host) return;
  let mode = "none";
  let gapEm = 0.35;

  const svgEl = host.querySelector("[data-seam-svg]");
  const slider = host.querySelector("[data-seam-range]");
  const gapOut = host.querySelector("[data-seam-val]");
  const readOut = host.querySelector("[data-seam-readout]");
  const modeBtns = [...host.querySelectorAll("button[data-seam-mode]")];

  function render() {
    modeBtns.forEach((b) => {
      const active = b.dataset.seamMode === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    slider.value = String(gapEm);
    gapOut.textContent = `${gapEm.toFixed(2)} em（约 ${Math.round(gapEm * 16)}px）`;

    // 计算 SVG 坐标：总宽 560，高 220
    const seamPx = Math.round(gapEm * 34); // 放大镜视角（2.1× 放大）
    const cx = 360;
    const leftEdge = cx - seamPx / 2;
    const rightEdge = cx + seamPx / 2;
    const collision = (mode === "none" && gapEm < 1.25) || (mode !== "none" && gapEm < 0.85);
    const tooWide = gapEm > 3.1;

    let seamGraphic = "";
    if (mode === "rule") {
      seamGraphic = `<line x1="${cx}" y1="24" x2="${cx}" y2="192" stroke="#01542E" stroke-width="1.5"/>`;
    } else if (mode === "hatch") {
      const lines = [];
      const half = Math.min(12, Math.max(4, seamPx * 0.32));
      for (let y = 34; y <= 184; y += 13) {
        lines.push(`<line x1="${cx - half}" y1="${y + half}" x2="${cx + half}" y2="${y - half}" stroke="#6E7C74" stroke-width="1.2"/>`);
      }
      seamGraphic = lines.join("");
    } else if (mode === "space") {
      seamGraphic = `<rect x="${leftEdge}" y="24" width="${seamPx}" height="168" fill="#01542E" fill-opacity="0.06"/>
        <line x1="${leftEdge}" y1="24" x2="${leftEdge}" y2="192" stroke="#7FA48F" stroke-dasharray="3 3"/>
        <line x1="${rightEdge}" y1="24" x2="${rightEdge}" y2="192" stroke="#7FA48F" stroke-dasharray="3 3"/>`;
    }

    const collisionOverlay = collision
      ? `<rect x="${leftEdge - 6}" y="26" width="${seamPx + 12}" height="164" fill="#E95218" fill-opacity="0.16"/>
         <path d="M ${leftEdge - 14} 84 Q ${cx} 72 ${rightEdge + 12} 84" fill="none" stroke="#E95218" stroke-width="2" stroke-dasharray="4 3"/>
         <path d="M ${leftEdge - 14} 120 Q ${cx} 108 ${rightEdge + 12} 120" fill="none" stroke="#E95218" stroke-width="2" stroke-dasharray="4 3"/>`
      : "";

    const hLines = [
      "横排正文向右展开，直到行尾",
      "收束；眼睛到达右缘准备回扫",
      "下一行时，若交界缺少缓冲，",
      "视线就会顺势跨入右侧竖列。",
    ];
    const hText = hLines
      .map(
        (ln, i) =>
          `<text x="${leftEdge - 8}" y="${58 + i * 32}" text-anchor="end" font-size="15" fill="#0B0E0C" font-family="'Noto Sans SC', sans-serif">${ln}</text>`
      )
      .join("");

    const vChars = [..."共建美好生活"];
    const vText = vChars
      .map(
        (ch, i) =>
          `<text x="${rightEdge + 22}" y="${48 + i * 24}" text-anchor="middle" font-size="16" fill="#01542E" font-family="'ZCOOL XiaoWei', 'Noto Sans SC', serif">${ch}</text>`
      )
      .join("");

    const enX = rightEdge + 58;
    svgEl.innerHTML = `
      <rect x="0" y="0" width="560" height="220" fill="#FAF9F6"/>
      <rect x="1" y="1" width="558" height="218" fill="none" stroke="#C6CCC7"/>
      ${collisionOverlay}
      ${seamGraphic}
      ${hText}
      ${vText}
      <text x="${enX}" y="44" font-size="22" fill="#0B0E0C" font-family="'Bebas Neue', sans-serif" letter-spacing="1.5" transform="rotate(90 ${enX} 44)">CITY FUTURE</text>
      <!-- 净空卡尺 -->
      <line x1="${leftEdge}" y1="206" x2="${rightEdge}" y2="206" stroke="${collision ? "#B33204" : "#01542E"}" stroke-width="1.5"/>
      <line x1="${leftEdge}" y1="200" x2="${leftEdge}" y2="212" stroke="${collision ? "#B33204" : "#01542E"}" stroke-width="1.5"/>
      <line x1="${rightEdge}" y1="200" x2="${rightEdge}" y2="212" stroke="${collision ? "#B33204" : "#01542E"}" stroke-width="1.5"/>
      <rect x="${cx - 72}" y="182" width="144" height="17" fill="#FAF9F6" fill-opacity="0.92"/>
      <text x="${cx}" y="194" text-anchor="middle" font-size="11" font-weight="600" fill="${collision ? "#B33204" : "#01542E"}" font-family="'IBM Plex Sans', sans-serif">净空 ${gapEm.toFixed(2)}em${collision ? " · 串行撞车" : tooWide ? " · 略显割裂" : " · 清晰隔离"}</text>
    `;

    const info = SEAM_MODES[mode];
    if (collision) {
      readOut.className = "seam-readout is-err";
      readOut.innerHTML = `<strong>撞车预警（${info.name} · ${gapEm.toFixed(2)}em）</strong>：横排行尾与竖列侧腰距离过近，红色虚弧标出了视线最容易横穿串行的位置。把净空拉到 ${mode === "none" ? "1.3em" : "0.9em"} 以上或换用细界线/斜线带，两个方向才会利落断开。`;
    } else if (tooWide) {
      readOut.className = "seam-readout is-warn";
      readOut.innerHTML = `<strong>过渡偏宽（${info.name} · ${gapEm.toFixed(2)}em）</strong>：两块区域被拉得过远，右侧竖排容易脱离主体像贴在纸边的孤岛。经验上把交界缝收在 1.2–2.6em 之间既防撞又保持呼应。`;
    } else {
      readOut.className = "seam-readout is-ok";
      readOut.innerHTML = `<strong>过渡顺畅（${info.name} · ${gapEm.toFixed(2)}em）</strong>：${info.note}`;
    }
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.seamMode;
      if (mode === "none" && gapEm > 1.2) gapEm = 0.4;
      else if (mode !== "none" && gapEm < 1.1) gapEm = SEAM_MODES[mode].minEm;
      render();
    })
  );
  slider.addEventListener("input", () => {
    gapEm = parseFloat(slider.value);
    render();
  });

  render();
}

// =====================================================================
// 03 节：年代版式演进检视器（1924 / 1955 / 1964 / 2019 四段查证史料）
// =====================================================================
const HISTORY_NODES = [
  {
    year: "1924",
    title: "邦文写真植字机申请专利",
    who: "森泽信夫 · 石井茂吉（1924 年 7 月 24 日申请，1925 年获特许第 64453 号）",
    body: "金属活字时代，汉字铅块必须一行行塞进刚性木框里，同页混排横与竖工序极繁琐。写真植字用光学镜头直接把字样投射到感光纸上，靠齿轮就能任意切换横走与竖走，从技术根源撬开了东亚现代横直混排的大门。",
    css: "/* 光学写植之前：刚性铅字栏几乎只能单一轴向 */\n.metal-frame { writing-mode: vertical-rl; }",
    svg: `
      <rect x="20" y="16" width="240" height="156" fill="#0E3524" stroke="#7FA48F"/>
      <rect x="36" y="30" width="96" height="128" fill="none" stroke="#9ED6B7" stroke-dasharray="3 3"/>
      <line x1="68" y1="30" x2="68" y2="158" stroke="#9ED6B7" stroke-opacity="0.5"/>
      <line x1="100" y1="30" x2="100" y2="158" stroke="#9ED6B7" stroke-opacity="0.5"/>
      <text x="84" y="96" text-anchor="middle" font-size="13" fill="#F3F1ED">竖走感光格</text>
      <rect x="148" y="30" width="96" height="58" fill="#184C35" stroke="#FF8B5E"/>
      <text x="196" y="64" text-anchor="middle" font-size="12" fill="#F3F1ED">同页横走窗</text>
      <circle cx="196" cy="126" r="24" fill="none" stroke="#9ED6B7" stroke-width="1.5"/>
      <circle cx="196" cy="126" r="8" fill="#FF8B5E"/>
      <text x="196" y="163" text-anchor="middle" font-size="11" fill="#C9D8CF">光学透镜切换轴向</text>`,
  },
  {
    year: "1955",
    title: "中文报刊开启横排改革",
    who: "《光明日报》（1955 年 1 月 1 日）· 《人民日报》（1956 年 1 月 1 日）",
    body: "1955 年元旦《光明日报》在全国报纸中率先由竖排改为自左向右横排；次年元旦《人民日报》等全国主要报刊全面跟进。长篇新闻与现代科学文献迅速稳定到横排主轴，而竖排则留给了报头、专栏题签、书脊与节庆海报，促成了中国当代「横主竖辅」的分工惯例。",
    css: "/* 现代报刊分工：长文稳坐横排，专栏题签保留竖立锚点 */\n.article-body { writing-mode: horizontal-tb; }\n.column-flag  { writing-mode: vertical-rl; }",
    svg: `
      <rect x="20" y="16" width="240" height="156" fill="#0E3524" stroke="#7FA48F"/>
      <rect x="34" y="28" width="166" height="24" fill="#F3F1ED"/>
      <text x="117" y="45" text-anchor="middle" font-size="12" font-weight="700" fill="#072619">横排通栏报头 · 1955—1956</text>
      <line x1="34" y1="68" x2="196" y2="68" stroke="#C9D8CF" stroke-width="2"/>
      <line x1="34" y1="84" x2="188" y2="84" stroke="#C9D8CF" stroke-width="2"/>
      <line x1="34" y1="100" x2="196" y2="100" stroke="#C9D8CF" stroke-width="2"/>
      <line x1="34" y1="116" x2="176" y2="116" stroke="#C9D8CF" stroke-width="2"/>
      <line x1="34" y1="132" x2="192" y2="132" stroke="#C9D8CF" stroke-width="2"/>
      <rect x="210" y="28" width="36" height="130" fill="#184C35" stroke="#FF8B5E"/>
      <text x="228" y="62" text-anchor="middle" font-size="13" fill="#F3F1ED">专</text>
      <text x="228" y="84" text-anchor="middle" font-size="13" fill="#F3F1ED">栏</text>
      <text x="228" y="106" text-anchor="middle" font-size="13" fill="#F3F1ED">题</text>
      <text x="228" y="128" text-anchor="middle" font-size="13" fill="#F3F1ED">签</text>`,
  },
  {
    year: "1964",
    title: "写植时代的书刊纵横混组",
    who: "杉浦康平（Kohei Sugiura，1932—）·《デザイン》杂志与现代新书",
    body: "1960 至 1970 年代，日本设计师杉浦康平在《デザイン（Design）》杂志（1964 年起）以及讲谈社现代新书、角川选书等装帧实践中，把纵排与横排当成空间建筑的经纬两轴：跨页里竖排书题与横排图注、图表彼此穿插，让书籍变成可立体漫游的知识场。",
    css: "/* 杂志跨页的经纬交叉：主读区与图注区正交呼应 */\n.spread-grid { display: grid; grid-template-columns: 3fr 28px 1fr; }\n.margin-note { writing-mode: vertical-rl; }",
    svg: `
      <rect x="20" y="16" width="240" height="156" fill="#0E3524" stroke="#7FA48F"/>
      <line x1="140" y1="16" x2="140" y2="172" stroke="#9ED6B7" stroke-dasharray="4 3"/>
      <circle cx="140" cy="94" r="24" fill="#9ED6B7" fill-opacity="0.22" stroke="#9ED6B7"/>
      <line x1="36" y1="94" x2="244" y2="94" stroke="#F3F1ED" stroke-width="1.4"/>
      <line x1="140" y1="26" x2="140" y2="162" stroke="#FF8B5E" stroke-width="1.4"/>
      <rect x="38" y="34" width="84" height="44" fill="#184C35"/>
      <text x="80" y="60" text-anchor="middle" font-size="11" fill="#F3F1ED">横排图注与数据</text>
      <rect x="162" y="108" width="76" height="48" fill="#184C35"/>
      <text x="200" y="136" text-anchor="middle" font-size="11" fill="#F3F1ED">竖排跨页主脊</text>`,
  },
  {
    year: "2019",
    title: "W3C 标准落定网页正交混排",
    who: "W3C JLREQ（2009/2012/2020）· CLREQ（2015）· CSS Writing Modes L3（2019-12-10）",
    body: "W3C 国际排版小组先后整理出《日文排版需求（JLREQ）》与《中文排版需求（CLREQ）》；2019 年 12 月 10 日《CSS Writing Modes Level 3》正式成为推荐标准。浏览器终于原生支持同一网格内自由切换 horizontal-tb 与 vertical-rl，不必再切图伪造竖排。",
    css: ".editorial { display: grid; grid-template-columns: 1fr auto; gap: 1.5rem; }\n.editorial-rail {\n  writing-mode: vertical-rl;\n  text-orientation: mixed;\n}",
    svg: `
      <rect x="20" y="16" width="240" height="156" fill="#0E3524" stroke="#7FA48F"/>
      <rect x="32" y="28" width="148" height="132" fill="#143F2C" stroke="#9ED6B7"/>
      <text x="44" y="54" font-size="11" fill="#9ED6B7" font-family="'IBM Plex Sans', sans-serif">horizontal-tb</text>
      <line x1="44" y1="70" x2="164" y2="70" stroke="#F3F1ED" stroke-width="2"/>
      <line x1="44" y1="88" x2="152" y2="88" stroke="#C9D8CF" stroke-width="1.5"/>
      <line x1="44" y1="104" x2="160" y2="104" stroke="#C9D8CF" stroke-width="1.5"/>
      <line x1="44" y1="120" x2="132" y2="120" stroke="#C9D8CF" stroke-width="1.5"/>
      <rect x="196" y="28" width="52" height="132" fill="#184C35" stroke="#FF8B5E"/>
      <text x="222" y="54" text-anchor="middle" font-size="12" fill="#FF8B5E">竖</text>
      <text x="222" y="76" text-anchor="middle" font-size="12" fill="#F3F1ED">排</text>
      <text x="222" y="98" text-anchor="middle" font-size="12" fill="#F3F1ED">导</text>
      <text x="222" y="120" text-anchor="middle" font-size="12" fill="#F3F1ED">视</text>
      <text x="222" y="144" text-anchor="middle" font-size="10" fill="#9ED6B7" font-family="'IBM Plex Sans', sans-serif">rl</text>`,
  },
];

export function initHistoryTimeline() {
  const host = document.getElementById("history-lab");
  if (!host) return;
  let activeIdx = 0;

  const btns = [...host.querySelectorAll("button[data-year-idx]")];
  const titleEl = host.querySelector("[data-hist-title]");
  const whoEl = host.querySelector("[data-hist-who]");
  const bodyEl = host.querySelector("[data-hist-body]");
  const cssEl = host.querySelector("[data-hist-css]");
  const svgEl = host.querySelector("[data-hist-svg]");

  function render() {
    const item = HISTORY_NODES[activeIdx];
    btns.forEach((b, i) => {
      b.classList.toggle("is-active", i === activeIdx);
      b.setAttribute("aria-pressed", String(i === activeIdx));
    });
    titleEl.textContent = `${item.year} · ${item.title}`;
    whoEl.textContent = item.who;
    bodyEl.textContent = item.body;
    cssEl.textContent = item.css;
    svgEl.innerHTML = item.svg;
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      activeIdx = Number(b.dataset.yearIdx);
      render();
    })
  );
  render();
}

// =====================================================================
// 04 节：三媒介场景与响应式退化实验箱（切媒介 + 拖容器宽度看竖栏何时收起）
// =====================================================================
const MEDIA_SCENES = {
  magazine: {
    name: "杂志跨页",
    tag: "专题开篇",
    title: "街区里的慢行绿廊",
    body: "宽幅双页纸面有充裕的横向宽度，左侧顺畅展开主标与导读，右侧用一列竖排专题号与短语稳住页边。",
    rail: "第十二期 · 城市步行志",
    collapseAt: 420,
  },
  poster: {
    name: "展览海报",
    tag: "美术馆主视觉",
    title: "纸与墨的当代边界",
    body: "远看靠巨幅大字抓注意力，近看靠横排展讯交代时间地点，再用竖排策展短句切出东方展陈气息。",
    rail: "二零二六秋季特展",
    collapseAt: 380,
  },
  web: {
    name: "网页专题首屏",
    tag: "桌面与手机自适应",
    title: "数字阅读的呼吸尺度",
    body: "桌面端右沿放竖排章节锚点极有辨识度；但视口一旦收窄到手机宽，必须果断把竖栏折成横眉，保住正文行宽。",
    rail: "章节零壹 · 排版秩序",
    collapseAt: 480,
  },
};

export function initMediaLab() {
  const host = document.getElementById("media-lab");
  if (!host) return;
  let sceneKey = "web";
  let widthPx = 760;

  const sceneBtns = [...host.querySelectorAll("button[data-media-scene]")];
  const slider = host.querySelector("[data-media-width]");
  const widthLabel = host.querySelector("[data-media-width-label]");
  const frameEl = host.querySelector("[data-media-frame]");
  const noteEl = host.querySelector("[data-media-note]");

  function render() {
    const s = MEDIA_SCENES[sceneKey];
    sceneBtns.forEach((b) => {
      const on = b.dataset.mediaScene === sceneKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    slider.value = String(widthPx);
    widthLabel.textContent = `${widthPx}px`;

    const collapsed = widthPx < s.collapseAt;
    const pct = Math.round(((widthPx - 320) / (960 - 320)) * 62 + 38); // 视觉容器占比 38%–100%

    frameEl.innerHTML = `
      <div class="media-mock ${collapsed ? "is-collapsed" : "is-mixed"}" style="width: min(100%, ${pct}%)">
        ${
          collapsed
            ? `<div class="mock-top-banner"><span>${s.tag}</span><b>${s.rail}</b></div>`
            : ""
        }
        <div class="mock-body-grid">
          <div class="mock-main">
            <span class="mock-kicker">${s.tag}</span>
            <h4>${s.title}</h4>
            <p>${s.body}</p>
          </div>
          ${
            collapsed
              ? ""
              : `<div class="mock-rail" aria-label="竖排导视"><span>${s.rail}</span></div>`
          }
        </div>
      </div>
    `;

    if (collapsed) {
      noteEl.className = "media-note is-warn";
      noteEl.innerHTML = `<strong>已自动退化为纯横排（< ${s.collapseAt}px）</strong>：在 ${widthPx}px 窄幅下强留竖栏会把横排正文挤得每行不足十个字，因此竖排导视已收折成顶部横条，优先保住主文可读性。`;
    } else {
      noteEl.className = "media-note is-ok";
      noteEl.innerHTML = `<strong>横直混排生效（${widthPx}px · ${s.name}）</strong>：宽度充裕，横排正文保持舒适行宽，右侧竖排导视负责锚定节奏。把滑杆往左拖过 ${s.collapseAt}px，看看响应式退化临界点。`;
    }
  }

  sceneBtns.forEach((b) =>
    b.addEventListener("click", () => {
      sceneKey = b.dataset.mediaScene;
      render();
    })
  );
  slider.addEventListener("input", () => {
    widthPx = Number(slider.value);
    render();
  });
  render();
}

// =====================================================================
// 05 节：反例止损对照卡（4 组真实禁忌，每张独立切换原状 / 纠偏）
// =====================================================================
export function initAvoidCards() {
  const host = document.getElementById("avoid-grid");
  if (!host) return;
  host.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-fix-toggle]");
    if (!btn) return;
    const card = btn.closest(".avoid-card");
    const fixed = card.classList.toggle("is-fixed");
    btn.setAttribute("aria-pressed", String(fixed));
    btn.textContent = fixed ? "看踩坑原状" : "看止损纠偏";
  });
}

// =====================================================================
// 06 节：视觉盲测考场（4 张 SVG《城南茶事展》单变量对比，中性标签）
// =====================================================================
const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    short: "长文错塞竖排、短口号反放横排",
    explain:
      "问题出在「角色倒置」：方案 A 虽然留出了 72:28 的宽窄比例和斜线过渡带，却把整段 60 字的展览介绍强行塞进右边的竖排窄列，而把四个字的展期口号横排在主区——读者最该顺畅读完的介绍反而变得支离破碎。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: false,
    short: "横纵五五对半分、交界零过渡紧贴",
    explain:
      "问题出在「主次分裂 + 零过渡撞车」：方案 B 的分工和层级都对，但把横排区和竖排区硬生生劈成 50% : 50%，而且中间没有留白或线条缓冲，横排行尾直接撞上竖列侧腰，整张海报分裂成两块互抢焦点的版面。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: true,
    short: "横主 72% 载文 × 竖辅 28% 导视 × 斜线过渡 × 层级分明",
    explain:
      "选对了！方案 C 同时满足横直混排的核心条件：主标题、展览介绍和要点稳坐 72% 横流主区，右侧 28% 用原海报同款斜线带隔出竖排展期与四字短语；大小粗细拉开层级，读者顺畅横读完主信息后只需温和转向一次。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    short: "所有文字字号与粗细几乎相同，层级拉平",
    explain:
      "问题出在「层级拉平」：方案 D 的方向分工、72:28 占比与斜线过渡全都正确，但主标题、说明正文与竖排导视用了几乎一样的字号和字重。只靠转 90° 无法自动长出主次，眼睛进画面仍然找不到第一落点。",
  },
];

function quizSvg(id) {
  // 4 张图同画幅 260×188，严控单变量差异
  const base = `<rect x="0" y="0" width="260" height="188" fill="#FAF9F6"/>
    <rect x="0.75" y="0.75" width="258.5" height="186.5" fill="none" stroke="#9AA59E" stroke-width="1.5"/>`;

  const hatch = (cx) => {
    let s = "";
    for (let y = 22; y <= 148; y += 11) {
      s += `<line x1="${cx - 5}" y1="${y + 5}" x2="${cx + 5}" y2="${y - 5}" stroke="#87928A" stroke-width="1"/>`;
    }
    return s;
  };

  const footer = `<line x1="14" y1="156" x2="246" y2="156" stroke="#0B0E0C" stroke-width="1"/>
    <circle cx="24" cy="171" r="4" fill="#01542E"/><text x="34" y="175" font-size="10" font-weight="700" fill="#0B0E0C">器物</text>
    <circle cx="104" cy="171" r="4" fill="#01542E"/><text x="114" y="175" font-size="10" font-weight="700" fill="#0B0E0C">茶席</text>
    <circle cx="184" cy="171" r="4" fill="#01542E"/><text x="194" y="175" font-size="10" font-weight="700" fill="#0B0E0C">雅集</text>`;

  if (id === "A") {
    // 错变量：角色倒置（长文竖排右栏，短口号横排左区）
    const cols = ["深秋城南茶馆集", "合十二位器物作", "者呈现手作茶碗", "与炭火泡茶展演"];
    const vLong = cols
      .map((c, ci) =>
        [...c]
          .map(
            (ch, ri) =>
              `<text x="${244 - ci * 13}" y="${32 + ri * 14}" text-anchor="middle" font-size="10" fill="#47514B">${ch}</text>`
          )
          .join("")
      )
      .join("");
    return `${base}
      <text x="16" y="42" font-size="22" font-weight="900" fill="#0B0E0C">城南茶事展</text>
      <text x="16" y="62" font-size="11" font-weight="700" fill="#01542E">手造茶器 · 炭火慢煮</text>
      <text x="16" y="82" font-size="11" font-weight="600" fill="#47514B">秋日煮茶雅集</text>
      <rect x="16" y="96" width="148" height="52" fill="#DDE9E2"/>
      <path d="M 102 148 A 28 28 0 0 1 158 148 Z" fill="#93B2A0"/>
      ${hatch(180)}
      ${vLong}
      ${footer}`;
  }

  if (id === "B") {
    // 错变量：五五开 + 零过渡贴脸撞车
    return `${base}
      <text x="14" y="38" font-size="19" font-weight="900" fill="#0B0E0C">城南茶事展</text>
      <text x="14" y="56" font-size="10" font-weight="700" fill="#01542E">手造茶器 · 炭火慢煮</text>
      <text x="14" y="76" font-size="10" fill="#47514B">深秋城南集合十二位</text>
      <text x="14" y="91" font-size="10" fill="#47514B">器物作者呈现手作茶</text>
      <text x="14" y="106" font-size="10" fill="#47514B">碗与炭火泡茶展演。</text>
      <rect x="14" y="116" width="114" height="32" fill="#DDE9E2"/>
      <path d="M 80 148 A 20 20 0 0 1 120 148 Z" fill="#93B2A0"/>
      <text x="132" y="42" font-size="14" font-weight="700" fill="#01542E">秋</text>
      <text x="132" y="62" font-size="14" font-weight="700" fill="#01542E">日</text>
      <text x="132" y="82" font-size="14" font-weight="700" fill="#01542E">煮</text>
      <text x="132" y="102" font-size="14" font-weight="700" fill="#01542E">茶</text>
      <text x="176" y="34" font-size="22" fill="#0B0E0C" font-family="'Bebas Neue', sans-serif" transform="rotate(90 176 34)">TEA SHOW</text>
      <rect x="206" y="24" width="40" height="122" fill="#EEF3F0" stroke="#C6CCC7"/>
      <text x="226" y="56" text-anchor="middle" font-size="12" fill="#01542E">秋</text>
      <text x="226" y="76" text-anchor="middle" font-size="12" fill="#01542E">日</text>
      <text x="226" y="96" text-anchor="middle" font-size="12" fill="#01542E">雅</text>
      <text x="226" y="116" text-anchor="middle" font-size="12" fill="#01542E">集</text>
      ${footer}`;
  }

  if (id === "C") {
    // 正确解：横主 72% 载文 × 竖辅 28% 导视 × 斜线过渡 × 层级分明
    return `${base}
      <text x="16" y="42" font-size="22" font-weight="900" fill="#0B0E0C">城南茶事展</text>
      <text x="16" y="62" font-size="11" font-weight="700" fill="#01542E">手造茶器 · 炭火慢煮</text>
      <text x="16" y="81" font-size="10" fill="#47514B">深秋城南集合十二位器物作者，</text>
      <text x="16" y="96" font-size="10" fill="#47514B">呈现手作茶碗与炭火泡茶展演。</text>
      <rect x="16" y="110" width="150" height="38" fill="#DDE9E2"/>
      <path d="M 108 148 A 24 24 0 0 1 156 148 Z" fill="#93B2A0"/>
      ${hatch(182)}
      <text x="207" y="26" font-size="18" fill="#0B0E0C" font-family="'Bebas Neue', sans-serif" transform="rotate(90 207 26)">TEA SHOW</text>
      <text x="236" y="44" text-anchor="middle" font-size="13" font-weight="700" fill="#01542E">秋</text>
      <text x="236" y="65" text-anchor="middle" font-size="13" font-weight="700" fill="#01542E">日</text>
      <text x="236" y="86" text-anchor="middle" font-size="13" font-weight="700" fill="#01542E">煮</text>
      <text x="236" y="107" text-anchor="middle" font-size="13" font-weight="700" fill="#01542E">茶</text>
      <text x="236" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="#01542E">雅</text>
      <text x="236" y="146" text-anchor="middle" font-size="13" font-weight="700" fill="#01542E">集</text>
      ${footer}`;
  }

  // D：错变量：层级拉平（主标、副标、正文、竖排字号与粗细几乎一样）
  return `${base}
    <text x="16" y="34" font-size="11.5" font-weight="400" fill="#47514B">城南茶事展</text>
    <text x="16" y="54" font-size="11" font-weight="400" fill="#47514B">手造茶器 · 炭火慢煮</text>
    <text x="16" y="76" font-size="10" font-weight="400" fill="#47514B">深秋城南集合十二位器物作者，</text>
    <text x="16" y="92" font-size="10" font-weight="400" fill="#47514B">呈现手作茶碗与炭火泡茶展演。</text>
    <rect x="16" y="110" width="150" height="38" fill="#DDE9E2"/>
    <path d="M 108 148 A 24 24 0 0 1 156 148 Z" fill="#93B2A0"/>
    ${hatch(182)}
    <text x="207" y="30" font-size="11" fill="#47514B" font-family="'IBM Plex Sans', sans-serif" transform="rotate(90 207 30)">TEA SHOW</text>
    <text x="234" y="44" text-anchor="middle" font-size="11" font-weight="400" fill="#47514B">秋</text>
    <text x="234" y="64" text-anchor="middle" font-size="11" font-weight="400" fill="#47514B">日</text>
    <text x="234" y="84" text-anchor="middle" font-size="11" font-weight="400" fill="#47514B">煮</text>
    <text x="234" y="104" text-anchor="middle" font-size="11" font-weight="400" fill="#47514B">茶</text>
    <text x="234" y="124" text-anchor="middle" font-size="11" font-weight="400" fill="#47514B">雅</text>
    <text x="234" y="144" text-anchor="middle" font-size="11" font-weight="400" fill="#47514B">集</text>
    ${footer}`;
}

export function initQuiz() {
  const host = document.getElementById("quiz-box");
  if (!host) return;
  const grid = host.querySelector("[data-quiz-grid]");
  const resultEl = host.querySelector("[data-quiz-result]");
  let picked = null;

  grid.innerHTML = QUIZ_OPTIONS.map(
    (opt) => `
      <button type="button" class="quiz-card" data-quiz-id="${opt.id}" aria-pressed="false">
        <span class="quiz-badge">${opt.label}</span>
        <svg class="quiz-svg" viewBox="0 0 260 188" aria-hidden="true">${quizSvg(opt.id)}</svg>
      </button>`
  ).join("");

  const cards = [...grid.querySelectorAll(".quiz-card")];

  function update() {
    cards.forEach((c) => {
      const id = c.dataset.quizId;
      const opt = QUIZ_OPTIONS.find((o) => o.id === id);
      const isPick = id === picked;
      c.setAttribute("aria-pressed", String(isPick));
      c.classList.toggle("is-picked", isPick);
      c.classList.toggle("is-right", !!picked && opt.correct);
      c.classList.toggle("is-wrong", isPick && !opt.correct);
    });

    if (!picked) {
      resultEl.innerHTML = `<p class="quiz-prompt">点选上方四张版面之一作答。四张图的文案完全一致，每次只差一个排版变量。</p>`;
      return;
    }
    const chosen = QUIZ_OPTIONS.find((o) => o.id === picked);
    resultEl.innerHTML = `
      <div class="quiz-feedback ${chosen.correct ? "is-ok" : "is-err"}">
        <div class="quiz-fb-head">
          <strong>${chosen.correct ? "判断准确 · 方案 C" : `再看一眼 · ${chosen.label}`}</strong>
          <span>${chosen.short}</span>
        </div>
        <p>${chosen.explain}</p>
        <div class="quiz-fb-actions">
          <button type="button" class="btn-dark-ghost" data-quiz-reset>重新选择</button>
          <button type="button" class="btn-dark-ghost" data-quiz-all>查看四版差异总表</button>
        </div>
      </div>`;
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".quiz-card");
    if (!card) return;
    picked = card.dataset.quizId;
    update();
  });

  resultEl.addEventListener("click", (e) => {
    if (e.target.closest("[data-quiz-reset]")) {
      picked = null;
      update();
    } else if (e.target.closest("[data-quiz-all]")) {
      resultEl.innerHTML += `
        <ul class="quiz-diff-list">
          ${QUIZ_OPTIONS.map((o) => `<li><b>${o.label}${o.correct ? "（正确）" : ""}</b>：${o.short}</li>`).join("")}
        </ul>`;
      e.target.closest("[data-quiz-all]").disabled = true;
    }
  });

  update();
}

// =====================================================================
// 07 节：原海报灯箱（点击放大、拖拽平移、滚轮缩放、Esc 关闭，绝不二次内联图片）
// =====================================================================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-zoom-btn");
  const dlg = document.getElementById("poster-lightbox");
  if (!thumb || !dlg) return;

  const fullImg = dlg.querySelector("[data-lb-img]");
  const stage = dlg.querySelector("[data-lb-stage]");
  const closeBtn = dlg.querySelector("[data-lb-close]");
  const inBtn = dlg.querySelector("[data-lb-in]");
  const outBtn = dlg.querySelector("[data-lb-out]");
  const resetBtn = dlg.querySelector("[data-lb-reset]");
  const scaleOut = dlg.querySelector("[data-lb-scale]");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = null;

  function applyTransform() {
    fullImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    scaleOut.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    fullImg.src = thumb.src; // 单真源引用，不重复打包图片
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dlg.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (dlg.hidden) return;
    dlg.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  thumb.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) close();
  });

  inBtn.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  outBtn.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      if (scale <= 1) { tx = 0; ty = 0; }
      applyTransform();
    },
    { passive: false }
  );

  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture?.(e.pointerId);
    dragging = { x: e.clientX, y: e.clientY, tx, ty };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = dragging.tx + (e.clientX - dragging.x);
    ty = dragging.ty + (e.clientY - dragging.y);
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { dragging = null; });
  stage.addEventListener("pointercancel", () => { dragging = null; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dlg.hidden) close();
  });
}
