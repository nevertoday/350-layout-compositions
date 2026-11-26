// 177 右对齐 左参差 — 正文 01–07 节交互模块（每节控件独立不重样）

import { clamp, fallbackMeasure } from "./model.js";

// ---------- 01 节：左右拉幕回扫对比仪 ----------
function initSection01() {
  const wrap = document.getElementById("s01-compare");
  if (!wrap) return;

  const svg = document.getElementById("s01-svg");
  const splitInput = document.getElementById("s01-split");
  const tierBtns = [...wrap.querySelectorAll("[data-s01-tier]")];
  const readoutLeft = document.getElementById("s01-left-read");
  const readoutRight = document.getElementById("s01-right-read");
  const readoutVerdict = document.getElementById("s01-verdict");

  const TIERS = {
    3: {
      label: "3 行短签",
      lines: [
        "将文本的右侧边缘对齐，",
        "左侧自然形成参差变化，",
        "营造稳定有力的节奏。",
      ],
      note: "仅 3 行短句：右对齐只有 2 次回扫，眼睛靠余光即可锁住左缘，秩序与张力完全压过微小寻行成本。",
    },
    6: {
      label: "6 行中段",
      lines: [
        "将文本的右侧边缘对齐，",
        "左侧自然形成参差变化，",
        "营造稳定有力的视觉节奏，",
        "增强秩序与动感。",
        "到了第五、第六行附近，",
        "左缘起笔跳动已经明显被察觉。",
      ],
      note: "6 行临界区：左缘起笔跨幅拉开，已接近短诗与展墙导语的舒适上限，再加长就会拖慢连续阅读。",
    },
    11: {
      label: "11 行长文",
      lines: [
        "将文本的右侧边缘对齐，",
        "左侧自然形成参差变化，",
        "营造稳定有力的视觉节奏，",
        "增强版面的秩序与动感。",
        "但在拉丁与横排中文长文中，",
        "眼睛读完行尾往回扫视时，",
        "依赖一条固定左起线落脚。",
        "一旦左侧起笔每行忽前忽后，",
        "回扫就会频频落偏再微调，",
        "读者极易看串或重读上一行，",
        "越往后读越吃力。",
      ],
      note: "11 行长段落：左对齐的 10 次回扫全部落在同一条垂直起线上（离散 0px）；右对齐每次回扫都要重新测距，阅读流畅度明显受损。",
    },
  };

  let tier = 6;
  let split = 52; // %

  function render() {
    const data = TIERS[tier];
    const W = 760;
    const padX = 28;
    const fontSize = tier === 11 ? 15 : 18;
    const lineH = tier === 11 ? 26 : 34;
    const topY = 56;
    const H = topY + data.lines.length * lineH + 46;
    const splitX = Math.round((W * split) / 100);
    const colW = W - padX * 2;

    // 真实估算每行像素宽，推算左起离散度
    const widths = data.lines.map((t) => Math.min(colW - 24, fallbackMeasure(t, fontSize) * 1.04));
    const maxW = Math.max(...widths);
    const minW = Math.min(...widths);
    const rightStarts = widths.map((w) => W - padX - w);
    const startSpan = Math.round(maxW - minW);
    let jumpTotal = 0;
    for (let i = 1; i < rightStarts.length; i++) {
      jumpTotal += Math.abs(rightStarts[i] - rightStarts[i - 1]);
    }
    const avgJump = Math.round(jumpTotal / Math.max(1, rightStarts.length - 1));

    const leftLinesMarkup = data.lines
      .map((txt, i) => {
        const y = topY + i * lineH;
        const w = widths[i];
        const nextY = topY + (i + 1) * lineH;
        const sweep =
          i < data.lines.length - 1
            ? `<path d="M ${padX + w} ${y - 4} Q ${padX + w * 0.5} ${(y + nextY) * 0.5 + 3} ${padX} ${nextY - 4}" fill="none" stroke="#185E40" stroke-width="1.15" stroke-dasharray="3 3" opacity="0.55"/>`
            : "";
        return `
          ${sweep}
          <circle cx="${padX - 6}" cy="${y - 5}" r="2.8" fill="#185E40"/>
          <text x="${padX}" y="${y}" font-size="${fontSize}" fill="#010F28" font-family="'Noto Sans SC','IBM Plex Sans',sans-serif" font-weight="500">${txt}</text>
        `;
      })
      .join("");

    const rightLinesMarkup = data.lines
      .map((txt, i) => {
        const y = topY + i * lineH;
        const xStart = rightStarts[i];
        const nextStart = rightStarts[i + 1];
        const nextY = topY + (i + 1) * lineH;
        const rough = i >= 5;
        const sweepColor = rough ? "#FF6B5B" : "#C5E224";
        const sweep =
          i < data.lines.length - 1
            ? `<path d="M ${W - padX} ${y - 4} Q ${(W - padX + nextStart) * 0.5} ${(y + nextY) * 0.5 + (rough ? 9 : 4)} ${nextStart} ${nextY - 4}" fill="none" stroke="${sweepColor}" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.82"/>`
            : "";
        return `
          ${sweep}
          <circle cx="${xStart - 6}" cy="${y - 5}" r="${rough ? 3.5 : 2.8}" fill="${sweepColor}"/>
          <text x="${W - padX}" y="${y}" text-anchor="end" font-size="${fontSize}" fill="#F2EDE1" font-family="'Noto Sans SC','IBM Plex Sans',sans-serif" font-weight="500">${txt}</text>
        `;
      })
      .join("");

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <defs>
        <clipPath id="s01-clip-l"><rect x="0" y="0" width="${splitX}" height="${H}"/></clipPath>
        <clipPath id="s01-clip-r"><rect x="${splitX}" y="0" width="${W - splitX}" height="${H}"/></clipPath>
      </defs>

      <!-- 左侧：左对齐对照层（暖象牙纸底） -->
      <g clip-path="url(#s01-clip-l)">
        <rect x="0" y="0" width="${W}" height="${H}" fill="#F6F2E8"/>
        <line x1="${padX - 6}" y1="26" x2="${padX - 6}" y2="${H - 18}" stroke="#185E40" stroke-width="2"/>
        <text x="${padX}" y="24" font-size="11" fill="#185E40" font-family="'Space Mono','Noto Sans SC',monospace" font-weight="700">FLUSH LEFT · 固定左起线（离散 0px）</text>
        ${leftLinesMarkup}
      </g>

      <!-- 右侧：右对齐对照层（深海蓝底） -->
      <g clip-path="url(#s01-clip-r)">
        <rect x="0" y="0" width="${W}" height="${H}" fill="#010F28"/>
        <line x1="${W - padX + 6}" y1="26" x2="${W - padX + 6}" y2="${H - 18}" stroke="#C5E224" stroke-width="2.5"/>
        <text x="${W - padX}" y="24" text-anchor="end" font-size="11" fill="#C5E224" font-family="'Space Mono','Noto Sans SC',monospace" font-weight="700">FLUSH RIGHT · 固定右终线 / 参差左起（跨幅 ${startSpan}px）</text>
        ${rightLinesMarkup}
      </g>

      <!-- 可拖动中央分屏幕布线 -->
      <line x1="${splitX}" y1="0" x2="${splitX}" y2="${H}" stroke="#C5E224" stroke-width="2.5"/>
      <rect x="${splitX - 18}" y="${Math.round(H * 0.5 - 14)}" width="36" height="28" fill="#C5E224" stroke="#010F28" stroke-width="2"/>
      <text x="${splitX}" y="${Math.round(H * 0.5 + 4)}" text-anchor="middle" font-size="12" fill="#010F28" font-family="'Space Mono',monospace" font-weight="700">↔</text>
    `;

    readoutLeft.textContent = `左起落点离散：0px（${data.lines.length - 1} 次回扫同轴）`;
    readoutRight.textContent = `左起落点跨幅：${startSpan}px · 均值跳动 ${avgJump}px（示意）`;
    readoutVerdict.textContent = data.note;

    tierBtns.forEach((b) => {
      const active = Number(b.dataset.s01Tier) === tier;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  tierBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tier = Number(btn.dataset.s01Tier);
      render();
    });
  });

  splitInput.addEventListener("input", () => {
    split = clamp(Number(splitInput.value), 12, 88);
    render();
  });

  // 直接在 SVG 上横拖分屏线
  let dragging = false;
  function updateFromClientX(clientX) {
    const r = svg.getBoundingClientRect();
    if (r.width <= 0) return;
    split = clamp(Math.round(((clientX - r.left) / r.width) * 100), 12, 88);
    splitInput.value = String(split);
    render();
  }
  svg.addEventListener("pointerdown", (e) => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  });
  svg.addEventListener("pointerup", () => { dragging = false; });
  svg.addEventListener("pointercancel", () => { dragging = false; });

  render();
}

// ---------- 02 节：画册图注左右贴缝实验台 ----------
function initSection02() {
  const root = document.getElementById("s02-seam");
  if (!root) return;

  const board = document.getElementById("s02-board");
  const posBtns = [...root.querySelectorAll("[data-s02-pos]")];
  const alignBtns = [...root.querySelectorAll("[data-s02-align]")];
  const badge = document.getElementById("s02-badge");
  const verdict = document.getElementById("s02-verdict");

  let pos = "caption-left"; // "caption-left" | "caption-right" | "spread"
  let align = "left"; // 开场先停在反例：图在右、注在左却用了左对齐，裂出锯齿空隙

  function render() {
    posBtns.forEach((b) => {
      const on = b.dataset.s02Pos === pos;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    alignBtns.forEach((b) => {
      const on = b.dataset.s02Align === align;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const isGood =
      (pos === "caption-left" && align === "right") ||
      (pos === "caption-right" && align === "left") ||
      (pos === "spread" && align === "right");

    board.dataset.pos = pos;
    board.dataset.align = align;
    board.dataset.state = isGood ? "good" : "bad";

    if (pos === "caption-left") {
      if (align === "right") {
        badge.textContent = "严丝咬合 · 缝宽稳定 16px";
        badge.className = "seam-badge is-ok";
        verdict.textContent = "注签位于图片左侧时，采用「右对齐」让齐平的右终线紧抱图片左边界，图文归属一眼确立；左侧自然参差舒展向空白页边。";
      } else if (align === "left") {
        badge.textContent = "参差裂口 · 缝隙忽宽忽窄";
        badge.className = "seam-badge is-bad";
        verdict.textContent = "注签在图片左侧却用了左对齐：文字全往左边页缘逃，面向图片的一侧参差不齐，注签与摄影作品之间裂出一道松垮空沟。";
      } else {
        badge.textContent = "两头虚浮 · 失去中缝";
        badge.className = "seam-badge is-bad";
        verdict.textContent = "居中排版把左右两侧同时拆成参差锯齿，既贴不住右侧图边，也靠不稳左侧页边，在网格里显得飘浮。";
      }
    } else if (pos === "caption-right") {
      if (align === "left") {
        badge.textContent = "换边反转 · 左齐才咬缝";
        badge.className = "seam-badge is-ok";
        verdict.textContent = "关键辨析：当注签挪到图片右侧时，应立刻改回「左对齐」贴住图片右缘！右对齐不是到处硬套的风格滤镜，它永远服务于文字与邻接边界的方位关系。";
      } else if (align === "right") {
        badge.textContent = "反客为主 · 注签逃离画面";
        badge.className = "seam-badge is-bad";
        verdict.textContent = "图片在左、注签在右，这时还坚持右对齐会把文字甩向遥远的右页边，面向图片的一侧反而留下锯齿裂口——说明用错边了。";
      } else {
        badge.textContent = "居中浮空 · 脱离图缘";
        badge.className = "seam-badge is-bad";
        verdict.textContent = "居中同样无法和左侧图片右边界形成干脆的竖向中缝。";
      }
    } else {
      // 双页对开：双数页左侧边注（右齐）对望单数页右侧边注（左齐）
      if (align === "right") {
        badge.textContent = "布林赫斯特双页对称解";
        badge.className = "seam-badge is-ok";
        verdict.textContent = "正如罗伯特·布林赫斯特在《字体排印风格要素》里的示范：双数页外侧边注用右对齐贴向内栏正文，单数页外侧边注用左对齐贴向内栏正文，整跨页形成镜像咬合。";
      } else if (align === "left") {
        badge.textContent = "双数页边注失咬合";
        badge.className = "seam-badge is-bad";
        verdict.textContent = "双数页左侧边注若一律用左对齐，短行注脚就会离主栏越来越远，翻开跨页时左右两页的边缘重量失衡。";
      } else {
        badge.textContent = "双页边注失锚";
        badge.className = "seam-badge is-bad";
        verdict.textContent = "双页窄边注改居中后，外缘与内缝两边都不整齐，信息层级变得模糊。";
      }
    }
  }

  posBtns.forEach((b) => b.addEventListener("click", () => { pos = b.dataset.s02Pos; render(); }));
  alignBtns.forEach((b) => b.addEventListener("click", () => { align = b.dataset.s02Align; render(); }));
  render();
}

// ---------- 03 节：财报表列位值扫描仪 ----------
function initSection03() {
  const root = document.getElementById("s03-ledger");
  if (!root) return;

  const table = document.getElementById("s03-table");
  const alignBtns = [...root.querySelectorAll("[data-s03-align]")];
  const numBtns = [...root.querySelectorAll("[data-s03-num]")];
  const decBtns = [...root.querySelectorAll("[data-s03-dec]")];
  const rulerToggle = document.getElementById("s03-ruler");
  const statusEl = document.getElementById("s03-status");
  const noteEl = document.getElementById("s03-note");

  const ROWS = [
    { item: "企业级云服务订阅", q3Fixed: "1,284,500.00", q3Mix: "1,284,500", q4Fixed: "1,491,180.00", q4Mix: "1,491,180", delta: "+16.1%" },
    { item: "工业视觉授权许可", q3Fixed: "89,420.50", q3Mix: "89,420.5", q4Fixed: "112,840.25", q4Mix: "112,840.25", delta: "+26.2%" },
    { item: "离线排版工具包", q3Fixed: "12,400.00", q3Mix: "12,400", q4Fixed: "18,111.00", q4Mix: "18,111", delta: "+46.1%" },
    { item: "定制字库与咨询", q3Fixed: "3,411.85", q3Mix: "3,411.85", q4Fixed: "8,988.40", q4Mix: "8,988.4", delta: "+163.4%" },
    { item: "单本印刷样册", q3Fixed: "980.00", q3Mix: "980", q4Fixed: "1,111.10", q4Mix: "1,111.1", delta: "+13.4%" },
  ];

  // 开场先停在常见错态：左对齐 + 比例数字 + 省略尾零，让用户一键点出位值对齐的惊人差距
  let align = "left";
  let numMode = "pnum";
  let decMode = "mixed";
  let showRuler = true;

  const tbody = table.querySelector("tbody");

  function render() {
    alignBtns.forEach((b) => {
      const on = b.dataset.s03Align === align;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    numBtns.forEach((b) => {
      const on = b.dataset.s03Num === numMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    decBtns.forEach((b) => {
      const on = b.dataset.s03Dec === decMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    rulerToggle.classList.toggle("is-active", showRuler);
    rulerToggle.setAttribute("aria-pressed", String(showRuler));
    rulerToggle.textContent = showRuler ? "位值准线：开" : "位值准线：关";

    table.dataset.align = align;
    table.dataset.num = numMode;
    table.dataset.ruler = showRuler ? "on" : "off";

    tbody.innerHTML = ROWS.map(
      (r) => `
      <tr>
        <td class="col-name">${r.item}</td>
        <td class="col-num">${decMode === "fixed" ? r.q3Fixed : r.q3Mix}</td>
        <td class="col-num">${decMode === "fixed" ? r.q4Fixed : r.q4Mix}</td>
        <td class="col-num col-delta">${r.delta}</td>
      </tr>`
    ).join("");

    const allRight = align === "right" && numMode === "tnum" && decMode === "fixed";
    if (allRight) {
      statusEl.textContent = "位值垂直贯通 · 扫一眼即辨量级";
      statusEl.className = "ledger-status is-ok";
      noteEl.textContent = "右对齐 + 等宽数字（tabular-nums）+ 统一两位小数：所有小数点、个位、千位严丝合缝排成垂线，眼睛无需逐字读出「一百四十九万」还是「一万八」，仅凭左侧阶梯长度就能一秒判出数量级。";
    } else if (align !== "right") {
      statusEl.textContent = align === "left" ? "左对齐错位 · 980 与 1,284,500 混在同列" : "居中错位 · 小数点左右飘移";
      statusEl.className = "ledger-status is-bad";
      noteEl.textContent = "数字量级是从右往左进位的。左对齐或居中会把百位的「9」和百万位的「1」压在同一列，读者必须逐行把数字在心里念出来才能比大小。";
    } else if (decMode !== "fixed") {
      statusEl.textContent = "省略尾零 · 小数点与个位错行";
      statusEl.className = "ledger-status is-bad";
      noteEl.textContent = "虽然切到了右对齐，但「89,420.5」和「1,284,500」小数位不一致，导致整数的个位和角分位挤进同一竖列，扫读时极易看差十倍或百倍。";
    } else {
      statusEl.textContent = "比例数字抖动 · 1 比 8 窄，垂线微歪";
      statusEl.className = "ledger-status is-bad";
      noteEl.textContent = "右侧末位虽然对齐了，但比例数字（pnum）里「1,111.10」比「8,988.40」明显瘦一截，小数点与千分位逗号在竖向上参差晃动；切到等宽数字（tnum）立刻垂直锁死。";
    }
  }

  alignBtns.forEach((b) => b.addEventListener("click", () => { align = b.dataset.s03Align; render(); }));
  numBtns.forEach((b) => b.addEventListener("click", () => { numMode = b.dataset.s03Num; render(); }));
  decBtns.forEach((b) => b.addEventListener("click", () => { decMode = b.dataset.s03Dec; render(); }));
  rulerToggle.addEventListener("click", () => { showRuler = !showRuler; render(); });

  render();
}

// ---------- 04 节：百年右轴流变标本切页器 ----------
function initSection04() {
  const root = document.getElementById("s04-history");
  if (!root) return;

  const tabs = [...root.querySelectorAll("[data-s04-era]")];
  const plate = document.getElementById("s04-plate");
  const eraTitle = document.getElementById("s04-era-title");
  const eraMeta = document.getElementById("s04-era-meta");
  const eraBody = document.getElementById("s04-era-body");

  const ERAS = {
    rtl: {
      title: "书写方向决定谁是「自然起线」",
      meta: "RTL 书写体系（阿拉伯文 / 希伯来文） · 对比参照",
      body: "右对齐并不天生反人类。在阿拉伯语、希伯来语等自右向左书写的体系中，右侧才是每行的起笔锚点，「右对齐左参差」反而是最顺畅的长正文排法。罗伯特·布林赫斯特借此提醒设计师：对齐优劣取决于阅读起笔方向与眼动回扫路径，而非抽象教条。",
      svg: `
        <svg viewBox="0 0 320 200" aria-hidden="true">
          <rect x="12" y="12" width="296" height="176" fill="#081A3A" stroke="rgba(197,226,36,0.35)"/>
          <line x1="280" y1="28" x2="280" y2="172" stroke="#C5E224" stroke-width="2.5"/>
          <text x="272" y="42" text-anchor="end" fill="#C5E224" font-size="10" font-family="'Space Mono',monospace">RTL START EDGE ←</text>
          <rect x="82" y="56" width="190" height="10" fill="#F2EDE1" opacity="0.9"/>
          <rect x="116" y="76" width="156" height="10" fill="#F2EDE1" opacity="0.82"/>
          <rect x="64" y="96" width="208" height="10" fill="#F2EDE1" opacity="0.9"/>
          <rect x="132" y="116" width="140" height="10" fill="#F2EDE1" opacity="0.78"/>
          <rect x="96" y="136" width="176" height="10" fill="#F2EDE1" opacity="0.85"/>
          <path d="M 96 156 L 266 156" stroke="#C5E224" stroke-width="1.4" stroke-dasharray="4 4"/>
          <polygon points="90,156 100,151 100,161" fill="#C5E224"/>
          <text x="272" y="172" text-anchor="end" fill="rgba(242,237,225,0.75)" font-size="10" font-family="'Noto Sans SC',sans-serif">自右向左阅读时，右终线即起笔线</text>
        </svg>`,
    },
    1928: {
      title: "打破居中对称：不对称排印登场",
      meta: "Jan Tschichold · 《Die neue Typographie》（柏林，1928）",
      body: "1928 年，扬·奇肖尔德在柏林出版《新字体排印学》，系统批判了自文艺复兴以来统治书籍与海报的轴对称居中排版，主张以功能层级、不对称配重和主动留白来组织信息。这一转向解放了文字边缘——文字不再被锁在居中盒子里，开始能按构图张力灵活吸附到左侧或右侧结构线上。",
      svg: `
        <svg viewBox="0 0 320 200" aria-hidden="true">
          <rect x="12" y="12" width="296" height="176" fill="#F2EDE1"/>
          <rect x="26" y="26" width="84" height="148" fill="#010F28"/>
          <circle cx="68" cy="116" r="24" fill="#C5E224"/>
          <line x1="292" y1="26" x2="292" y2="174" stroke="#010F28" stroke-width="2"/>
          <rect x="150" y="34" width="134" height="16" fill="#010F28"/>
          <rect x="186" y="58" width="98" height="16" fill="#010F28"/>
          <rect x="142" y="96" width="142" height="6" fill="#3D4B63"/>
          <rect x="176" y="110" width="108" height="6" fill="#3D4B63"/>
          <rect x="160" y="124" width="124" height="6" fill="#3D4B63"/>
          <text x="284" y="164" text-anchor="end" fill="#010F28" font-size="10" font-family="'Space Mono',monospace" font-weight="700">1928 · ASYMMETRIC TENSION</text>
        </svg>`,
    },
    1967: {
      title: "瑞士网格：把参差边缘做成造型",
      meta: "Emil Ruder · 《Typographie》（1967）与国际主义网格",
      body: "在 1950–60 年代的瑞士国际主义排版中，埃米尔·鲁德与约瑟夫·穆勒-布罗克曼将文字块视为严格的网格部件：长正文优先左对齐右参差以保均质词距，而在海报、展签、年表与目录里，右对齐被用来死死扣住栏线与视觉几何体，用精准的右终线制造建筑般的冷峻张力。",
      svg: `
        <svg viewBox="0 0 320 200" aria-hidden="true">
          <rect x="12" y="12" width="296" height="176" fill="#061530"/>
          <g stroke="rgba(197,226,36,0.22)" stroke-width="1">
            <line x1="86" y1="12" x2="86" y2="188"/>
            <line x1="160" y1="12" x2="160" y2="188"/>
            <line x1="234" y1="12" x2="234" y2="188"/>
            <line x1="12" y1="68" x2="308" y2="68"/>
            <line x1="12" y1="128" x2="308" y2="128"/>
          </g>
          <line x1="234" y1="22" x2="234" y2="176" stroke="#C5E224" stroke-width="2.5"/>
          <rect x="120" y="34" width="106" height="8" fill="#F2EDE1"/>
          <rect x="148" y="48" width="78" height="8" fill="#F2EDE1"/>
          <rect x="104" y="82" width="122" height="7" fill="#C5E224"/>
          <rect x="138" y="96" width="88" height="7" fill="#F2EDE1" opacity="0.85"/>
          <rect x="116" y="110" width="110" height="7" fill="#F2EDE1" opacity="0.85"/>
          <rect x="244" y="68" width="52" height="60" fill="#C5E224" opacity="0.88"/>
          <text x="226" y="164" text-anchor="end" fill="#C5E224" font-size="10" font-family="'Space Mono',monospace">1967 · GRID DOCKING</text>
        </svg>`,
    },
    1992: {
      title: "当代共识：短句、双数页边注与等宽数值",
      meta: "Bringhurst (1992) · Lupton (2004) · W3C CSS 规范",
      body: "罗伯特·布林赫斯特（1992）明确指出左参差强调行尾而非行首，不宜用于拉丁长正文，但极其适合双数页（verso）页眉与左侧边注；艾伦·勒普顿（2004）强调其与左齐双栏对缝时的锐利结构感；到了网页与数据界面，CSS 将 text-align: right 与 font-variant-numeric: tabular-nums 确立为金融与数据表列的通用规范。",
      svg: `
        <svg viewBox="0 0 320 200" aria-hidden="true">
          <rect x="12" y="12" width="296" height="176" fill="#081A3A" stroke="rgba(242,237,225,0.2)"/>
          <line x1="160" y1="12" x2="160" y2="188" stroke="rgba(242,237,225,0.35)" stroke-dasharray="3 3"/>
          <!-- 左页：左侧边注右对齐贴向主栏 -->
          <rect x="64" y="34" width="84" height="132" fill="rgba(242,237,225,0.08)"/>
          <line x1="58" y1="42" x2="58" y2="92" stroke="#C5E224" stroke-width="2"/>
          <rect x="24" y="46" width="30" height="5" fill="#C5E224"/>
          <rect x="32" y="56" width="22" height="5" fill="#F2EDE1"/>
          <rect x="20" y="66" width="34" height="5" fill="#F2EDE1"/>
          <!-- 右页：右侧边注左对齐贴向主栏 -->
          <rect x="172" y="34" width="84" height="132" fill="rgba(242,237,225,0.08)"/>
          <line x1="262" y1="42" x2="262" y2="92" stroke="#C5E224" stroke-width="2"/>
          <rect x="266" y="46" width="30" height="5" fill="#C5E224"/>
          <rect x="266" y="56" width="24" height="5" fill="#F2EDE1"/>
          <rect x="266" y="66" width="32" height="5" fill="#F2EDE1"/>
          <text x="160" y="178" text-anchor="middle" fill="#C5E224" font-size="10" font-family="'Space Mono',monospace">VERSO FLUSH-RIGHT | RECTO FLUSH-LEFT</text>
        </svg>`,
    },
  };

  function render(key) {
    const item = ERAS[key] || ERAS.rtl;
    tabs.forEach((b) => {
      const on = b.dataset.s04Era === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    plate.innerHTML = item.svg;
    eraTitle.textContent = item.title;
    eraMeta.textContent = item.meta;
    eraBody.textContent = item.body;
  }

  tabs.forEach((b) => b.addEventListener("click", () => render(b.dataset.s04Era)));
  render("rtl");
}

// ---------- 05 节：四联反例「一键解剖 / 修复」对照卡 ----------
function initSection05() {
  const cards = [...document.querySelectorAll("[data-antipattern]")];
  cards.forEach((card) => {
    const btn = card.querySelector("[data-fix-toggle]");
    const badge = card.querySelector("[data-fix-badge]");
    const cap = card.querySelector("[data-fix-cap]");
    if (!btn) return;
    let fixed = false;
    const badText = card.dataset.badCap;
    const goodText = card.dataset.goodCap;
    const badBadge = card.dataset.badBadge;
    const goodBadge = card.dataset.goodBadge;

    function sync() {
      card.classList.toggle("is-fixed", fixed);
      btn.setAttribute("aria-pressed", String(fixed));
      btn.textContent = fixed ? "还原反例" : "一键修复";
      badge.textContent = fixed ? goodBadge : badBadge;
      cap.textContent = fixed ? goodText : badText;
    }

    btn.addEventListener("click", () => {
      fixed = !fixed;
      sync();
    });
    sync();
  });
}

// ---------- 06 节：中性 A/B/C/D 单变量活体小样小练习 ----------
function initSection06() {
  const root = document.getElementById("s06-quiz");
  if (!root) return;

  const btns = [...root.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("s06-feedback");
  const fbTitle = document.getElementById("s06-fb-title");
  const fbBody = document.getElementById("s06-fb-body");
  const resetBtn = document.getElementById("s06-reset");

  const EXPLAIN = {
    A: {
      ok: true,
      title: "答对了 · 方案 A（沿右侧图缝对齐）最稳妥",
      body: "边注处在摄影图的正左侧，采用右对齐左参差后，齐平的右终线与摄影图左缘构成一条干脆的 12px 视觉中缝，读者一眼就能把注签和作品绑定起来；同时 4 行短句回扫次数只有 3 次，几乎不增加阅读负担。",
    },
    B: {
      ok: false,
      title: "再看一眼图缝 · 方案 B（沿左侧页边对齐）把图文扯远了",
      body: "四个方案里栏宽与字号完全一致，但方案 B 把文字推向外侧左页边，参差不齐的右缘直接对着摄影图，注签和作品之间裂开一道高低不平的空白沟，归属关系变弱。",
    },
    C: {
      ok: false,
      title: "两边都失锚 · 方案 C（居中对齐）在窄栏里漂浮",
      body: "居中让左右两侧同时出现锯齿参差，既没有咬住右侧摄影图边界，也没有贴稳左侧页边，在精致的画册网格里显得缺乏落点。",
    },
    D: {
      ok: false,
      title: "灰块被撕裂 · 方案 D（两端对齐）在窄边栏生出白缝",
      body: "强行拉满窄边栏的两侧会让字词间距被迫拉宽，行内出现刺眼的白色空洞，为了虚假的外框整齐牺牲了最基本的文字节奏。",
    },
  };

  function pick(opt) {
    const info = EXPLAIN[opt];
    btns.forEach((b) => {
      const k = b.dataset.quizOpt;
      b.classList.remove("is-picked", "is-correct", "is-wrong");
      if (k === opt) {
        b.classList.add("is-picked", info.ok ? "is-correct" : "is-wrong");
        b.setAttribute("aria-pressed", "true");
      } else {
        b.setAttribute("aria-pressed", "false");
      }
      if (!info.ok && k === "A") {
        b.classList.add("is-hint");
      } else {
        b.classList.remove("is-hint");
      }
    });
    feedback.hidden = false;
    feedback.dataset.ok = String(info.ok);
    fbTitle.textContent = info.title;
    fbBody.textContent = info.body;
  }

  btns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.quizOpt)));

  resetBtn.addEventListener("click", () => {
    btns.forEach((b) => {
      b.classList.remove("is-picked", "is-correct", "is-wrong", "is-hint");
      b.setAttribute("aria-pressed", "false");
    });
    feedback.hidden = true;
  });
}

// ---------- 07 节：原海报可放大 / 可拖动 / Esc 关闭灯箱 ----------
function initSection07Poster() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const stage = document.getElementById("poster-modal-stage");
  const zoomImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const zoomLabel = document.getElementById("poster-zoom-label");

  if (!trigger || !posterImg || !modal || !zoomImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    zoomImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = clamp(Number((scale + 0.35).toFixed(2)), 1, 3.1);
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = clamp(Number((scale - 0.35).toFixed(2)), 1, 3.1);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      scale = clamp(Number((scale + delta).toFixed(2)), 1, 3.1);
      if (scale === 1) { tx = 0; ty = 0; }
      applyTransform();
    },
    { passive: false }
  );

  zoomImg.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    zoomImg.setPointerCapture(e.pointerId);
  });
  zoomImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = clamp(stx + (e.clientX - sx), -420, 420);
    ty = clamp(sty + (e.clientY - sy), -420, 420);
    applyTransform();
  });
  zoomImg.addEventListener("pointerup", () => { dragging = false; });
  zoomImg.addEventListener("pointercancel", () => { dragging = false; });
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initSection07Poster();
}
