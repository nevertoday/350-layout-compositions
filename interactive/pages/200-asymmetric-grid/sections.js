// 正文各节独立交互模块：01 视觉杠杆天平 / 02 年代切镜 / 03 三件作品 X 光 / 04 CSS fr 切片台 / 05 反例切换 / 06 小练习 / 07 海报放大灯箱

// ---------- 01：视觉杠杆天平 ----------
export function initLeverLab() {
  const slider = document.getElementById("lever-dist");
  const out = document.getElementById("lever-dist-out");
  const read = document.getElementById("lever-read");
  const note = document.getElementById("lever-note");
  const beamG = document.getElementById("lever-beam-g");
  const rightG = document.getElementById("lever-right-g");
  const rightCircle = document.getElementById("lever-right-circle");
  const rightLabel = document.getElementById("lever-right-label");
  const matBtns = [...document.querySelectorAll(".mat-btn")];
  if (!slider || !beamG) return;

  const MATERIALS = {
    cyan: { weight: 0.62, fill: "#17B3D3", stroke: "#101214", ink: "#08090B", text: "青锚", desc: "高饱和电光青" },
    yellow: { weight: 0.72, fill: "#EFE642", stroke: "#101214", ink: "#08090B", text: "黄锚", desc: "明黄强焦块" },
    pale: { weight: 0.32, fill: "#D4CFC5", stroke: "#7A746A", ink: "#101214", text: "灰块", desc: "低对比浅灰" },
  };

  let mat = "cyan";

  function update() {
    const dist = Number(slider.value);
    const m = MATERIALS[mat];
    // 左侧固定大暖白重块：质量 1.0 × 近臂 1.0 = 1.00
    const leftMoment = 1.0;
    const rightMoment = m.weight * dist;
    const diff = rightMoment - leftMoment; // [-0.84, +0.87]
    const diffPct = Math.round(diff * 100);
    const angle = Math.max(-13, Math.min(13, diff * 18));

    out.textContent = `${dist.toFixed(2)}×`;
    beamG.setAttribute("transform", `rotate(${angle.toFixed(1)} 270 126)`);
    const rx = 270 + Math.round(dist * 80);
    rightG.setAttribute("transform", `translate(${rx}, 0)`);
    rightCircle.setAttribute("fill", m.fill);
    rightCircle.setAttribute("stroke", m.stroke);
    rightLabel.setAttribute("fill", m.ink);
    rightLabel.textContent = m.text;

    const balanced = Math.abs(diff) <= 0.14;
    read.classList.toggle("is-ok", balanced);
    if (balanced) {
      read.textContent = `非对称平衡成立（${m.desc} · 右臂 ${dist.toFixed(2)}×）`;
      note.textContent = `力矩差（示意）：${diffPct > 0 ? "+" : ""}${diffPct}% — 小面积高对比色块放远，稳稳压住大主块`;
    } else if (diff < 0) {
      read.textContent = `左侧过重下沉（差 ${diffPct}% · 示意）`;
      note.textContent = `力矩差（示意）：${diffPct}% — 把右侧${m.text}继续拉远，或换成高分量色块`;
    } else {
      read.textContent = `右侧远臂过头（差 +${diffPct}% · 示意）`;
      note.textContent = `力矩差（示意）：+${diffPct}% — 远臂放大了高对比色块的分量，往支点收近一点就稳`;
    }
  }

  slider.addEventListener("input", update);
  matBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mat = btn.dataset.mat;
      matBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      update();
    });
  });

  update();
}

// ---------- 02：年代切镜 ----------
export function initHistorySwitcher() {
  const btns = [...document.querySelectorAll(".era-btn")];
  const yr = document.getElementById("era-year");
  const head = document.getElementById("era-heading");
  const body = document.getElementById("era-body");
  const src = document.getElementById("era-src");
  const svg = document.getElementById("era-svg");
  const cap = document.getElementById("era-cap");
  if (!btns.length || !svg) return;

  const ERAS = {
    1917: {
      year: "1917 · LEIDEN, NETHERLANDS",
      head: "风格派（De Stijl）：用不等分正交网格追求动态平衡",
      body: "特奥·凡·杜斯堡与彼埃特·蒙德里安在 1917 年创办《风格》杂志，摒弃传统镜像对称，只用水平线、垂直线与原色色块切割出大小不等的矩形，提出以“动态平衡”取代静态对称。",
      src: "出处：Tate 美术馆艺术词条 De Stijl（tate.org.uk）。",
      cap: "1917 风格派示意：不等矩形 + 原色角锚，打破中心轴却维持整体平衡。",
      plate: `
        <rect x="24" y="20" width="372" height="280" fill="#F0EBE2"/>
        <rect x="24" y="20" width="110" height="168" fill="#17B3D3"/>
        <rect x="296" y="188" width="100" height="112" fill="#EFE642"/>
        <rect x="134" y="20" width="262" height="72" fill="#F0EBE2"/>
        <rect x="24" y="188" width="110" height="112" fill="#101214"/>
        <path d="M134 20V300M296 92V300M24 188H396M134 92H396" stroke="#070707" stroke-width="6"/>
        <rect x="24" y="20" width="372" height="280" fill="none" stroke="#070707" stroke-width="6"/>
      `,
    },
    1928: {
      year: "1928 · BERLIN, GERMANY",
      head: "扬·奇肖尔德《新排版术》：正式宣告抛弃居中对称",
      body: "1928 年，26 岁的奇肖尔德由德国印刷工会教育协会在柏林出版《Die neue Typographie》。书中系统反对沿袭数世纪的居中排版，主张依据信息层级采用非对称编排、无衬线体与积极留白。",
      src: "出处：加州大学出版社英译版简介（ucpress.edu）。",
      cap: "1928 新排版示意：左齐切轴 + 粗黑标尺线 + 积极留白取代居中花饰。",
      plate: `
        <rect x="24" y="20" width="372" height="280" fill="#111317"/>
        <line x1="138" y1="20" x2="138" y2="300" stroke="#EFE642" stroke-width="2"/>
        <rect x="150" y="38" width="218" height="36" fill="#F0EBE2"/>
        <rect x="150" y="84" width="146" height="14" fill="#17B3D3"/>
        <rect x="40" y="156" width="84" height="10" fill="#EFE642"/>
        <rect x="40" y="176" width="68" height="6" fill="#9AA2AC"/>
        <rect x="40" y="188" width="76" height="6" fill="#9AA2AC"/>
        <rect x="150" y="156" width="202" height="8" fill="#D4D8DF"/>
        <rect x="150" y="172" width="184" height="8" fill="#D4D8DF"/>
        <rect x="150" y="188" width="194" height="8" fill="#D4D8DF"/>
        <rect x="150" y="204" width="128" height="8" fill="#D4D8DF"/>
        <rect x="150" y="242" width="224" height="4" fill="#EFE642"/>
      `,
    },
    1935: {
      year: "1935 BASEL / 1967 ENGLISH EDITION",
      head: "《排版设计》到《非对称排版》：从口号走向日常手册",
      body: "1935 年奇肖尔德移居巴塞尔后由 Benno Schwabe 出版《Typographische Gestaltung》（1967 年由 Ruari McLean 译为英文《Asymmetric Typography》），将非对称推进到名片、海报与书籍的日常实操。",
      src: "出处：Benno Schwabe 1935 初版与 1967 英译本目录记录。",
      cap: "1935 巴塞尔手册示意：字号、行长与留白共同参与非对称平衡，不再只靠粗黑杠。",
      plate: `
        <rect x="24" y="20" width="372" height="280" fill="#F2EDE3"/>
        <line x1="210" y1="20" x2="210" y2="300" stroke="#C7BFB2" stroke-width="1"/>
        <rect x="42" y="42" width="142" height="16" fill="#101214"/>
        <rect x="42" y="66" width="96" height="8" fill="#006176"/>
        <rect x="42" y="188" width="132" height="6" fill="#464C54"/>
        <rect x="42" y="200" width="120" height="6" fill="#464C54"/>
        <rect x="42" y="212" width="138" height="6" fill="#464C54"/>
        <rect x="234" y="42" width="140" height="122" fill="#101214"/>
        <circle cx="304" cy="103" r="32" fill="#EFE642"/>
        <rect x="234" y="188" width="76" height="8" fill="#17B3D3"/>
        <rect x="234" y="204" width="128" height="6" fill="#464C54"/>
        <rect x="234" y="216" width="104" height="6" fill="#464C54"/>
      `,
    },
    1954: {
      year: "1954 · BERKELEY, CALIFORNIA",
      head: "鲁道夫·阿恩海姆《艺术与视知觉》：视觉杠杆与心理力场",
      body: "阿恩海姆在 1954 年首版（1974 年修订）著作开篇《平衡》一章指出：视觉重量由尺寸、位置、明暗、色彩与孤立程度共同决定，距画面支点越远的元素杠杆臂越长，因此小而醒目的偏轴元素足以平衡近中心的大体量块。",
      src: "出处：加州大学出版社《Art and Visual Perception》（ucpress.edu）。",
      cap: "1954 视知觉力场示意：支点不再要求左右镜像，靠远臂高饱和小块平衡近心大体量。",
      plate: `
        <rect x="24" y="20" width="372" height="280" fill="#0B0D10"/>
        <line x1="210" y1="20" x2="210" y2="300" stroke="#EFE642" stroke-dasharray="4 4" stroke-opacity="0.5"/>
        <line x1="24" y1="160" x2="396" y2="160" stroke="#EFE642" stroke-dasharray="4 4" stroke-opacity="0.5"/>
        <circle cx="156" cy="150" r="64" fill="#F0EBE2"/>
        <circle cx="336" cy="126" r="24" fill="#17B3D3"/>
        <line x1="156" y1="242" x2="336" y2="242" stroke="#EFE642" stroke-width="2.5"/>
        <polygon points="210,244 202,258 218,258" fill="#EFE642"/>
        <text x="156" y="274" text-anchor="middle" font-size="11" fill="#F0EBE2" font-family="Space Mono, monospace">近臂重块</text>
        <text x="336" y="274" text-anchor="middle" font-size="11" fill="#2AC8E8" font-family="Space Mono, monospace">远臂亮锚</text>
      `,
    },
    1981: {
      year: "1981 · NIEDERTEUFEN, SWITZERLAND",
      head: "穆勒-布罗克曼《平面设计中的网格系统》：8 至 32 格的秩序引擎",
      body: "瑞士设计师约瑟夫·穆勒-布罗克曼 1981 年于 Arthur Niggli 出版社推出德英双语教材《Raster-Systeme für die visuelle Gestaltung》，系统阐述 8 至 32 格模块化结构、齐左排法与挂线，让非对称跨栏排布既自由又严格可控。",
      src: "出处：Niggli 出版社官方书目（niggli.ch）。",
      cap: "1981 瑞士网格示意：底层精密模格 + 跨格不等块，正是今天 CSS Grid 非对称轨道的前身。",
      plate: `
        <rect x="24" y="20" width="372" height="280" fill="#111317"/>
        <g stroke="#2AC8E8" stroke-opacity="0.32" stroke-width="1">
          <line x1="106" y1="20" x2="106" y2="300"/><line x1="196" y1="20" x2="196" y2="300"/><line x1="296" y1="20" x2="296" y2="300"/>
          <line x1="24" y1="92" x2="396" y2="92"/><line x1="24" y1="168" x2="396" y2="168"/><line x1="24" y1="240" x2="396" y2="240"/>
        </g>
        <rect x="112" y="26" width="178" height="60" fill="#F0EBE2"/>
        <rect x="30" y="98" width="260" height="136" fill="none" stroke="#F0EBE2" stroke-dasharray="3 3" stroke-width="1.4"/>
        <rect x="302" y="98" width="88" height="196" fill="#17B3D3" fill-opacity="0.22" stroke="#17B3D3" stroke-width="1.4"/>
        <rect x="302" y="26" width="88" height="12" fill="#EFE642"/>
      `,
    },
  };

  function select(id) {
    const d = ERAS[id];
    if (!d) return;
    yr.textContent = d.year;
    head.textContent = d.head;
    body.textContent = d.body;
    src.textContent = d.src;
    cap.textContent = d.cap;
    svg.innerHTML = d.plate;
    btns.forEach((b) => {
      const on = b.dataset.era === id;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("1917");
}

// ---------- 03：三件应用示例 X 光剥层 ----------
export function initXraySection() {
  const trio = document.getElementById("app-trio");
  const layerBtns = [...document.querySelectorAll(".xray-btn[data-layer]")];
  const symBtn = document.getElementById("btn-flatten-sym");
  const dForum = document.getElementById("desc-forum");
  const dMag = document.getElementById("desc-mag");
  const dSound = document.getElementById("desc-sound");
  if (!trio || !symBtn) return;

  const ASYM_TEXT = {
    forum: "大标微倾打破水平轴，右下出血巨青圆提供重锚，右上 13px 小明黄块与左下细蓝字遥相配平。",
    mag: "左页大方留白、右页满幅暗调建筑，靠一条跨中缝的明黄竖条把冷暖两页缝成一组非对称双页。",
    sound: "左上明黄出血块与右下粗黑大标形成对角重压，一根极细斜线串起黑圆与青圆，让留白产生声场回响。",
  };
  const SYM_TEXT = {
    forum: "压成居中对称后：标题、圆和字全排在一条竖中线上，安分得像会议日程表，未来感与张力全散。",
    mag: "压成左右对称后：两页变成互相复制的镜像，失去跨页的呼吸落差和建筑摄影的冲击力。",
    sound: "压成居中对称后：明黄条沦为顶部横幅，对角斜线和声音张力彻底消失，只剩普通传单感。",
  };

  layerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.layer;
      const next = trio.dataset[key] === "1" ? "0" : "1";
      trio.dataset[key] = next;
      btn.classList.toggle("is-on", next === "1");
      btn.setAttribute("aria-pressed", String(next === "1"));
    });
  });

  symBtn.addEventListener("click", () => {
    const next = trio.dataset.sym === "1" ? "0" : "1";
    trio.dataset.sym = next;
    symBtn.classList.toggle("is-on", next === "1");
    symBtn.setAttribute("aria-pressed", String(next === "1"));
    symBtn.textContent = next === "1" ? "恢复原海报非对称" : "压扁为居中对称";
    const src = next === "1" ? SYM_TEXT : ASYM_TEXT;
    dForum.textContent = src.forum;
    dMag.textContent = src.mag;
    dSound.textContent = src.sound;
  });
}

// ---------- 04：CSS fr 实时切片台 ----------
export function initCssGridLab() {
  const preview = document.getElementById("css-preview");
  const ratioBtns = [...document.querySelectorAll(".ratio-btn")];
  const widthInput = document.getElementById("css-width");
  const widthOut = document.getElementById("css-width-out");
  const foldBtn = document.getElementById("css-fold");
  const snippet = document.getElementById("css-snippet");
  const note = document.getElementById("css-note");
  if (!preview || !widthInput) return;

  let ratio = "2fr 5fr 3fr";
  let autoFold = true;

  function render() {
    const w = Number(widthInput.value);
    widthOut.textContent = `${w}px`;
    const parts = ratio.split(" ");
    const col3 = preview.querySelector(".cp-c");
    const isTwo = parts.length === 2;
    if (col3) col3.style.display = isTwo ? "none" : "";

    const folded = autoFold && w < 560;
    const activeCols = folded ? "1fr" : ratio;
    preview.style.maxWidth = `${w}px`;
    preview.style.gridTemplateColumns = activeCols;

    const nums = parts.map((p) => parseFloat(p));
    const sum = nums.reduce((a, b) => a + b, 0);
    const gapTotal = (nums.length - 1) * 14 + 28;
    const avail = Math.max(120, w - gapTotal);
    const widthsPx = nums.map((n) => Math.round((avail * n) / sum));
    const minPx = Math.min(...widthsPx);

    snippet.textContent = `.asymmetric-grid {\n  display: grid;\n  grid-template-columns: ${ratio};\n  gap: 14px;\n}${
      autoFold ? `\n@media (max-width: 560px) {\n  .asymmetric-grid { grid-template-columns: 1fr; }\n}` : ""
    }`;

    note.classList.remove("is-warn");
    if (folded) {
      note.textContent = `${w}px 触发断点自动折成单栏（1fr）：守住阅读行宽，不让手机把窄栏压碎。`;
    } else if (minPx < 105) {
      note.classList.add("is-warn");
      note.textContent = `⚠ ${w}px 下最窄栏仅剩约 ${minPx}px（各栏 ${widthsPx.join("px / ")}px）：文字被挤成碎条，必须开启窄屏折行或收缓比例！`;
    } else if (ratio === "1fr 1fr 1fr") {
      note.textContent = `${w}px 下三栏等宽（各约 ${widthsPx[0]}px）：这是均分分栏网格，平稳规整，但没有非对称的主次张力。`;
    } else {
      note.textContent = `${w}px 下各栏实宽约 ${widthsPx.join("px / ")}px：主栏舒适易读，辅栏轻盈透气。`;
    }
  }

  ratioBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      ratio = btn.dataset.ratio;
      ratioBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  widthInput.addEventListener("input", render);
  foldBtn.addEventListener("click", () => {
    autoFold = !autoFold;
    foldBtn.classList.toggle("is-on", autoFold);
    foldBtn.setAttribute("aria-pressed", String(autoFold));
    foldBtn.textContent = `窄屏自动折行：${autoFold ? "开" : "关"}`;
    render();
  });

  render();
}

// ---------- 05：什么时候别用反例模拟器 ----------
export function initAntiSection() {
  const tabs = [...document.querySelectorAll(".anti-tab")];
  const flip = document.getElementById("anti-flip");
  const stateLabel = document.getElementById("anti-state-label");
  const stage = document.getElementById("anti-stage");
  const cap = document.getElementById("anti-caption");
  if (!tabs.length || !stage) return;

  const CASES = {
    pricing: {
      badCap: "三档套餐宽窄不一、高低错位，读者的眼睛来回找同一条权益，比价成本翻倍。",
      goodCap: "改用等宽三栏网格后，价格、额度、按钮全在同一水平线上，扫一眼就能决策。",
      badHtml: `
        <div class="demo-price-bad">
          <div class="dp-box" style="padding-bottom:28px"><strong>基础版</strong><p class="dp-price">¥ 29/月</p><p>3 个项目 · 5GB 空间</p></div>
          <div class="dp-box"><strong>专业版</strong><p class="dp-price">¥ 99</p><p>无限</p></div>
          <div class="dp-box" style="padding-top:22px"><strong>企业版</strong><p class="dp-price">¥ 299/月</p><p>专属节点与单点登录支持</p></div>
        </div>`,
      goodHtml: `
        <div class="demo-price-good">
          <div class="dp-box"><strong>基础版</strong><p class="dp-price">¥ 29/月</p><p>3 个项目<br>5GB 空间</p></div>
          <div class="dp-box" style="border-color:#006176"><strong>专业版</strong><p class="dp-price">¥ 99/月</p><p>无限项目<br>100GB 空间</p></div>
          <div class="dp-box"><strong>企业版</strong><p class="dp-price">¥ 299/月</p><p>专属节点<br>单点登录</p></div>
        </div>`,
    },
    legal: {
      badCap: "把严肃条款刻意拆成左窄右宽、大字偏移，削弱公信力，逐条核对时容易漏读边栏声明。",
      goodCap: "改回严谨的单栏手稿式版心，条文编号整齐垂直对齐，阅读庄重且零歧义。",
      badHtml: `
        <div class="demo-legal-bad">
          <div class="dp-box" style="background:#EFE642;color:#070707"><strong>附件 04</strong><p>违约责任</p></div>
          <div class="dp-box"><strong style="font-size:17px">第十二条 争议解决</strong><p>本协议履行中发生争议，由双方友好协商解决；协商不成的，提交合同签订地人民法院裁决。</p></div>
        </div>`,
      goodHtml: `
        <div class="demo-legal-good">
          <strong style="display:block;text-align:center;margin-bottom:8px">服务协议 · 第十二条 争议解决</strong>
          <p style="margin:0;font-size:12.5px;line-height:1.7">12.1 本协议履行中发生争议，双方应先友好协商。<br>12.2 协商不成的，依法向合同签订地有管辖权的人民法院提起诉讼。</p>
        </div>`,
    },
    narrow: {
      badCap: "375px 手机里硬锁 2:5:3 三栏，左右栏被压成每行两三个字的窄竖条，几乎无法阅读。",
      goodCap: "窄屏果断折成单栏卡片流，按主次顺序上下展开，信息清爽易点。",
      badHtml: `
        <div class="demo-narrow-shell">
          <div class="demo-narrow-bad">
            <div>导<br>航<br>栏<br>压<br>碎</div>
            <div><strong>城市更新报告</strong><br>主文虽然最宽，但仍被两侧挤压得局促。</div>
            <div>配<br>重<br>注<br>释<br>碎</div>
          </div>
        </div>`,
      goodHtml: `
        <div class="demo-narrow-shell">
          <div class="demo-narrow-good">
            <div><strong>城市更新报告</strong><br>先呈现主标题与核心导语，行长舒展。</div>
            <div>次级导航与配重注释退居下方，整行好读。</div>
          </div>
        </div>`,
    },
  };

  let cur = "pricing";
  let fixed = false;

  function render() {
    const c = CASES[cur];
    stage.innerHTML = fixed ? c.goodHtml : c.badHtml;
    cap.textContent = fixed ? c.goodCap : c.badCap;
    stateLabel.textContent = fixed ? "当前：改用合适结构（清晰稳定）" : "当前：硬套非对称网格（翻车）";
    stateLabel.classList.toggle("is-ok", fixed);
    flip.textContent = fixed ? "切回非对称翻车态" : "改用合适结构";
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      cur = btn.dataset.anti;
      fixed = false;
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  flip.addEventListener("click", () => {
    fixed = !fixed;
    render();
  });

  render();
}

// ---------- 06：A/B/C/D 单变量小练习 ----------
export function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  const cards = [...document.querySelectorAll(".quiz-card")];
  const verdict = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("qv-title");
  const vBody = document.getElementById("qv-body");
  if (!grid || !cards.length) return;

  const REASONS = {
    A: {
      ok: false,
      title: "A 工整但落回了居中对称——零非对称张力",
      body: "点亮轨道后可以看到，A 其实是 1:1:1 均分居中，所有元素压在中央竖轴上，没有宽窄反差与偏轴动线。最稳的非对称方案是 B。",
    },
    B: {
      ok: true,
      title: "选对了：B 同时成立了张力、杠杆平衡与锁轨秩序",
      body: "B 按 2:5:3 切出不等分三栏，左侧大主焦搭配右栏远臂明黄条与青色竖锚，杠杆水平稳住；同时每块边缘都死死咬合在隐性虚线轨上。",
    },
    C: {
      ok: false,
      title: "C 和 B 用的是同一套 2:5:3 轨道，但配重堆错边了",
      body: "C 把黄条、青锚和次级块全都挤回重块所在的左侧，右栏彻底空悬，底部杠杆明显左倾翻船。把配重挪去远侧的 B 才稳。",
    },
    D: {
      ok: false,
      title: "D 有 2:5:3 轨道也有右锚，却输在 2 块脱轨漂移",
      body: "看红框标注：D 的导语块和右中块滑离了虚线轨，看似“随性”，实则是失控的没对齐。非对称讲究的是 B 那种“可控的无序”。",
    },
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const choice = card.dataset.choice;
      const r = REASONS[choice];
      grid.classList.add("is-revealed");
      cards.forEach((c) => {
        const ch = c.dataset.choice;
        c.classList.toggle("is-picked", ch === choice);
        c.classList.toggle("is-right", ch === "B");
        c.classList.toggle("is-wrong", ch === choice && ch !== "B");
        c.setAttribute("aria-pressed", String(ch === choice));
      });
      verdict.classList.toggle("is-right", r.ok);
      verdict.classList.toggle("is-wrong", !r.ok);
      vTitle.textContent = r.title;
      vBody.textContent = r.body;
    });
  });
}

// ---------- 07：原海报放大、拖拽平移、Esc 收起 ----------
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbClose = document.getElementById("lb-close");
  const lbZoom = document.getElementById("lb-zoom");
  if (!trigger || !lb || !posterImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbZoom.textContent = scale > 1.1 ? "还原 1.0×" : "放大 1.8×";
  }

  function open() {
    // 复用页面内已内联的 poster.webp，不二次内联图片
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    lbClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  lbClose.addEventListener("click", close);
  lbZoom.addEventListener("click", () => {
    scale = scale > 1.1 ? 1 : 1.8;
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) {
      close();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("is-dragging");
    try {
      lbStage.setPointerCapture(e.pointerId);
    } catch {}
  });

  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });

  const stopDrag = () => {
    dragging = false;
    lbStage.classList.remove("is-dragging");
  };
  lbStage.addEventListener("pointerup", stopDrag);
  lbStage.addEventListener("pointercancel", stopDrag);

  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(1, Math.min(2.8, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
      if (scale === 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false },
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
