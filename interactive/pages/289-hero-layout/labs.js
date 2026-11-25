// 01–07 节交互实验室与原海报灯箱（相邻两节绝不用同一种控件做同一件事）

import {
  PALETTE,
  CHAIN_ORDERS,
  EVIDENCE_NODES,
  ARCHETYPE_CARDS,
  SCRIM_METHODS,
  evaluateScrimLab,
  ANTI_CASES,
  QUIZ_OPTIONS,
  clamp,
} from "./model.js";

// ---------- 01 节：三步链条顺序打乱器 ----------
export function initChainLab() {
  const btnsEl = document.getElementById("chain-buttons");
  const svgEl = document.getElementById("chain-svg");
  const badgeEl = document.getElementById("chain-badge");
  const sumEl = document.getElementById("chain-summary");
  const whyEl = document.getElementById("chain-why");
  if (!btnsEl || !svgEl) return;

  let active = CHAIN_ORDERS[0].id;

  function render() {
    const item = CHAIN_ORDERS.find((c) => c.id === active) || CHAIN_ORDERS[0];
    btnsEl.innerHTML = CHAIN_ORDERS.map(
      (c) =>
        `<button type="button" class="chain-btn${c.id === active ? " is-active" : ""}" data-chain="${c.id}" aria-pressed="${c.id === active}">${c.label}</button>`
    ).join("");

    const strokeColor =
      item.status === "pass" ? PALETTE.cobalt : item.status === "warn" ? PALETTE.ochreText : PALETTE.fail;

    const nodesSvg = item.nodes
      .map((n, i) => {
        const fill =
          n.key === "H" ? PALETTE.gold : n.key === "M" ? PALETTE.cobalt : PALETTE.ink;
        const textFill = n.key === "H" ? PALETTE.ink : PALETTE.paperLight;
        return `
          <g>
            <circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${fill}" stroke="${PALETTE.cobaltDeep}" stroke-width="2"></circle>
            <text x="${n.x}" y="${n.y - 4}" text-anchor="middle" fill="${textFill}" font-family="Outfit, sans-serif" font-weight="900" font-size="20">${n.key}</text>
            <text x="${n.x}" y="${n.y + 15}" text-anchor="middle" fill="${textFill}" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="11">${n.title}</text>
            <circle cx="${n.x}" cy="${n.y - n.r - 12}" r="10" fill="${strokeColor}"></circle>
            <text x="${n.x}" y="${n.y - n.r - 8}" text-anchor="middle" fill="#FFFBF0" font-family="DM Mono, monospace" font-weight="500" font-size="11">${n.rank}</text>
          </g>`;
      })
      .join("");

    svgEl.innerHTML = `
      <defs>
        <marker id="chain-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 1 1 L 9 5 L 1 9 z" fill="${strokeColor}" />
        </marker>
      </defs>
      <rect x="0" y="0" width="540" height="214" fill="${PALETTE.paper}" />
      <path d="${item.path}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#chain-arr)" />
      ${nodesSvg}
      <text x="16" y="200" fill="${PALETTE.inkSoft}" font-family="DM Mono, monospace" font-size="11">VISUAL WEIGHT &amp; SCAN PATH</text>
      <text x="524" y="200" text-anchor="end" fill="${strokeColor}" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="11">${item.badge}</text>
    `;

    badgeEl.textContent = item.badge;
    badgeEl.dataset.status = item.status;
    sumEl.textContent = item.summary;
    whyEl.textContent = item.why;
  }

  btnsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-chain]");
    if (!b) return;
    active = b.dataset.chain;
    render();
  });

  render();
}

// ---------- 02 节：首屏注意力时间刻度与 2010/2018 对比 ----------
export function initEvidenceLab() {
  const railEl = document.getElementById("evidence-rail");
  const titleEl = document.getElementById("evidence-title");
  const srcEl = document.getElementById("evidence-source");
  const bodyEl = document.getElementById("evidence-body");
  const impEl = document.getElementById("evidence-implication");
  const yrBtns = document.getElementById("fold-year-btns");
  const aboveFill = document.getElementById("fold-above-bar");
  const belowFill = document.getElementById("fold-below-bar");
  const foldNote = document.getElementById("fold-year-note");
  if (!railEl) return;

  let active = EVIDENCE_NODES[0].id;
  let activeYear = "2018";

  function renderTimeline() {
    const node = EVIDENCE_NODES.find((n) => n.id === active) || EVIDENCE_NODES[0];
    railEl.innerHTML = EVIDENCE_NODES.map(
      (n) =>
        `<button type="button" class="ev-node${n.id === active ? " is-active" : ""}" data-ev="${n.id}" aria-pressed="${n.id === active}">
          <span class="ev-time">${n.time}</span>
          <span class="ev-short">${n.title.split("：")[0]}</span>
        </button>`
    ).join("");
    titleEl.textContent = node.title;
    srcEl.textContent = `出处：${node.source}`;
    bodyEl.textContent = node.body;
    impEl.textContent = node.implication;
  }

  function renderYear() {
    if (!yrBtns || !aboveFill || !belowFill || !foldNote) return;
    const is2010 = activeYear === "2010";
    const abovePct = is2010 ? 80 : 57;
    const belowPct = 100 - abovePct;
    yrBtns.querySelectorAll("button[data-year]").forEach((b) => {
      const on = b.dataset.year === activeYear;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    aboveFill.style.width = `${abovePct}%`;
    aboveFill.textContent = `折叠线上 ${abovePct}%`;
    belowFill.style.width = `${belowPct}%`;
    belowFill.textContent = `滚动后 ${belowPct}%`;
    foldNote.textContent = is2010
      ? "2010 年 NN/g 眼动数据：桌面用户约 80% 浏览时间集中在折叠线之上，早期网站常把整屏塞得极满。"
      : "2018 年 NN/g 眼动数据（Therese Fessenden）：折叠线上占约 57%（前两屏合计约 74%）。人们早已习惯滚动，但首屏仍拿走了超过一半注意力。";
  }

  railEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-ev]");
    if (!b) return;
    active = b.dataset.ev;
    renderTimeline();
  });

  yrBtns?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-year]");
    if (!b) return;
    activeYear = b.dataset.year;
    renderYear();
  });

  renderTimeline();
  renderYear();
}

// ---------- 03 节：四种骨架 × 跨屏裁切器 ----------
function archetypeSvg(archId, device) {
  const isMobile = device === "390";
  const isLaptop = device === "1280";
  const W = isMobile ? 164 : 290;
  const H = isMobile ? 210 : 176;
  const foldY = isMobile ? 168 : isLaptop ? 124 : 148;
  const clipWarn = isLaptop && (archId === "centered" || archId === "fullbleed");

  let body = "";
  if (archId === "split") {
    if (isMobile) {
      body = `
        <rect x="14" y="22" width="136" height="72" fill="${PALETTE.gold}" rx="2" />
        <polygon points="14,94 82,22 150,22 150,94" fill="${PALETTE.cobalt}" opacity="0.82" />
        <rect x="14" y="106" width="108" height="10" fill="${PALETTE.paperLight}" />
        <rect x="14" y="122" width="124" height="6" fill="#B6C3EB" />
        <rect x="14" y="138" width="76" height="18" fill="${PALETTE.gold}" rx="2" />
      `;
    } else {
      body = `
        <rect x="16" y="34" width="96" height="12" fill="${PALETTE.paperLight}" />
        <rect x="16" y="52" width="106" height="7" fill="#B6C3EB" />
        <rect x="16" y="64" width="84" height="7" fill="#B6C3EB" />
        <rect x="16" y="84" width="72" height="20" fill="${PALETTE.gold}" rx="2" />
        <rect x="140" y="24" width="134" height="104" fill="${PALETTE.cobalt}" stroke="${PALETTE.gold}" stroke-width="1.5" rx="2" />
        <circle cx="212" cy="74" r="32" fill="${PALETTE.gold}" />
      `;
    }
  } else if (archId === "fullbleed") {
    const btnY = isLaptop ? 116 : isMobile ? 132 : 112;
    body = `
      <rect x="2" y="16" width="${W - 4}" height="${isMobile ? 164 : 138}" fill="${PALETTE.cobalt}" />
      <circle cx="${W * 0.72}" cy="${isMobile ? 74 : 78}" r="${isMobile ? 34 : 42}" fill="${PALETTE.gold}" />
      <rect x="2" y="16" width="${W * 0.62}" height="${isMobile ? 164 : 138}" fill="${PALETTE.cobaltDeep}" opacity="0.72" />
      <rect x="16" y="${isMobile ? 64 : 46}" width="${W * 0.52}" height="12" fill="${PALETTE.paperLight}" />
      <rect x="16" y="${isMobile ? 84 : 66}" width="${W * 0.46}" height="7" fill="#D4DDF6" />
      <rect x="16" y="${btnY}" width="74" height="20" fill="${PALETTE.gold}" rx="2" />
    `;
  } else if (archId === "centered") {
    const imgY = isLaptop ? 104 : isMobile ? 110 : 96;
    const btnY = isLaptop ? 76 : 68;
    body = `
      <rect x="${W * 0.2}" y="28" width="${W * 0.6}" height="12" fill="${PALETTE.paperLight}" />
      <rect x="${W * 0.26}" y="46" width="${W * 0.48}" height="7" fill="#B6C3EB" />
      <rect x="${W * 0.5 - 38}" y="${btnY}" width="76" height="19" fill="${PALETTE.gold}" rx="2" />
      <rect x="${W * 0.14}" y="${imgY}" width="${W * 0.72}" height="${isMobile ? 74 : 58}" fill="${PALETTE.cobalt}" stroke="${PALETTE.gold}" stroke-width="1.5" rx="2" />
      <circle cx="${W * 0.5}" cy="${imgY + 28}" r="18" fill="${PALETTE.gold}" />
    `;
  } else {
    body = `
      <polygon points="${W * 0.28},${H - 18} ${W * 0.64},18 ${W - 2},30 ${W - 2},${H - 36}" fill="${PALETTE.cobalt}" />
      <circle cx="${W * 0.68}" cy="${isMobile ? 72 : 76}" r="${isMobile ? 30 : 38}" fill="${PALETTE.gold}" />
      <polygon points="${W * 0.68},${isMobile ? 72 : 76} ${W * 0.24},${H - 12} ${W * 0.52},${H - 12}" fill="${PALETTE.cobaltDeep}" />
      <rect x="16" y="${isMobile ? 104 : 44}" width="${W * 0.48}" height="12" fill="${PALETTE.paperLight}" />
      <rect x="16" y="${isMobile ? 120 : 62}" width="${W * 0.34}" height="4" fill="${PALETTE.gold}" />
      <rect x="16" y="${isMobile ? 134 : 80}" width="72" height="20" fill="${PALETTE.gold}" rx="2" />
    `;
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" class="arch-svg" role="img" aria-label="${archId} 在 ${device}px 视口下的首屏裁切示意">
      <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="#0B226E" stroke="#4D68C4" stroke-width="1.5" rx="3" />
      <rect x="1" y="1" width="${W - 2}" height="15" fill="#133194" rx="2" />
      ${body}
      <rect x="2" y="${foldY}" width="${W - 4}" height="${H - foldY - 2}" fill="rgba(4, 12, 42, 0.52)" />
      <line x1="2" y1="${foldY}" x2="${W - 2}" y2="${foldY}" stroke="${clipWarn ? PALETTE.failDark : PALETTE.gold}" stroke-width="2" stroke-dasharray="6 4" />
      <text x="${W - 8}" y="${foldY - 5}" text-anchor="end" fill="${clipWarn ? PALETTE.failDark : PALETTE.gold}" font-family="DM Mono, monospace" font-size="10">${clipWarn ? "矮屏贴近折线!" : "FOLD"}</text>
    </svg>`;
}

export function initArchetypeLab() {
  const devBtns = document.getElementById("arch-device-btns");
  const gridEl = document.getElementById("arch-grid");
  const noteEl = document.getElementById("arch-device-note");
  if (!devBtns || !gridEl) return;

  let device = "1440";

  const NOTES = {
    "1440": "桌面 1440×900：四种骨架都能轻松把主视觉、标题与按钮留在折线上；注意控高 76–86% 让下沿露出下一节。",
    "1280": "13 寸矮笔记本（去地址栏净高约 560–600px）：全出血剧场和居中宣言最容易把主按钮或产品图推到折线边缘，务必压缩顶栏和上边距。",
    "390": "手机竖屏 390×844：分栏必须纵向重排；优先把主视觉和标题放首屏上半部，按钮紧随其后，切忌把 4 行副标堆在按钮上面。",
  };

  function render() {
    devBtns.querySelectorAll("button[data-device]").forEach((b) => {
      const on = b.dataset.device === device;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (noteEl) noteEl.textContent = NOTES[device];

    gridEl.innerHTML = ARCHETYPE_CARDS.map(
      (c) => `
      <article class="arch-card">
        <div class="arch-card-head">
          <span class="arch-en">${c.en}</span>
          <h3>${c.name}</h3>
        </div>
        <div class="arch-preview">${archetypeSvg(c.id, device)}</div>
        <p class="arch-fit"><strong>最适配：</strong>${c.fit}</p>
        <p class="arch-desc">${c.pros}</p>
        <p class="arch-risk"><strong>易踩坑：</strong>${c.risk}</p>
      </article>`
    ).join("");
  }

  devBtns.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-device]");
    if (!b) return;
    device = b.dataset.device;
    render();
  });

  render();
}

// ---------- 04 节：叠字对比与首屏加载实验室 ----------
export function initScrimLab() {
  const methodWrap = document.getElementById("scrim-methods");
  const slider = document.getElementById("scrim-opacity");
  const opacityVal = document.getElementById("scrim-opacity-val");
  const scrimLayer = document.getElementById("scrim-preview-layer");
  const plateBox = document.getElementById("scrim-copy-box");
  const ratioHotEl = document.getElementById("scrim-ratio-hot");
  const levelEl = document.getElementById("scrim-level");
  const vividEl = document.getElementById("scrim-vivid");
  const codeEl = document.getElementById("scrim-code");
  if (!methodWrap || !slider || !scrimLayer) return;

  let method = "gradient";
  let opacity = 68;

  function render() {
    const res = evaluateScrimLab(method, opacity);
    methodWrap.querySelectorAll("button[data-scrim]").forEach((b) => {
      const on = b.dataset.scrim === method;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    slider.value = String(opacity);
    slider.disabled = method === "none" || method === "plate";
    opacityVal.textContent = method === "none" ? "0%（关闭）" : method === "plate" ? "100% 实底" : `${opacity}%`;

    // 应用真实视觉遮罩
    plateBox.classList.toggle("is-plate", method === "plate");
    if (method === "none" || method === "plate") {
      scrimLayer.style.background = "transparent";
    } else if (method === "full") {
      scrimLayer.style.background = `rgba(8, 29, 102, ${res.alpha.toFixed(2)})`;
    } else {
      const leftA = clamp(res.alpha * 1.12, 0, 0.92).toFixed(2);
      const midA = (res.alpha * 0.45).toFixed(2);
      scrimLayer.style.background = `linear-gradient(90deg, rgba(8, 29, 102, ${leftA}) 0%, rgba(8, 29, 102, ${midA}) 56%, rgba(8, 29, 102, 0.04) 100%)`;
    }

    ratioHotEl.textContent = `${res.ratioHotspot}:1`;
    ratioHotEl.dataset.ok = String(res.ok);
    levelEl.textContent = res.level;
    levelEl.dataset.ok = String(res.ok);
    vividEl.textContent = res.visualVividness;
    codeEl.textContent = res.cssCode;
  }

  methodWrap.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-scrim]");
    if (!b) return;
    method = b.dataset.scrim;
    render();
  });

  slider.addEventListener("input", () => {
    opacity = Number(slider.value);
    if (method === "none" || method === "plate") method = "gradient";
    render();
  });

  render();
}

// ---------- 05 节：什么时候别用主视觉（四类场景分诊） ----------
export function initAntiCaseLab() {
  const listEl = document.getElementById("anti-tabs");
  const titleEl = document.getElementById("anti-title");
  const verdictEl = document.getElementById("anti-verdict");
  const whyEl = document.getElementById("anti-why");
  const wasteBar = document.getElementById("anti-waste-bar");
  const goodBar = document.getElementById("anti-good-bar");
  const linksEl = document.getElementById("anti-links");
  if (!listEl) return;

  let active = ANTI_CASES[0].id;

  function render() {
    const item = ANTI_CASES.find((a) => a.id === active) || ANTI_CASES[0];
    listEl.innerHTML = ANTI_CASES.map(
      (a, idx) =>
        `<button type="button" class="anti-tab${a.id === active ? " is-active" : ""}" data-anti="${a.id}" aria-pressed="${a.id === active}">
          <span class="anti-idx">0${idx + 1}</span>
          <span class="anti-name">${a.title}</span>
        </button>`
    ).join("");

    titleEl.textContent = item.title;
    verdictEl.textContent = item.verdict;
    whyEl.textContent = item.why;
    wasteBar.style.width = `${item.heroWaste}%`;
    wasteBar.textContent = `硬塞 Hero 占 ${item.heroWaste}% 屏高`;
    goodBar.style.width = `${Math.max(24, item.betterShare)}%`;
    goodBar.textContent = item.id === "falsefloor" ? `控高 ${item.betterShare}% · 露下沿` : `页头压缩至 ${item.betterShare}%`;

    const linkHtml = item.links
      .map((l) => `<a href="https://layout.xiaoxiaodong.ai/${l.id}/play/" target="_blank" rel="noopener">${l.name}</a>`)
      .join("、");
    linksEl.innerHTML = `${item.altText}${linkHtml}。`;
  }

  listEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-anti]");
    if (!b) return;
    active = b.dataset.anti;
    render();
  });

  render();
}

// ---------- 06 节：小练习（严格中性标签，只差一个变量） ----------
function quizCardSvg(opt) {
  const foldY = 128;
  const visW = opt.ctaBelowFold ? 132 : 122;
  const visH = opt.ctaBelowFold ? 124 : 92;
  const ctaY = opt.ctaBelowFold ? 138 : 96;

  const headlineSvg =
    opt.id === "D"
      ? `<rect x="14" y="28" width="114" height="8" fill="${PALETTE.ink}" />
         <rect x="14" y="40" width="106" height="8" fill="${PALETTE.ink}" />
         <rect x="14" y="54" width="112" height="5" fill="${PALETTE.inkSoft}" />
         <rect x="14" y="63" width="104" height="5" fill="${PALETTE.inkSoft}" />
         <rect x="14" y="72" width="110" height="5" fill="${PALETTE.inkSoft}" />
         <rect x="14" y="81" width="90" height="5" fill="${PALETTE.inkSoft}" />`
      : `<rect x="14" y="30" width="108" height="10" fill="${PALETTE.ink}" />
         <rect x="14" y="44" width="84" height="10" fill="${PALETTE.ink}" />
         <rect x="14" y="58" width="56" height="3" fill="${PALETTE.goldRule}" />
         <rect x="14" y="68" width="106" height="5" fill="${PALETTE.inkSoft}" />
         <rect x="14" y="77" width="88" height="5" fill="${PALETTE.inkSoft}" />`;

  const ctaSvg =
    opt.ctas.length > 1
      ? opt.ctas
          .map((_, i) => {
            const bx = 14 + (i % 2) * 58;
            const by = 92 + Math.floor(i / 2) * 18;
            return `<rect x="${bx}" y="${by}" width="53" height="14" rx="2" fill="${PALETTE.cobalt}" />`;
          })
          .join("")
      : `<rect x="14" y="${ctaY}" width="66" height="18" rx="2" fill="${PALETTE.cobalt}" />
         <rect x="86" y="${ctaY + 6}" width="36" height="5" fill="${PALETTE.cobaltLine}" />`;

  return `
    <svg viewBox="0 0 280 166" class="quiz-svg" role="img" aria-label="${opt.label} 首屏结构示意图">
      <rect x="1" y="1" width="278" height="164" fill="${PALETTE.paper}" stroke="${PALETTE.cobalt}" stroke-width="1.5" rx="3" />
      <rect x="1" y="1" width="278" height="16" fill="${PALETTE.paperSand}" />
      <circle cx="12" cy="9" r="3" fill="${PALETTE.cobalt}" />
      <circle cx="22" cy="9" r="3" fill="${PALETTE.gold}" />
      <circle cx="32" cy="9" r="3" fill="${PALETTE.ink}" />
      ${headlineSvg}
      ${ctaSvg}
      <rect x="${266 - visW}" y="24" width="${visW}" height="${visH}" fill="${PALETTE.cobalt}" rx="2" />
      <circle cx="${266 - visW * 0.48}" cy="${24 + visH * 0.48}" r="${opt.ctaBelowFold ? 30 : 25}" fill="${PALETTE.gold}" />
      <rect x="2" y="${foldY}" width="276" height="${164 - foldY}" fill="rgba(8, 29, 102, 0.14)" />
      <line x1="2" y1="${foldY}" x2="278" y2="${foldY}" stroke="${PALETTE.cobalt}" stroke-width="1.8" stroke-dasharray="5 4" />
      <rect x="218" y="${foldY - 16}" width="56" height="14" rx="2" fill="${PALETTE.paperLight}" stroke="${PALETTE.cobalt}" stroke-width="0.8" />
      <text x="246" y="${foldY - 6}" text-anchor="middle" fill="${PALETTE.cobalt}" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="9">首屏折线</text>
      <rect x="14" y="144" width="90" height="6" fill="rgba(12, 50, 171, 0.25)" />
    </svg>`;
}

export function initQuizLab() {
  const gridEl = document.getElementById("quiz-grid");
  const resultEl = document.getElementById("quiz-result");
  const resetBtn = document.getElementById("quiz-reset");
  if (!gridEl || !resultEl) return;

  let picked = null;

  function render() {
    gridEl.innerHTML = QUIZ_OPTIONS.map((opt) => {
      const isPicked = picked === opt.id;
      const cls = isPicked ? (opt.correct ? " is-correct" : " is-wrong") : "";
      return `
        <button type="button" class="quiz-card${cls}" data-quiz="${opt.id}" aria-pressed="${isPicked}">
          <span class="quiz-top">
            <span class="quiz-id">${opt.label}</span>
            <span class="quiz-meta">桌面 1280×720 草案</span>
          </span>
          <span class="quiz-wire">${quizCardSvg(opt)}</span>
          <span class="quiz-copy">
            <strong>${opt.headline}</strong>
            <span>${opt.sub}</span>
          </span>
          <span class="quiz-cta-row">
            ${opt.ctas.map((c) => `<span class="quiz-pill">${c}</span>`).join("")}
          </span>
        </button>`;
    }).join("");

    if (!picked) {
      resultEl.className = "quiz-result";
      resultEl.textContent = "先仔细对比四套方案的标题、按钮数量与首屏折线位置，点选你认为最稳的一套。";
      resetBtn.hidden = true;
    } else {
      const opt = QUIZ_OPTIONS.find((o) => o.id === picked);
      resultEl.className = `quiz-result ${opt.correct ? "is-pass" : "is-fail"}`;
      resultEl.textContent = `${opt.label}：${opt.feedback}`;
      resetBtn.hidden = false;
    }
  }

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-quiz]");
    if (!btn) return;
    picked = btn.dataset.quiz;
    render();
  });

  resetBtn?.addEventListener("click", () => {
    picked = null;
    render();
  });

  render();
}

// ---------- 07 节：原海报放大、拖动、Esc 关闭灯箱 ----------
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-zoom-btn");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const zoomResetBtn = document.getElementById("lightbox-zoom-reset");
  const zoomLabel = document.getElementById("lightbox-scale");
  const stage = document.getElementById("lightbox-stage");
  if (!poster || !dialog || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function openLightbox() {
    // 复用页面已内联的 poster.src，绝不重复内联图片
    if (lbImg.src !== poster.src) lbImg.src = poster.src;
    resetView();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    closeBtn?.focus();
  }

  function closeLightbox() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  poster.addEventListener("click", openLightbox);
  openBtn?.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.hasAttribute("open")) closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(Number((scale + 0.35).toFixed(2)), 1, 3);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(Number((scale - 0.35).toFixed(2)), 1, 3);
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", resetView);

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      scale = clamp(Number((scale + delta).toFixed(2)), 1, 3);
      if (scale === 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
}
