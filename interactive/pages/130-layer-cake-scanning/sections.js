// 130 层蛋糕扫描模式 · 正文 01–07 节独立交互与原海报灯箱
// 相邻两节控件形态互不重复：
//   01 左右拉帘对比镜
//   02 原海报五层 X 光显隐开关
//   03 3 秒限时真人扫读计时测验
//   04 五节点年代步进器 + SVG 眼动图谱
//   05 六场景项目需求分拣台
//   06 四选一单变量评测练习
//   07 原海报缩放拖拽灯箱

export function mountSections() {
  initCurtainCompare();
  initXrayAnatomy();
  initTimedScanTest();
  initTimeline();
  initScenarioTriage();
  initQuiz();
  initPosterLightbox();
}

// ---------- 01 节：左右拉帘盲测对比镜 ----------
function initCurtainCompare() {
  const box = document.getElementById("curtain-box");
  const afterPane = document.getElementById("curtain-after");
  const handle = document.getElementById("curtain-handle");
  const slider = document.getElementById("curtain-range");
  const readout = document.getElementById("curtain-readout");
  const snaps = document.querySelectorAll("[data-curtain-snap]");
  if (!box || !afterPane || !handle || !slider) return;

  let pct = 54;
  let dragging = false;

  function apply(val) {
    pct = Math.max(4, Math.min(96, Math.round(val)));
    // 左半部由 0 展开至 pct%：层蛋糕重构版（确保左对齐四条标题始终清晰完整）
    // 右半部 pct%..100%：满行无分层文字墙
    afterPane.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = `${pct}%`;
    slider.value = String(pct);
    if (readout) {
      if (pct >= 72) {
        readout.textContent = `当前主视角：层蛋糕重构版（左占 ${pct}%）——四条前置实词标题切成横带，眼睛跳读 3 次即锁定「并网补贴」层，其余正文全略过（示意）。`;
      } else if (pct <= 28) {
        readout.textContent = `当前主视角：无分层文字墙（右占 ${100 - pct}%）——缺少小标题与留白切缝，眼睛只能在顶部横扫后沿左缘盲滑，找「并网补贴」需逐行翻 11 行（示意）。`;
      } else {
        readout.textContent = `对比中缝 ${pct}% —— 同一段 260 字内容：左半部切成「蛋糕标题 + 奶油正文」横带，右半部糊成连续文字墙。`;
      }
    }
    snaps.forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.curtainSnap) === pct);
    });
  }

  function updateFromClientX(clientX) {
    const r = box.getBoundingClientRect();
    apply(((clientX - r.left) / r.width) * 100);
  }

  box.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, input")) return;
    dragging = true;
    box.setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  });
  box.addEventListener("pointermove", (e) => {
    if (dragging) updateFromClientX(e.clientX);
  });
  box.addEventListener("pointerup", () => { dragging = false; });
  box.addEventListener("pointercancel", () => { dragging = false; });

  slider.addEventListener("input", () => apply(Number(slider.value)));
  snaps.forEach((btn) => {
    btn.addEventListener("click", () => apply(Number(btn.dataset.curtainSnap)));
  });

  apply(pct);
}

// ---------- 02 节：原海报五层 X 光透视显隐开关 ----------
function initXrayAnatomy() {
  const toggles = [...document.querySelectorAll("[data-xray-layer]")];
  const presets = [...document.querySelectorAll("[data-xray-preset]")];
  const reportNote = document.getElementById("xray-note");
  const reportBadge = document.getElementById("xray-badge");
  if (!toggles.length) return;

  const active = new Set(["l1", "l2", "l3", "l4", "l5"]);

  const LAYER_NAMES = {
    l1: "主标题层",
    l2: "副标题层",
    l3: "要点摘要层",
    l4: "信息分块层",
    l5: "行动引导层",
  };

  function render() {
    toggles.forEach((btn) => {
      const id = btn.dataset.xrayLayer;
      const on = active.has(id);
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-on", on);
      const st = btn.querySelector(".xb-state");
      if (st) st.textContent = on ? "显" : "隐";
      const row = document.querySelector(`[data-card-layer="${id}"]`);
      if (row) row.classList.toggle("is-peeled", !on);
    });

    const count = active.size;
    if (reportBadge) {
      reportBadge.textContent = `保留 ${count} / 5 层`;
      reportBadge.className = "xray-badge " + (count === 5 ? "is-ok" : count === 0 ? "is-warn" : "is-mid");
    }

    if (!reportNote) return;
    if (count === 5) {
      reportNote.textContent = "完整五层（原海报结构）：主标定域 → 副标亮结论 → 三枚摘要指标降维 → 三栏分块提供依据 → 底栏收束行动，读者可在任意一层决定停留或继续。";
    } else if (count === 0) {
      reportNote.textContent = "五层全部剥离：信息骨架消失，页面变成一张无从下眼的空白稿纸。点任意开关重新搭回一层。";
    } else if (!active.has("l1")) {
      reportNote.textContent = "缺少「主标题层」：第一眼失去了最大锚点，读者要到第二层甚至摘要里才能猜出整份报告在谈能源转型。";
    } else if (active.has("l1") && active.has("l2") && !active.has("l3") && !active.has("l4") && !active.has("l5")) {
      reportNote.textContent = "只剩主副标题骨架：3 秒就能扫完大意，但缺少「要点摘要层」的 23% 实证与「行动引导层」，读者读完无处落脚。";
    } else if (!active.has("l3")) {
      reportNote.textContent = "剥离了「要点摘要层」：从宏观结论直接跳进三栏密集分块，中间缺少「23% / 光伏风电 / 政策支持」这条缓冲摘要带，快扫读者容易直接关页。";
    } else if (!active.has("l5")) {
      reportNote.textContent = "缺少「行动引导层」：前面四层已帮读者验证完判断，末尾却没有「阅读全文」承接入口，转化链在最后一厘米断掉。";
    } else {
      const missing = Object.keys(LAYER_NAMES).filter((k) => !active.has(k)).map((k) => LAYER_NAMES[k]);
      reportNote.textContent = `当前剥离了「${missing.join("、")}」：余下 ${count} 层仍具条带感，但漏斗过渡出现断档，读完需自行脑补缺失环节。`;
    }
  }

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.xrayLayer;
      if (active.has(id)) active.delete(id);
      else active.add(id);
      render();
    });
  });

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = (btn.dataset.xrayPreset || "").split(",").filter(Boolean);
      active.clear();
      list.forEach((id) => active.add(id));
      render();
    });
  });

  render();
}

// ---------- 03 节：3 秒限时真人扫读小测验 ----------
function initTimedScanTest() {
  const modeBtns = [...document.querySelectorAll("[data-scan-mode]")];
  const startBtn = document.getElementById("scan-start-btn");
  const listEl = document.getElementById("scan-doc-list");
  const statusEl = document.getElementById("scan-status");
  const benchEl = document.getElementById("scan-bench");
  if (!startBtn || !listEl || !statusEl) return;

  const DOC_SECTIONS = [
    {
      id: "s1",
      vague: "一段轻松启程的数字化旅程",
      clear: "账号注册与多设备同步上限",
      body: "每位会员可使用同一手机号在手机、平板与桌面端登录，最多同时保持 5 台设备在线同步云端笔记与离线缓存。",
      isAnswer: false,
    },
    {
      id: "s2",
      vague: "在日常点滴里感受效率之美",
      clear: "云盘空间扩容与单文件体积限制",
      body: "年度会员默认享有 200 GB 附件存储空间，单个上传文件上限为 2 GB，历史版本保留期长达 180 天。",
      isAnswer: false,
    },
    {
      id: "s3",
      vague: "不必为改变主意而感到困扰",
      clear: "年费退款截止期限：开通后 14 天内可全额退",
      body: "若使用体验未达预期，年度会员可在首次扣款后 14 个自然日内于账单页自助申请全额退款，原路退回约需 1–3 个工作日。",
      isAnswer: true,
    },
    {
      id: "s4",
      vague: "让好工具陪伴更长久的时光",
      clear: "自动续费关闭方式与到期数据保留",
      body: "关闭自动续费后，已购权益仍持续至当期结束；到期降级为免费版后，已有文档永久可读且不删除。",
      isAnswer: false,
    },
    {
      id: "s5",
      vague: "随时响起的温暖守护之声",
      clear: "人工客服响应时段与发票开具入口",
      body: "工作日 09:00–21:00 提供在线人工支持，电子增值税普通发票可在支付完成后 90 天内于个人中心自助下载。",
      isAnswer: false,
    },
  ];

  let mode = "vague";
  let running = false;
  let startedAt = 0;
  let best = { vague: null, clear: null };

  function renderList() {
    listEl.innerHTML = "";
    DOC_SECTIONS.forEach((sec, idx) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "scan-sec-item" + (mode === "clear" ? " is-cake" : " is-vague");
      item.dataset.secId = sec.id;
      item.innerHTML = `
        <span class="scan-sec-head">${mode === "clear" ? sec.clear : sec.vague}</span>
        <span class="scan-sec-body">${sec.body}</span>
      `;
      item.addEventListener("click", () => handlePick(sec, item));
      listEl.appendChild(item);
      if (!running) {
        item.dataset.ready = String(idx);
      }
    });
  }

  function updateBench() {
    if (!benchEl) return;
    const aText = best.vague != null ? `${(best.vague / 1000).toFixed(2)} 秒` : "未测";
    const bText = best.clear != null ? `${(best.clear / 1000).toFixed(2)} 秒` : "未测";
    let diff = "";
    if (best.vague != null && best.clear != null) {
      const saved = best.vague - best.clear;
      diff = saved > 120
        ? ` · 信息前置版快了 ${(saved / 1000).toFixed(2)} 秒`
        : " · 两版均已测完，可反复切换体感差异";
    }
    benchEl.textContent = `你的实测记录：悬念标题版 ${aText} ｜ 层蛋糕实词版 ${bText}${diff}`;
  }

  function handlePick(sec, btn) {
    if (!running) {
      // 未点开始也允许直接点选体验，立刻给出计时起点提示
      startedAt = performance.now() - 1200;
      running = true;
    }
    const elapsed = Math.max(120, Math.round(performance.now() - startedAt));
    if (sec.isAnswer) {
      running = false;
      btn.classList.add("is-correct");
      best[mode] = best[mode] == null ? elapsed : Math.min(best[mode], elapsed);
      const secStr = (elapsed / 1000).toFixed(2);
      statusEl.textContent = mode === "clear"
        ? `命中！你在 ${secStr} 秒内靠标题直接锁定了「年费退款截止期限」，几乎不用读其他四段正文。`
        : `找到了，用时 ${secStr} 秒——由于小标题全是悬念语，你不得不往正文小字里翻找「14 天退款」。现在切到「B 信息前置版」再测一次！`;
      statusEl.className = "scan-status is-hit";
      startBtn.textContent = "再测一次";
      updateBench();
    } else {
      btn.classList.add("is-wrong");
      statusEl.textContent = `这一节写的是「${sec.clear.slice(0, 10)}…」，不含年费退款截止期限，继续找！`;
      statusEl.className = "scan-status is-miss";
    }
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.scanMode;
      running = false;
      modeBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      statusEl.textContent = mode === "clear"
        ? "已切至「信息前置层蛋糕版」：点「开始计时」，看你多久锁定「年费退款截止期限」。"
        : "已切至「悬念文学标题版」：点「开始计时」，在下方五节里点出含「年费退款截止期限」的那一节。";
      statusEl.className = "scan-status";
      startBtn.textContent = "开始计时找答案";
      renderList();
    });
  });

  startBtn.addEventListener("click", () => {
    running = true;
    startedAt = performance.now();
    renderList();
    statusEl.textContent = "计时进行中：请立即点选包含「年费退款截止期限」的那一节！";
    statusEl.className = "scan-status is-live";
    startBtn.textContent = "重新计时";
  });

  renderList();
  updateBench();
}

// ---------- 04 节：五节点眼动实证年代步进器 ----------
function initTimeline() {
  const btns = [...document.querySelectorAll("[data-era-id]")];
  const titleEl = document.getElementById("era-title");
  const metaEl = document.getElementById("era-meta");
  const descEl = document.getElementById("era-desc");
  const svgEl = document.getElementById("era-svg");
  if (!btns.length || !titleEl || !svgEl) return;

  const ERAS = {
    "1969": {
      title: "结构化写作与信息分块",
      meta: "1967–1969 · Robert E. Horn《Information Mapping for Learning and Reference》",
      desc: "心理学家与信息架构先驱 Robert E. Horn 指出传统连贯散文会拖慢检索，提出把技术手册拆成有限长度的「信息块（chunk）」，并为每一块贴上描述性边栏标签与标题——这是现代网页横向分层扫读在纸媒时代的结构原型。",
      diagram: "chunks",
    },
    "1997": {
      title: "「用户并不逐字读网页」",
      meta: "1997-10-01 · Jakob Nielsen《How Users Read on the Web》（NN/g）",
      desc: "尼尔森诺曼集团的经典测试显示，79% 的受试者在面对新网页时默认扫读，只有 16% 逐字通读。报告提出五项可扫读写作原则：有意义的小标题、项目符号、高亮关键词、倒金字塔结构与更精简的字数。",
      diagram: "skim97",
    },
    "2009": {
      title: "大规模眼动热图实证",
      meta: "2009 · Jakob Nielsen & Kara Pernice《Eyetracking Web Usability》（New Riders）",
      desc: "汇总多年大规模眼动注视数据，直观展示了无结构长文触发的 F 型衰减，以及清晰小标题与层级留白如何把视线稳稳拉回每一个主题入口，奠定现代信息层级设计的实证基础。",
      diagram: "eye09",
    },
    "2019": {
      title: "正式命名「层蛋糕扫描模式」",
      meta: "2019-08-04 & 08-25 · Kara Pernice（NN/g）；2020-04-05 · Kate Moran 综述",
      desc: "Kara Pernice 在 NN/g 专题文章《The Layer-Cake Pattern of Scanning Content on the Web》中正式以「层蛋糕」命名：热图在大小标题上呈水平浓带、正文处留白如奶油夹层。NN/g 指出，除逐字精读外，这是迄今最高效的网页扫读模式。",
      diagram: "cake19",
    },
    "2024": {
      title: "视觉层级与无障碍语义汇流",
      meta: "W3C WCAG 2.1（2.4.6 AA / 2.4.10 AAA）· WebAIM 第 10 次读屏调查（2023–2024）",
      desc: "W3C WCAG 2.1 明确要求标题清晰说明主题并组织内容分节；WebAIM 第 10 次屏幕阅读器用户调查（2023 年 12 月至 2024 年 1 月）更显示，71.6% 的读屏用户靠标题列表浏览长页面——清晰的层蛋糕同时服务肉眼与读屏。",
      diagram: "a11y24",
    },
  };

  function renderDiagram(kind) {
    if (kind === "chunks") {
      return `
        <svg viewBox="0 0 320 176" role="img" aria-label="1969 信息分块结构图">
          <rect x="12" y="14" width="296" height="148" rx="8" fill="#150D33" stroke="rgba(254,238,221,0.2)"/>
          <g fill="#F6E5CF">
            <rect x="24" y="28" width="66" height="28" rx="4" fill="#F57865"/>
            <rect x="102" y="28" width="192" height="10" rx="2" opacity="0.85"/>
            <rect x="102" y="44" width="146" height="8" rx="2" opacity="0.45"/>
            <rect x="24" y="72" width="66" height="28" rx="4" fill="#FCB396"/>
            <rect x="102" y="72" width="184" height="10" rx="2" opacity="0.85"/>
            <rect x="102" y="88" width="158" height="8" rx="2" opacity="0.45"/>
            <rect x="24" y="116" width="66" height="28" rx="4" fill="#F3CCB3"/>
            <rect x="102" y="116" width="176" height="10" rx="2" opacity="0.85"/>
            <rect x="102" y="132" width="132" height="8" rx="2" opacity="0.45"/>
          </g>
          <line x1="95" y1="24" x2="95" y2="152" stroke="#F57865" stroke-dasharray="3 3" opacity="0.65"/>
        </svg>`;
    }
    if (kind === "skim97") {
      return `
        <svg viewBox="0 0 320 176" role="img" aria-label="1997 网页扫读与精读比例示意">
          <rect x="12" y="14" width="296" height="148" rx="8" fill="#150D33" stroke="rgba(254,238,221,0.2)"/>
          <text x="28" y="42" fill="#FEEEDD" font-size="13" font-weight="700">NN/g 1997 测试受试者阅读行为</text>
          <rect x="28" y="60" width="264" height="26" rx="4" fill="rgba(254,238,221,0.1)"/>
          <rect x="28" y="60" width="208" height="26" rx="4" fill="#F57865"/>
          <text x="38" y="78" fill="#11082D" font-size="12" font-weight="700">79% 始终先扫读</text>
          <rect x="28" y="102" width="264" height="26" rx="4" fill="rgba(254,238,221,0.1)"/>
          <rect x="28" y="102" width="44" height="26" rx="4" fill="#F6E5CF"/>
          <text x="80" y="120" fill="#FEEEDD" font-size="12">16% 逐字通读</text>
          <text x="28" y="148" fill="#BEB5D1" font-size="11">出处：Jakob Nielsen, How Users Read on the Web (1997)</text>
        </svg>`;
    }
    if (kind === "eye09") {
      return `
        <svg viewBox="0 0 320 176" role="img" aria-label="2009 眼动热图对比：无标题与有标题">
          <rect x="12" y="14" width="140" height="148" rx="8" fill="#150D33" stroke="rgba(254,238,221,0.2)"/>
          <rect x="168" y="14" width="140" height="148" rx="8" fill="#150D33" stroke="rgba(110,224,178,0.45)"/>
          <text x="26" y="34" fill="#FFB29F" font-size="11" font-weight="700">无小标题 · 退回 F 型</text>
          <rect x="26" y="46" width="108" height="11" rx="5" fill="#F57865" opacity="0.85"/>
          <rect x="26" y="66" width="68" height="10" rx="5" fill="#F57865" opacity="0.68"/>
          <rect x="26" y="46" width="13" height="98" rx="5" fill="#F57865" opacity="0.55"/>
          <text x="182" y="34" fill="#8CF0C5" font-size="11" font-weight="700">清晰小标题 · 横带分层</text>
          <rect x="182" y="48" width="110" height="12" rx="4" fill="#F6E5CF"/>
          <rect x="182" y="66" width="90" height="5" rx="2" fill="#FEEEDD" opacity="0.24"/>
          <rect x="182" y="84" width="104" height="12" rx="4" fill="#F98F6F"/>
          <rect x="182" y="102" width="84" height="5" rx="2" fill="#FEEEDD" opacity="0.24"/>
          <rect x="182" y="120" width="112" height="12" rx="4" fill="#FCB396"/>
          <rect x="182" y="138" width="76" height="5" rx="2" fill="#FEEEDD" opacity="0.24"/>
        </svg>`;
    }
    if (kind === "cake19") {
      return `
        <svg viewBox="0 0 320 176" role="img" aria-label="2019 层蛋糕眼动热图条带">
          <rect x="12" y="14" width="296" height="148" rx="8" fill="#150D33" stroke="rgba(254,238,221,0.2)"/>
          <rect x="28" y="30" width="212" height="16" rx="8" fill="#F57865" opacity="0.88"/>
          <rect x="28" y="52" width="166" height="6" rx="3" fill="#FEEEDD" opacity="0.2"/>
          <rect x="28" y="72" width="194" height="16" rx="8" fill="#F98F6F" opacity="0.88"/>
          <rect x="28" y="94" width="150" height="6" rx="3" fill="#FEEEDD" opacity="0.2"/>
          <rect x="28" y="114" width="244" height="18" rx="8" fill="#6EE0B2" opacity="0.9"/>
          <rect x="28" y="138" width="224" height="11" rx="4" fill="#6EE0B2" opacity="0.42"/>
          <text x="252" y="42" fill="#FEEEDD" font-size="10">略读</text>
          <text x="252" y="84" fill="#FEEEDD" font-size="10">略读</text>
          <text x="276" y="127" fill="#8CF0C5" font-size="10" font-weight="700">深入</text>
        </svg>`;
    }
    return `
      <svg viewBox="0 0 320 176" role="img" aria-label="2024 无障碍标题树与读屏比例">
        <rect x="12" y="14" width="296" height="148" rx="8" fill="#150D33" stroke="rgba(254,238,221,0.2)"/>
        <text x="28" y="40" fill="#8CF0C5" font-size="12" font-weight="700">WebAIM #10 · 71.6% 靠标题导航长页面</text>
        <rect x="28" y="54" width="44" height="20" rx="4" fill="#F6E5CF"/><text x="38" y="68" fill="#11082D" font-size="11" font-weight="700">H1</text>
        <rect x="82" y="59" width="196" height="10" rx="3" fill="#FEEEDD" opacity="0.85"/>
        <rect x="46" y="86" width="44" height="20" rx="4" fill="#F98F6F"/><text x="56" y="100" fill="#11082D" font-size="11" font-weight="700">H2</text>
        <rect x="100" y="91" width="172" height="10" rx="3" fill="#FEEEDD" opacity="0.72"/>
        <rect x="64" y="118" width="44" height="20" rx="4" fill="#FCB396"/><text x="74" y="132" fill="#11082D" font-size="11" font-weight="700">H3</text>
        <rect x="118" y="123" width="144" height="10" rx="3" fill="#FEEEDD" opacity="0.58"/>
      </svg>`;
  }

  function show(id) {
    const item = ERAS[id] || ERAS["2019"];
    btns.forEach((b) => {
      const active = b.dataset.eraId === id;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    });
    titleEl.textContent = item.title;
    metaEl.textContent = item.meta;
    descEl.textContent = item.desc;
    svgEl.innerHTML = renderDiagram(item.diagram);
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.eraId)));
  show("2019");
}

// ---------- 05 节：六场景项目需求分拣台 ----------
function initScenarioTriage() {
  const btns = [...document.querySelectorAll("[data-brief-id]")];
  const stamp = document.getElementById("triage-stamp");
  const title = document.getElementById("triage-title");
  const reason = document.getElementById("triage-reason");
  const alt = document.getElementById("triage-alt");
  const preview = document.getElementById("triage-preview");
  if (!btns.length || !stamp || !title) return;

  const BRIEFS = {
    report: {
      verdict: "推荐层蛋糕",
      kind: "yes",
      title: "年度气候与能源数据报告（长网页）",
      reason: "读者多为高管、记者或研究员，各取所需——有人只查装机总量，有人只看投资增速。把结论、指标、分块图表与下载入口切成五层横带，3 秒定去留，效率最高。",
      alt: "建议做法：每层主副标题直给数字结论，正文细节退居柔和次色，末层放完整报告下载。",
      viz: "cake",
    },
    consent: {
      verdict: "禁用 · 改承诺通读",
      kind: "no",
      title: "手术与药物知情同意书",
      reason: "层蛋糕天然鼓励读者「跳过自认为不相关的正文」。但在医疗、法律合同与安全规程里，漏看任何一条免责条款或禁忌剂量都可能酿成严重后果，绝不能引导跳读。",
      alt: "替代方案：分段编号 + 逐条勾选确认（Commitment Pattern），确保关键风险被逐句读完。",
      viz: "commit",
    },
    novel: {
      verdict: "禁用 · 改沉浸叙事",
      kind: "no",
      title: "悬疑短篇小说 / 个人散文",
      reason: "叙事靠节奏铺垫、留白与反转制造情绪。如果每两段塞一条「凶手在阁楼露出马脚」式信息前置小标题，等于提前剧透并打断心流。",
      alt: "替代方案：克制的章节号与连续长行距阅读流，让读者顺着文字时间线自然推进。",
      viz: "prose",
    },
    pricing: {
      verdict: "推荐层蛋糕",
      kind: "yes",
      title: "SaaS 产品版本与定价对比页",
      reason: "潜在买家带着极其具体的核查清单进站（价格、人数上限、单点登录、发票与退款）。按「版本总览 → 核心配额 → 安全合规 → 常见问题 → 试用入口」分层横扫，转化阻力最低。",
      alt: "建议做法：用重复等宽条带与清晰左锚分组标题，让读者一眼跳到自己在意的配额带。",
      viz: "cake",
    },
    policy: {
      verdict: "推荐层蛋糕",
      kind: "yes",
      title: "电商退换货与售后帮助中心",
      reason: "遇到售后问题的用户心急且目标单一（只想知道「拆封能不能退」或「运费谁出」）。清晰的信息型小标题能把焦虑感降到最低，减少人工客服咨询量。",
      alt: "建议做法：标题直接用「场景 + 结论」句式，把最常查的 7 天规则放在靠上层级。",
      viz: "cake",
    },
    poster: {
      verdict: "禁用 · 改单屏视觉流",
      kind: "no",
      title: "独立咖啡馆开业单页视觉海报",
      reason: "整张画面只有店名、时间、地址和一张主视觉摄影，信息总量不到 30 字。强行切成五层水平标题条带，会把氛围感冲得支离破碎。",
      alt: "替代方案：用单屏大留白配合对角引导（可参考 128 Z 型扫描模式），一次收拢视线。",
      viz: "zflow",
    },
  };

  function vizSvg(kind) {
    if (kind === "cake") {
      return `<svg viewBox="0 0 240 130" role="img" aria-label="层蛋糕结构示意">
        <rect x="8" y="8" width="224" height="114" rx="6" fill="#150D33"/>
        <rect x="20" y="20" width="200" height="18" rx="3" fill="#F6E5CF"/>
        <rect x="20" y="45" width="200" height="18" rx="3" fill="#F3CCB3"/>
        <rect x="20" y="70" width="200" height="18" rx="3" fill="#F98F6F"/>
        <rect x="20" y="95" width="200" height="16" rx="3" fill="#EFDECA"/>
      </svg>`;
    }
    if (kind === "commit") {
      return `<svg viewBox="0 0 240 130" role="img" aria-label="逐条确认通读示意">
        <rect x="8" y="8" width="224" height="114" rx="6" fill="#FAF5EC" stroke="#D5C8B8"/>
        <g fill="#463D62">
          <rect x="24" y="24" width="12" height="12" rx="2" fill="none" stroke="#B3371E" stroke-width="1.6"/>
          <rect x="44" y="26" width="168" height="8" rx="2"/>
          <rect x="24" y="52" width="12" height="12" rx="2" fill="none" stroke="#B3371E" stroke-width="1.6"/>
          <rect x="44" y="54" width="154" height="8" rx="2"/>
          <rect x="24" y="80" width="12" height="12" rx="2" fill="none" stroke="#B3371E" stroke-width="1.6"/>
          <rect x="44" y="82" width="164" height="8" rx="2"/>
          <rect x="24" y="104" width="84" height="10" rx="3" fill="#B3371E"/>
        </g>
      </svg>`;
    }
    if (kind === "prose") {
      return `<svg viewBox="0 0 240 130" role="img" aria-label="连续沉浸叙事示意">
        <rect x="8" y="8" width="224" height="114" rx="6" fill="#FAF5EC" stroke="#D5C8B8"/>
        <g fill="#463D62" opacity="0.62">
          <rect x="44" y="24" width="152" height="6" rx="2"/>
          <rect x="32" y="38" width="176" height="6" rx="2"/>
          <rect x="32" y="52" width="170" height="6" rx="2"/>
          <rect x="32" y="66" width="162" height="6" rx="2"/>
          <rect x="44" y="84" width="150" height="6" rx="2"/>
          <rect x="32" y="98" width="174" height="6" rx="2"/>
        </g>
      </svg>`;
    }
    return `<svg viewBox="0 0 240 130" role="img" aria-label="单屏对角视觉流示意">
      <rect x="8" y="8" width="224" height="114" rx="6" fill="#150D33"/>
      <circle cx="120" cy="64" r="32" fill="#F98F6F" opacity="0.32"/>
      <path d="M30 28 H206 L34 102 H204" fill="none" stroke="#F6E5CF" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="30" cy="28" r="5" fill="#F6E5CF"/>
      <circle cx="204" cy="102" r="6" fill="#F57865"/>
    </svg>`;
  }

  function show(id) {
    const b = BRIEFS[id] || BRIEFS.report;
    btns.forEach((btn) => {
      const active = btn.dataset.briefId === id;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    stamp.textContent = b.verdict;
    stamp.className = "triage-stamp " + (b.kind === "yes" ? "is-yes" : "is-no");
    title.textContent = b.title;
    reason.textContent = b.reason;
    alt.textContent = b.alt;
    preview.innerHTML = vizSvg(b.viz);
  }

  btns.forEach((btn) => btn.addEventListener("click", () => show(btn.dataset.briefId)));
  show("report");
}

// ---------- 06 节：四选一单变量评测练习 ----------
function initQuiz() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const fb = document.getElementById("quiz-feedback");
  const retry = document.getElementById("quiz-retry");
  if (!cards.length || !fb) return;

  const REASONS = {
    A: {
      ok: false,
      head: "选了方案 A：条带很清楚，但小标题在「卖关子」",
      body: "方案 A 把字号反差和段间留白都做对了，视觉上看很像层蛋糕；可四个小标题写成「开启安心生活」「看不见的守护」，根本看不出哪一节讲电池应急供电，读者仍被迫逐段翻正文——有层无意。",
    },
    B: {
      ok: false,
      head: "选了方案 B：标题写得很准，但视觉层没切开",
      body: "方案 B 的四条标题确实把「门体厚度」「电池续航与应急供电」写在了开头，可惜字号只比正文大 1px、不加粗且上下等距，远看黏成一整面文字墙，眼睛抓不到横向落点——有意无层。",
    },
    C: {
      ok: true,
      head: "判断准确！方案 C 同时成立「横向层读」与「标题驱动」",
      body: "方案 C 的小标题既前置了实词（「电池续航与应急供电」），又通过显著字号、粗重与「段上宽、段下紧」的留白把四层清楚切开，同时让正文保持克制灰墨细字。读者 2 秒就能越过前一层，精准切入应急供电条款。",
    },
    D: {
      ok: false,
      head: "选了方案 D：正文满铺加粗高亮，毁掉了蛋糕与奶油的反差",
      body: "方案 D 标题本身写得不错，但它把正文里超过一半的句子也涂上粗体和珊瑚底块。当整张页面都在大声喊叫，小标题失去独占的视觉锚点，视线退化成无序的斑点乱跳。",
    },
  };

  function pick(opt) {
    const r = REASONS[opt];
    if (!r) return;
    cards.forEach((c) => {
      const id = c.dataset.quizOpt;
      c.classList.remove("is-picked", "is-correct", "is-wrong");
      if (id === opt) {
        c.classList.add("is-picked", r.ok ? "is-correct" : "is-wrong");
      } else if (r.ok && id === "C") {
        c.classList.add("is-correct");
      }
      c.setAttribute("aria-pressed", String(id === opt));
    });
    fb.hidden = false;
    fb.className = "quiz-feedback " + (r.ok ? "is-ok" : "is-bad");
    fb.innerHTML = `<strong>${r.head}</strong><p>${r.body}</p>`;
    if (retry) retry.hidden = false;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.quizOpt)));
  if (retry) {
    retry.addEventListener("click", () => {
      cards.forEach((c) => {
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", "false");
      });
      fb.hidden = true;
      retry.hidden = true;
    });
  }
}

// ---------- 07 节：原海报放大拖拽灯箱 ----------
function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-zoom-btn");
  const dialog = document.getElementById("poster-lightbox");
  const bigImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomIn = document.getElementById("lightbox-in");
  const zoomOut = document.getElementById("lightbox-out");
  const zoomReset = document.getElementById("lightbox-reset");
  const canvasBox = document.getElementById("lightbox-viewport");
  if (!poster || !dialog || !bigImg || !canvasBox) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomReset) zoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLightbox() {
    bigImg.src = poster.src;
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
    openBtn?.focus();
  }

  poster.addEventListener("click", openLightbox);
  openBtn?.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === canvasBox) closeLightbox();
  });

  zoomIn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  canvasBox.addEventListener("wheel", (e) => {
    if (dialog.hidden) return;
    e.preventDefault();
    scale = Math.max(0.75, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  bigImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pan = { x: e.clientX, y: e.clientY, tx, ty };
    bigImg.setPointerCapture?.(e.pointerId);
  });
  bigImg.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = pan.tx + (e.clientX - pan.x);
    ty = pan.ty + (e.clientY - pan.y);
    applyTransform();
  });
  bigImg.addEventListener("pointerup", () => { pan = null; });
  bigImg.addEventListener("pointercancel", () => { pan = null; });

  window.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") {
      e.preventDefault();
      closeLightbox();
    }
  });
}
