// 183 矩形绕排 · 01–07 各节独立交互控件（相邻两节控件形态与交互机制各不相同）

// ========== 01 节：直缘 vs 阶梯 · 左缘回扫散点对比仪 ==========
export function initReturnEdgeComparator() {
  const wrap = document.getElementById("s01-comp");
  if (!wrap) return;
  const svg = document.getElementById("s01-svg");
  const verdict = document.getElementById("s01-verdict");
  const buttons = [...wrap.querySelectorAll("[data-comp]")];

  const MODES = {
    rightFlush: {
      title: "贴右矩形绕排（183 推荐）",
      drift: "左起跑线漂移：0 次（全段笔直）",
      summary: "矩形图块贴齐右栏边，左侧正文从第 1 行到最后一行共用同一条垂直起跑线。眼球回扫完全依赖肌肉记忆，阅读零卡顿。",
      block: { type: "rect", x: 248, y: 58, w: 128, h: 126 },
      lines: [
        [24, 376], [24, 376],
        [24, 232], [24, 232], [24, 232], [24, 232], [24, 232], [24, 232],
        [24, 376], [24, 376],
      ],
      ok: true,
    },
    leftFlush: {
      title: "贴左矩形绕排（183 稳态）",
      drift: "左起跑线漂移：2 次（一次直线切换）",
      summary: "图块贴齐左栏边，绕排区形成一条干净笔直的内缩左缘；眼球仅在进入与离开图块时换轨一次，远比不规则轮廓省力。",
      block: { type: "rect", x: 24, y: 58, w: 128, h: 126 },
      lines: [
        [24, 376], [24, 376],
        [168, 376], [168, 376], [168, 376], [168, 376], [168, 376], [168, 376],
        [24, 376], [24, 376],
      ],
      ok: true,
    },
    centerSplit: {
      title: "居中单流劈栏（经典翻车）",
      drift: "左起跑线漂移：每行跨图跳 1 次（断句严重）",
      summary: "单段文字被迫跨过中间的矩形继续读右边，同一句被拦腰斩断；读者常会误把左半侧当成一栏竖着往下读，语意瞬间混乱。",
      block: { type: "rect", x: 136, y: 58, w: 128, h: 126 },
      lines: [
        [24, 376], [24, 376],
        [24, 122], [278, 376], [24, 122], [278, 376], [24, 122], [278, 376],
        [24, 376], [24, 376],
      ],
      split: true,
      ok: false,
    },
    contour: {
      title: "不规则轮廓绕排（见 182 轮廓绕排）",
      drift: "左起跑线漂移：每行都在变（阶梯锯齿）",
      summary: "曲线贴边在杂志特写页极具装饰感，但若放在左缘，每一行的起跑坐标都在抖动，适合短导语与情绪页，不适合万字长文。",
      block: { type: "circle", cx: 88, cy: 121, r: 62 },
      lines: [
        [24, 376], [24, 376],
        [146, 376], [162, 376], [166, 376], [162, 376], [148, 376], [126, 376],
        [24, 376], [24, 376],
      ],
      ok: false,
    },
  };

  function render(key) {
    const m = MODES[key] || MODES.rightFlush;
    buttons.forEach((b) => {
      const active = b.dataset.comp === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    const parts = [];
    // 纸底与左缘标尺
    parts.push(`<rect x="0" y="0" width="400" height="246" fill="#01473F"/>`);
    parts.push(`<rect x="16" y="14" width="368" height="218" fill="#003B34" stroke="rgba(233,218,185,0.28)" stroke-width="1"/>`);

    // 绘制主体图块
    if (m.block.type === "rect") {
      parts.push(`<rect x="${m.block.x}" y="${m.block.y}" width="${m.block.w}" height="${m.block.h}" fill="#FEC43E"/>`);
    } else {
      parts.push(`<circle cx="${m.block.cx}" cy="${m.block.cy}" r="${m.block.r}" fill="#FEC43E"/>`);
    }

    // 绘制正文行条 + 左起跑线落点散点轨
    const anchors = [];
    let rowIdx = 0;
    const ys = [30, 48, 70, 90, 110, 130, 150, 170, 196, 214];
    if (m.split) {
      const splitRows = [
        { y: 30, segs: [[24, 376]] },
        { y: 48, segs: [[24, 376]] },
        { y: 74, segs: [[24, 122], [278, 376]] },
        { y: 98, segs: [[24, 122], [278, 376]] },
        { y: 122, segs: [[24, 122], [278, 376]] },
        { y: 146, segs: [[24, 122], [278, 376]] },
        { y: 170, segs: [[24, 122], [278, 376]] },
        { y: 196, segs: [[24, 376]] },
        { y: 214, segs: [[24, 376]] },
      ];
      for (const sr of splitRows) {
        for (const [x0, x1] of sr.segs) {
          parts.push(`<rect x="${x0}" y="${sr.y}" width="${x1 - x0}" height="7" fill="#E9DAB9" opacity="0.9"/>`);
          anchors.push([x0, sr.y + 3.5]);
        }
        if (sr.segs.length === 2) {
          parts.push(`<path d="M122 ${sr.y + 3.5} Q200 ${sr.y - 8} 278 ${sr.y + 3.5}" fill="none" stroke="#FF6B57" stroke-width="1.6" stroke-dasharray="4 3"/>`);
        }
      }
    } else {
      for (const [x0, x1] of m.lines) {
        const y = ys[rowIdx++];
        parts.push(`<rect x="${x0}" y="${y}" width="${x1 - x0}" height="7" fill="#E9DAB9" opacity="0.92"/>`);
        anchors.push([x0, y + 3.5]);
      }
    }

    // 左缘起跑折线轨（高亮展示眼球回扫路径）
    const pathD = anchors.map(([ax, ay], i) => `${i === 0 ? "M" : "L"}${ax - 4} ${ay}`).join(" ");
    const railColor = m.ok ? "#5CE0A8" : "#FF6B57";
    parts.push(`<path d="${pathD}" fill="none" stroke="${railColor}" stroke-width="2" stroke-dasharray="${m.ok ? "none" : "4 3"}"/>`);
    for (const [ax, ay] of anchors) {
      parts.push(`<circle cx="${ax - 4}" cy="${ay}" r="3.2" fill="${railColor}"/>`);
    }

    svg.innerHTML = parts.join("");
    verdict.innerHTML = `
      <div class="s01-v-head">
        <strong>${m.title}</strong>
        <span class="pill ${m.ok ? "is-ok" : "is-err"}">${m.drift}</span>
      </div>
      <p>${m.summary}</p>
    `;
  }

  buttons.forEach((b) => b.addEventListener("click", () => render(b.dataset.comp)));
  render("rightFlush");
}

// ========== 02 节：排印显微四边游标尺（独立四边避让 + 基线落点 + CSS/InDesign 实时映射） ==========
export function initStandoffLoupe() {
  const root = document.getElementById("s02-loupe");
  if (!root) return;
  const inputs = {
    top: document.getElementById("off-top"),
    right: document.getElementById("off-right"),
    bottom: document.getElementById("off-bottom"),
    left: document.getElementById("off-left"),
  };
  const vals = {
    top: document.getElementById("val-top"),
    right: document.getElementById("val-right"),
    bottom: document.getElementById("val-bottom"),
    left: document.getElementById("val-left"),
  };
  const svg = document.getElementById("s02-svg");
  const code = document.getElementById("s02-code");
  const audit = document.getElementById("s02-audit");
  const presetBtns = [...root.querySelectorAll("[data-off-preset]")];

  const PRESETS = {
    ideal: { top: 0, right: 0, bottom: 16, left: 20 },
    uniform: { top: 16, right: 16, bottom: 16, left: 16 },
    zero: { top: 0, right: 0, bottom: 0, left: 0 },
    wide: { top: 32, right: 0, bottom: 36, left: 40 },
  };

  function update() {
    const t = +inputs.top.value;
    const r = +inputs.right.value;
    const b = +inputs.bottom.value;
    const l = +inputs.left.value;

    vals.top.textContent = `${t}px`;
    vals.right.textContent = `${r}px`;
    vals.bottom.textContent = `${b}px`;
    vals.left.textContent = `${l}px`;

    // 2.5x 显微视图（贴右浮动的矩形，上缘对帽高、右侧贴栏边、左与底面对正文）
    const colL = 24;
    const colR = 456;
    const lineStep = 28;
    const firstBaseY = 56; // B1 基线
    const capOffset = 12; // 13.5px 中文字体视觉帽高相对基线偏上约 12px
    const capLineY = firstBaseY - capOffset; // y = 44，第 1 行帽高线
    const blockW = 148;
    const blockH = 96; // 精确从 B1 帽高 (44) 跨至 B4 基线 (140)，刚好 4 行
    const bx1 = colR - r;
    const bx0 = bx1 - blockW;
    const by0 = capLineY + t;
    const by1 = by0 + blockH;

    const ex0 = bx0 - l;
    const ey1 = by1 + b;
    const leftOk = l >= 12 && l <= 28;
    const rightFlush = r === 0;
    const botOk = b >= 10 && b <= 28;
    const topOk = t === 0;

    const p = [];
    p.push(`<rect x="0" y="0" width="480" height="252" fill="#FFFDF7"/>`);
    // 栏边参考线
    p.push(`<line x1="${colL}" y1="14" x2="${colL}" y2="240" stroke="#01473F" stroke-width="1" stroke-dasharray="3 3" opacity="0.45"/>`);
    p.push(`<line x1="${colR}" y1="14" x2="${colR}" y2="240" stroke="#01473F" stroke-width="1" stroke-dasharray="3 3" opacity="0.45"/>`);
    // 7 条实对齐基线网格线（B1..B7 与正文基线逐像素重合）
    for (let i = 0; i < 7; i++) {
      const y = firstBaseY + i * lineStep;
      p.push(`<line x1="${colL}" y1="${y}" x2="${colR}" y2="${y}" stroke="rgba(1,71,63,0.16)" stroke-width="1"/>`);
      p.push(`<text x="18" y="${y + 3}" text-anchor="end" font-size="9" font-family="IBM Plex Mono, monospace" fill="#35534E">B${i + 1}</text>`);
    }
    // 首行帽高线（Cap-height）
    p.push(`<line x1="${colL}" y1="${capLineY}" x2="${colR}" y2="${capLineY}" stroke="#8A5600" stroke-width="1" stroke-dasharray="2 3"/>`);

    // 正文连续流动绕排（避头标点 + 逐像素落回基线 B1..B7）
    const continuousCopy =
      "矩形图块贴齐右栏边时，右外缘保持零距对齐版心右边线；左侧面向正文拉开约一字至一字半气口，笔画清晰不黏边。图块顶缘对准首行汉字帽高，底缘配合下方避让距凑齐整倍行距，让续接正文恰好落回基线网格，整段左右边界依然严丝合缝。";
    const closeP = "，。、；：！？）》」』";
    let cur = 0;
    let firstBelowCapY = null;
    for (let i = 0; i < 7 && cur < continuousCopy.length; i++) {
      const baseY = firstBaseY + i * lineStep;
      const lineCapTop = baseY - capOffset;
      const hitsBlock = baseY > by0 + 1 && lineCapTop < ey1 - 1;
      if (!hitsBlock && firstBelowCapY === null && lineCapTop >= by1 - 2) {
        firstBelowCapY = lineCapTop;
      }
      const maxX = hitsBlock ? Math.max(colL + 36, ex0) : colR;
      const maxChars = Math.max(3, Math.floor((maxX - colL) / 14.2));
      let end = Math.min(continuousCopy.length, cur + maxChars);
      if (end < continuousCopy.length && closeP.includes(continuousCopy[end]) && end - cur > 3) {
        end -= 1;
      }
      const str = continuousCopy.slice(cur, end);
      cur = end;
      p.push(`<text x="${colL}" y="${baseY}" font-size="13.5" font-family="Noto Sans SC, sans-serif" fill="#072E29">${str}</text>`);
    }
    const baseGap = firstBelowCapY !== null ? Math.max(0, Math.round(firstBelowCapY - by1)) : b;

    // 避让区半透明标示
    p.push(`<rect x="${ex0}" y="${Math.min(capLineY, by0)}" width="${colR - ex0}" height="${ey1 - Math.min(capLineY, by0)}" fill="${leftOk && botOk ? "rgba(11,107,77,0.1)" : "rgba(181,43,29,0.12)"}" stroke="${leftOk && botOk ? "#0B6B4D" : "#B52B1D"}" stroke-width="1.2" stroke-dasharray="4 3"/>`);
    // 黄金图块本体
    p.push(`<rect x="${bx0}" y="${by0}" width="${blockW}" height="${blockH}" fill="#FEC43E" stroke="#072E29" stroke-width="1.5"/>`);
    p.push(`<text x="${bx0 + blockW / 2}" y="${by0 + blockH / 2 + 4}" text-anchor="middle" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif" fill="#072E29">贴右矩形块</text>`);

    // 四边实测标尺（置于顶栏空白带与底避让带，绝不与边框叠字）
    const lTagX = Math.max(colL + 26, Math.min(bx0 - 16, (ex0 + bx0) / 2));
    p.push(`<rect x="${lTagX - 24}" y="12" width="48" height="16" fill="#FFFDF7" stroke="${leftOk ? "#0B6B4D" : "#B52B1D"}" stroke-width="1"/>`);
    p.push(`<text x="${lTagX}" y="23" text-anchor="middle" font-size="10" font-weight="600" font-family="IBM Plex Mono, monospace" fill="${leftOk ? "#0B6B4D" : "#B52B1D"}">L ${l}px</text>`);
    p.push(`<line x1="${lTagX}" y1="28" x2="${lTagX}" y2="${capLineY}" stroke="${leftOk ? "#0B6B4D" : "#B52B1D"}" stroke-width="1"/>`);
    p.push(`<text x="${bx0 + blockW / 2}" y="${by1 + Math.max(12, Math.min(b - 3, b / 2 + 4))}" text-anchor="middle" font-size="10" font-weight="600" font-family="IBM Plex Mono, monospace" fill="${botOk ? "#0B6B4D" : "#B52B1D"}">B ${b}px</text>`);
    if (r > 0) {
      p.push(`<rect x="${colR - 46}" y="12" width="46" height="16" fill="#FFFDF7" stroke="#B52B1D" stroke-width="1"/>`);
      p.push(`<text x="${colR - 23}" y="23" text-anchor="middle" font-size="9.5" font-weight="600" font-family="IBM Plex Mono, monospace" fill="#B52B1D">R ${r}px</text>`);
    }

    svg.innerHTML = p.join("");

    code.textContent = `.figure-box {\n  float: right;\n  margin: ${t}px ${r}px ${b}px ${l}px; /* 上 右 下 左 */\n}`;

    const notes = [];
    if (!rightFlush) notes.push(`右外缘留了 ${r}px，导致图块脱离版心右边线（贴右时外缘应设 0px）`);
    if (!topOk) notes.push(`顶缘下推了 ${t}px，失去与首行帽高齐平的利落感`);
    if (l < 10) notes.push(`左侧避让仅 ${l}px，正文笔画紧贴图块发生啃边`);
    else if (l > 30) notes.push(`左侧避让 ${l}px 过大，图块显得与正文脱节`);
    if (b < 8) notes.push(`底缘仅 ${b}px，下方恢复通栏时几乎顶到图底`);
    else if (b > 30) notes.push(`底缘 ${b}px 过宽，下方出现明显断层空隙`);

    if (notes.length === 0) {
      audit.className = "s02-audit is-ok";
      audit.innerHTML = `<strong>✓ 工程四边达标：</strong>外缘贴栏（上 ${t}px / 右 ${r}px），文字面透气均匀（左 ${l}px / 下 ${b}px，底距约 ${baseGap}px 衔接基线）。`;
    } else {
      audit.className = "s02-audit is-err";
      audit.innerHTML = `<strong>检出 ${notes.length} 处问题：</strong>${notes.join("；")}。`;
    }
  }

  Object.values(inputs).forEach((el) => el.addEventListener("input", update));
  presetBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.offPreset];
      if (!p) return;
      inputs.top.value = p.top;
      inputs.right.value = p.right;
      inputs.bottom.value = p.bottom;
      inputs.left.value = p.left;
      update();
    })
  );
  update();
}

// ========== 03 节：网格积木铺排台（1/2/3 栏切换 + 直接点击网格单元放置图块） ==========
export function initModularGridBoard() {
  const root = document.getElementById("s03-board");
  if (!root) return;
  const colBtns = [...root.querySelectorAll("[data-cols]")];
  const gridEl = document.getElementById("s03-grid");
  const readout = document.getElementById("s03-readout");

  let cols = 3;
  // 图块占据的列范围 [startCol..endCol]（0-indexed，半格支持跨中缝）
  let placement = "right1"; // 随栏数变化的模块槽

  const SLOTS_BY_COLS = {
    1: [
      { id: "rEdge", label: "贴右 40% 模块", x: 60, w: 40, ok: true, msg: "单栏最稳方案：图块靠右贴边，左侧保留约 60% 通畅正文且左缘笔直。" },
      { id: "centerBad", label: "单栏居中 44%（警示）", x: 28, w: 44, ok: false, msg: "单栏里把图块放正中，左右各剩 28% 挤成窄条且单段正文会被拦腰劈断。" },
      { id: "fullJump", label: "通栏 100% 跳行", x: 0, w: 100, ok: true, msg: "宽图干脆占满整栏宽、上下留整倍行距，绝不在侧边硬塞字。" },
    ],
    2: [
      { id: "straddle", label: "跨中缝居中（杂志经典）", x: 30, w: 40, ok: true, msg: "跨两栏中缝：左栏只绕图块左边、右栏只绕图块右边，各栏独立不断句——杂志专访最爱。" },
      { id: "col2Right", label: "占右栏整宽（模块齐栏）", x: 52, w: 48, ok: true, msg: "完全贴合第二栏宽度的瑞士网格模块，左栏全文一通到底，秩序感最强。" },
      { id: "col1Half", label: "单栏内挤半宽（偏窄）", x: 24, w: 24, ok: false, msg: "双栏单列本来就窄，再在左栏里切出一半放图，旁边文字立刻缩成 5–6 字牙签条。" },
    ],
    3: [
      { id: "span2", label: "跨右两栏（2/3 模块）", x: 35, w: 65, ok: true, msg: "米勒-布罗克曼式三栏模块化：图块严格占据右 2 栏 + 1 栏沟，左栏完整承担正文导读。" },
      { id: "right1", label: "占右 1 栏信息盒", x: 68, w: 32, ok: true, msg: "右侧整栏变身要点信息盒或竖构图摄影块，前两栏保持稳定阅读流。" },
      { id: "mid1", label: "占中栏 1 栏（双翼夹图）", x: 34, w: 32, ok: true, msg: "中间整栏放图，左右两栏各自独立通高排字——既对称又完全没有跨图跳句风险。" },
    ],
  };

  function render() {
    colBtns.forEach((b) => {
      const active = +b.dataset.cols === cols;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    const slots = SLOTS_BY_COLS[cols];
    if (!slots.some((s) => s.id === placement)) placement = slots[0].id;
    const cur = slots.find((s) => s.id === placement);

    // 渲染可点击的模块化纸页蓝图 + 下方槽位选择条
    const colLines = [];
    const colW = 100 / cols;
    for (let c = 0; c < cols; c++) {
      const cx = c * colW;
      colLines.push(
        `<div class="s03-col" style="left:${cx}%;width:${colW}%">
          <span class="s03-col-tag">栏 0${c + 1}</span>
          ${Array.from({ length: 8 }, () => `<span class="s03-line"></span>`).join("")}
        </div>`
      );
    }

    gridEl.innerHTML = `
      <div class="s03-sheet" role="img" aria-label="${cols}栏网格下${cur.label}示意">
        ${colLines.join("")}
        <div class="s03-block ${cur.ok ? "is-ok" : "is-err"}" style="left:${cur.x}%;width:${cur.w}%">
          <span>${cur.label}</span>
          <small>${cur.ok ? "✓ 对齐网格模块" : "× 破坏行宽秩序"}</small>
        </div>
      </div>
      <div class="s03-slot-row" role="group" aria-label="选择图块落位">
        ${slots
          .map(
            (s) =>
              `<button type="button" class="s03-slot-btn ${s.id === placement ? "is-active" : ""}" data-slot="${s.id}">${s.label}</button>`
          )
          .join("")}
      </div>
    `;

    gridEl.querySelectorAll("[data-slot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        placement = btn.dataset.slot;
        render();
      });
    });

    readout.className = `s03-readout ${cur.ok ? "is-ok" : "is-err"}`;
    readout.innerHTML = `<strong>${cols} 栏 · ${cur.label}：</strong>${cur.msg}`;
  }

  colBtns.forEach((b) =>
    b.addEventListener("click", () => {
      cols = +b.dataset.cols;
      placement = SLOTS_BY_COLS[cols][0].id;
      render();
    })
  );
  render();
}

// ========== 04 节：四代排印工艺解剖轨（1499 / 1981 / 1988 / 1996） ==========
export function initHistoryRail() {
  const root = document.getElementById("s04-rail");
  if (!root) return;
  const tabs = [...root.querySelectorAll("[data-era]")];
  const stage = document.getElementById("s04-stage");

  const ERAS = {
    "1499": {
      year: "1493–1499",
      title: "活字版框与木刻矩形底座",
      meta: "《纽伦堡编年史》(1493) · 威尼斯《寻爱绮梦》(1499)",
      desc: "早期活字印刷必须把金属活字、木刻插图块与空铅木条（furniture）装进铁制版框（chase）从四面楔紧。任何不规则外形都无法在机械锁版中受力，因此木刻插图天然做成方正矩形，铅字行围绕它的直线四边排开——矩形绕排诞生于物理锁版约束。",
      svg: `
        <rect x="0" y="0" width="320" height="190" fill="#01473F"/>
        <rect x="20" y="16" width="280" height="158" fill="none" stroke="#E9DAB9" stroke-width="4"/>
        <rect x="34" y="28" width="252" height="134" fill="#003932" stroke="rgba(233,218,185,0.4)" stroke-width="1"/>
        <rect x="44" y="38" width="96" height="84" fill="#FEC43E"/>
        <rect x="52" y="46" width="80" height="68" fill="none" stroke="#062924" stroke-width="1.5"/>
        <path d="M62 104 L82 64 L98 88 L112 72 L124 104 Z" fill="#062924"/>
        <g fill="#E9DAB9" opacity="0.88">
          <rect x="152" y="42" width="122" height="6"/><rect x="152" y="56" width="122" height="6"/>
          <rect x="152" y="70" width="122" height="6"/><rect x="152" y="84" width="122" height="6"/>
          <rect x="152" y="98" width="122" height="6"/><rect x="152" y="112" width="122" height="6"/>
          <rect x="44" y="134" width="230" height="6"/><rect x="44" y="148" width="194" height="6"/>
        </g>
        <text x="160" y="185" text-anchor="middle" font-size="10" font-family="IBM Plex Mono, monospace" fill="#FEC43E">CHASE LOCK-UP · WOODCUT RECTANGLE</text>
      `,
    },
    "1981": {
      year: "1981",
      title: "瑞士网格系统把矩形制度化",
      meta: "Josef Müller-Brockmann《平面设计中的网格系统》（Arthur Niggli）",
      desc: "约瑟夫·米勒-布罗克曼在 1981 年出版的双语著作中，把插图矩形从「随手插空」升级为网格模块：图块宽窄严格对齐整数栏宽加栏沟，行长由正常阅读视距与字号反推，矩形绕排从此成为现代报刊、建筑画册与企业手册的秩序基石。",
      svg: `
        <rect x="0" y="0" width="320" height="190" fill="#01473F"/>
        <g stroke="rgba(233,218,185,0.28)" stroke-width="1" stroke-dasharray="2 3">
          <rect x="28" y="20" width="60" height="140" fill="none"/>
          <rect x="96" y="20" width="60" height="140" fill="none"/>
          <rect x="164" y="20" width="60" height="140" fill="none"/>
          <rect x="232" y="20" width="60" height="140" fill="none"/>
        </g>
        <rect x="96" y="20" width="128" height="82" fill="#FEC43E"/>
        <g fill="#E9DAB9" opacity="0.9">
          <rect x="28" y="24" width="58" height="5"/><rect x="28" y="36" width="58" height="5"/><rect x="28" y="48" width="58" height="5"/>
          <rect x="28" y="60" width="58" height="5"/><rect x="28" y="72" width="58" height="5"/><rect x="28" y="84" width="58" height="5"/>
          <rect x="232" y="24" width="58" height="5"/><rect x="232" y="36" width="58" height="5"/><rect x="232" y="48" width="58" height="5"/>
          <rect x="96" y="114" width="128" height="5"/><rect x="96" y="126" width="128" height="5"/><rect x="96" y="138" width="112" height="5"/>
        </g>
        <text x="160" y="180" text-anchor="middle" font-size="10" font-family="IBM Plex Mono, monospace" fill="#FEC43E">SWISS 4-COLUMN MODULAR GRID · 1981</text>
      `,
    },
    "1988": {
      year: "1988",
      title: "PageMaker 3.0 让矩形绕排自动化",
      meta: "Aldus PageMaker 3.0（1988）· 后承接至 InDesign 定界框绕排",
      desc: "1985 年首版 PageMaker 1.0 还没有自动绕排，排图文仍要手工切栏断行。直到 1988 年 PageMaker 3.0 引入自动文字绕排（Text Wrap）与四边避让距（Standoff），拖动矩形外框时正文首次实时重排——这正是今天 InDesign「沿定界框绕排」的直系源头。",
      svg: `
        <rect x="0" y="0" width="320" height="190" fill="#01473F"/>
        <rect x="34" y="22" width="252" height="136" fill="#003932" stroke="rgba(233,218,185,0.35)"/>
        <rect x="162" y="44" width="106" height="84" fill="none" stroke="#5CE0A8" stroke-width="1.5" stroke-dasharray="4 3"/>
        <rect x="176" y="54" width="84" height="64" fill="#FEC43E"/>
        <g fill="#5CE0A8">
          <rect x="159" y="41" width="6" height="6"/><rect x="265" y="41" width="6" height="6"/>
          <rect x="159" y="125" width="6" height="6"/><rect x="265" y="125" width="6" height="6"/>
        </g>
        <g fill="#E9DAB9" opacity="0.9">
          <rect x="46" y="32" width="224" height="5"/>
          <rect x="46" y="48" width="106" height="5"/><rect x="46" y="62" width="106" height="5"/>
          <rect x="46" y="76" width="106" height="5"/><rect x="46" y="90" width="106" height="5"/>
          <rect x="46" y="104" width="106" height="5"/><rect x="46" y="118" width="106" height="5"/>
          <rect x="46" y="138" width="224" height="5"/>
        </g>
        <text x="160" y="180" text-anchor="middle" font-size="10" font-family="IBM Plex Mono, monospace" fill="#FEC43E">BOUNDING BOX + STANDOFF HANDLES · 1988</text>
      `,
    },
    "1996": {
      year: "1996–今",
      title: "CSS1 float 把矩形绕排带进网页",
      meta: "W3C CSS Level 1 §5.5.25（1996-12-17）· CSS Exclusions · JLReq §4.3",
      desc: "1996 年 12 月 W3C 正式发布 CSS1 规范，专门用 float: left / right 复刻报刊的矩形绕排，配合 margin 充当四边避让距。后续 W3C 的 CSS Exclusions（wrap-flow）与东亚排版需求文档（JLReq §4.3）进一步探讨了居中绕排与版心行网对齐规则。",
      svg: `
        <rect x="0" y="0" width="320" height="190" fill="#01473F"/>
        <rect x="28" y="20" width="264" height="140" fill="#00352F" stroke="rgba(233,218,185,0.4)"/>
        <rect x="174" y="34" width="104" height="74" fill="#FEC43E"/>
        <text x="226" y="66" text-anchor="middle" font-size="10.5" font-weight="700" font-family="IBM Plex Mono, monospace" fill="#062924">float: right;</text>
        <text x="226" y="84" text-anchor="middle" font-size="9.5" font-family="IBM Plex Mono, monospace" fill="#062924">margin: 0 0 16px 20px;</text>
        <g fill="#E9DAB9" opacity="0.9">
          <rect x="40" y="36" width="118" height="5"/><rect x="40" y="50" width="118" height="5"/>
          <rect x="40" y="64" width="118" height="5"/><rect x="40" y="78" width="118" height="5"/>
          <rect x="40" y="92" width="118" height="5"/><rect x="40" y="106" width="118" height="5"/>
          <rect x="40" y="126" width="238" height="5"/><rect x="40" y="140" width="204" height="5"/>
        </g>
        <text x="160" y="180" text-anchor="middle" font-size="10" font-family="IBM Plex Mono, monospace" fill="#FEC43E">W3C CSS1 REC §5.5.25 · DEC 17, 1996</text>
      `,
    },
  };

  function show(key) {
    const e = ERAS[key] || ERAS["1499"];
    tabs.forEach((t) => {
      const on = t.dataset.era === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    stage.innerHTML = `
      <div class="s04-diagram">
        <svg viewBox="0 0 320 190" role="img" aria-label="${e.title}">${e.svg}</svg>
      </div>
      <div class="s04-copy">
        <span class="s04-year">${e.year}</span>
        <h3>${e.title}</h3>
        <p class="s04-meta">${e.meta}</p>
        <p>${e.desc}</p>
      </div>
    `;
  }

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.era)));
  show("1499");
}

// ========== 05 节：栏宽挤压压力测试仪（720px -> 320px 响应式断点对比） ==========
export function initSqueezeStressTest() {
  const slider = document.getElementById("s05-width");
  const modeBtn = document.getElementById("s05-resp-toggle");
  const outWidth = document.getElementById("s05-width-val");
  const preview = document.getElementById("s05-preview");
  const msg = document.getElementById("s05-msg");
  if (!slider || !preview) return;

  let responsiveStack = false;
  const copy =
    "矩形绕排在宽屏杂志或桌面网页上非常省空间，可一旦容器缩窄到手机宽度，硬撑侧边绕排就会把正文压成每行只有五六个字的碎条。此时主动在断点处解除浮动、改回全宽上下堆叠，让宽屏保有紧凑绕排节奏，窄屏也恢复通畅的整行阅读体验。";

  function render() {
    const w = +slider.value; // 320..720
    outWidth.textContent = `${w}px`;
    const isNarrow = w < 480;
    const stacked = responsiveStack && isNarrow;
    const pad = 16;
    const gap = 16;
    const boxW = Math.round(w * 0.42);
    const sidePx = Math.max(48, w - pad * 2 - boxW - gap);
    const charW = 15;
    const sideCap = Math.max(3, Math.floor(sidePx / charW));
    const fullCap = Math.max(10, Math.floor((w - pad * 2) / charW));

    modeBtn.textContent = responsiveStack ? "断点自动堆叠：开" : "断点自动堆叠：关（硬撑绕排）";
    modeBtn.classList.toggle("is-on", responsiveStack);
    modeBtn.setAttribute("aria-pressed", String(responsiveStack));

    // 用真实等比 SVG 模拟容器物理宽 w：无论桌面还是 390px 手机，画面字数与读数 100% 严格一致
    const closeP = "，。、；：！？）》」』";
    const rows = [];
    let cursor = 0;
    const boxH = stacked ? 54 : 106;
    const startY = stacked ? pad + boxH + 22 : pad + 18;
    const lineH = 23;
    const wrapLineCount = stacked ? 0 : 5;
    for (let i = 0; i < 9 && cursor < copy.length; i++) {
      const cap = i < wrapLineCount ? sideCap : fullCap;
      let end = Math.min(copy.length, cursor + cap);
      if (end < copy.length && closeP.includes(copy[end]) && end - cursor > 2) {
        end -= 1;
      }
      const line = copy.slice(cursor, end);
      cursor = end;
      rows.push({ text: line, y: startY + i * lineH, narrow: !stacked && i < wrapLineCount && isNarrow });
    }
    const svgH = Math.max(170, startY + rows.length * lineH + 10);
    const borderCol = isNarrow && !stacked ? "#A82417" : "#01473F";

    const svgParts = [
      `<rect x="1" y="1" width="${w - 2}" height="${svgH - 2}" fill="#FFFDF7" stroke="${borderCol}" stroke-width="2"/>`,
    ];
    if (stacked) {
      svgParts.push(`<rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${boxH}" fill="#FEC43E" stroke="#072E29" stroke-width="1.2"/>`);
      svgParts.push(`<text x="${w / 2}" y="${pad + boxH / 2 + 5}" text-anchor="middle" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif" fill="#072E29">全宽堆叠（已撤绕排）</text>`);
    } else {
      const bx = w - pad - boxW;
      svgParts.push(`<rect x="${bx}" y="${pad}" width="${boxW}" height="${boxH}" fill="#FEC43E" stroke="#072E29" stroke-width="1.2"/>`);
      svgParts.push(`<text x="${bx + boxW / 2}" y="${pad + boxH / 2 + 5}" text-anchor="middle" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif" fill="#072E29">图块 ${boxW}px</text>`);
    }
    for (const r of rows) {
      if (r.narrow) {
        svgParts.push(`<rect x="${pad - 2}" y="${r.y - 14}" width="${sidePx + 4}" height="19" fill="rgba(168,36,23,0.1)"/>`);
      }
      svgParts.push(`<text x="${pad}" y="${r.y}" font-size="14.5" font-family="Noto Sans SC, sans-serif" fill="#072E29">${r.text}</text>`);
    }

    preview.style.maxWidth = `${w}px`;
    preview.classList.toggle("is-stacked", stacked);
    preview.classList.toggle("is-crushed", isNarrow && !stacked);
    preview.innerHTML = `<svg viewBox="0 0 ${w} ${svgH}" style="width:100%;height:auto;" role="img" aria-label="容器宽 ${w}px 时的矩形绕排预览">${svgParts.join("")}</svg>`;

    if (stacked) {
      msg.className = "s05-msg is-ok";
      msg.innerHTML = `<strong>✓ 断点切换生效（${w}px &lt; 480px）：</strong>自动解除侧绕改为上下全宽，正文恢复每行 ${fullCap} 字的健康读感。`;
    } else if (isNarrow) {
      msg.className = "s05-msg is-err";
      msg.innerHTML = `<strong>× 窄屏硬绕翻车（${w}px）：</strong>图块旁边只剩每行 ${sideCap} 字，句子被切碎。点击「断点自动堆叠」看正确处理。`;
    } else {
      msg.className = "s05-msg is-ok";
      msg.innerHTML = `<strong>✓ 宽屏稳态（${w}px）：</strong>侧边保留每行 ${sideCap} 字，矩形绕排节奏舒展。往左拖到 480px 以下试试看临界点。`;
    }
  }

  slider.addEventListener("input", render);
  modeBtn.addEventListener("click", () => {
    responsiveStack = !responsiveStack;
    render();
  });
  render();
}

// ========== 06 节：三题递进式单变量四选一练习（中性标签 + 实时 SVG 微缩图） ==========
export function initPracticeQuiz() {
  const root = document.getElementById("s06-quiz");
  if (!root) return;
  const qTabs = [...root.querySelectorAll("[data-q]")];
  const promptEl = document.getElementById("s06-prompt");
  const gridEl = document.getElementById("s06-options");
  const fbEl = document.getElementById("s06-feedback");

  const QUESTIONS = [
    {
      title: "题 1/3 · 图块停靠位置",
      prompt: "单栏长文阅读页要嵌入一块占 40% 栏宽的矩形摄影图，希望读者换行回扫时左起跑线从头到尾完全笔直。以下四版仅改变了图块停靠位，哪一版最合适？",
      answer: "C",
      options: [
        {
          id: "A",
          label: "方案 A · 居中双侧",
          spec: "x = 50% · 两侧排字",
          svg: quizSvg("centerSplit"),
          why: "把 40% 宽图块放进单栏正中并双侧绕排，同一句话会被图块拦腰劈成左右两段短条，既断句又逼迫眼睛跨图跳读。",
        },
        {
          id: "B",
          label: "方案 B · 贴左单侧",
          spec: "x = 0% · 右侧排字",
          svg: quizSvg("leftFlush"),
          why: "贴左虽避免了劈栏，但图块高度范围内的正文左缘向内退了一截，换行回扫需要在全栏左缘与内缩左缘之间切换两次。",
        },
        {
          id: "C",
          label: "方案 C · 贴右单侧",
          spec: "x = 100% · 左侧排字",
          svg: quizSvg("rightFlush"),
          why: "正确。图块贴齐右栏边，左侧所有正文行从第一行到最后一行共享一条笔直的垂直起跑线，且保留约 60% 栏宽，回扫最稳。",
        },
        {
          id: "D",
          label: "方案 D · 偏左 18%",
          spec: "x = 18% · 两侧排字",
          svg: quizSvg("crevice"),
          why: "图块既没贴左缘又没居中，在左侧挤出一条仅容 3–4 字的尴尬窄缝，比彻底贴左更打断节奏。",
        },
      ],
    },
    {
      title: "题 2/3 · 四边避让与基线",
      prompt: "同一块贴右停靠的矩形信息盒，四版仅改变了四边避让距（上/右/下/左）与底缘落点，哪一版最符合出版与网页工程规范？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A · 0 / 0 / 0 / 0",
          spec: "上 0 · 右 0 · 下 0 · 左 0",
          svg: quizSvg("offZero"),
          why: "四边 0px 避让会让文字笔画直接撞进矩形金边，失去图底分离所需的呼吸留白。",
        },
        {
          id: "B",
          label: "方案 B · 0 / 0 / 16 / 18",
          spec: "上 0 · 右 0 · 下 16 · 左 18",
          svg: quizSvg("offIdeal"),
          why: "正确。贴右外缘与顶缘保持 0px 对齐栏边与首行帽高，只对接触正文的左、下两侧留出 16–18px 缓冲，并让底缘对齐整倍行距基线。",
        },
        {
          id: "C",
          label: "方案 C · 42 / 0 / 42 / 42",
          spec: "上 42 · 右 0 · 下 42 · 左 42",
          svg: quizSvg("offWide"),
          why: "42px 的巨大避让把图块推成孤岛，同时白白挤压了左侧正文的可用行宽。",
        },
        {
          id: "D",
          label: "方案 D · 16 / 16 / 10 / 16",
          spec: "上 16 · 右 16 · 下 10 · 左 16",
          svg: quizSvg("offIndent"),
          why: "右外缘多加的 16px 破坏了整页右侧齐边线，下方 10px 又未凑够整倍行距，导致续接正文偏离基线节奏。",
        },
      ],
    },
    {
      title: "题 3/3 · 宽图（68% 栏宽）处理",
      prompt: "一张细节丰富的建筑立面横图必须保持 68% 栏宽才能看清结构，进入单栏正文时，以下四版仅改变了绕排方式，哪一版最妥当？",
      answer: "C",
      options: [
        {
          id: "A",
          label: "方案 A · 贴右单侧",
          spec: "图宽 68% · 左侧排字",
          svg: quizSvg("wideRight"),
          why: "图块已占去 68%，扣除避让距后左侧不足 30%，正文被压成 6–7 字牙签条，阅读体验急剧恶化。",
        },
        {
          id: "B",
          label: "方案 B · 居中双侧",
          spec: "图宽 68% · 两侧排字",
          svg: quizSvg("wideCenter"),
          why: "两侧各只剩 3–4 字，彻底无法连贯成句。",
        },
        {
          id: "C",
          label: "方案 C · 跳行排布",
          spec: "图宽 68% · 上下排字",
          svg: quizSvg("wideJump"),
          why: "正确。当矩形宽过约 60% 时果断改用跳行排布（Jump Object），不向狭缝硬塞字，既保住大图细节又维持通栏舒适行长。",
        },
        {
          id: "D",
          label: "方案 D · 缩至 16% 贴右",
          spec: "图宽 16% · 左侧排字",
          svg: quizSvg("wideTiny"),
          why: "为了硬凑绕排把关键建筑图缩成邮票大小，违背了「看清结构细节」的阅读目标。",
        },
      ],
    },
  ];

  let curQ = 0;
  const picked = [null, null, null];

  function render() {
    const q = QUESTIONS[curQ];
    qTabs.forEach((t, i) => {
      t.classList.toggle("is-active", i === curQ);
      t.setAttribute("aria-selected", String(i === curQ));
      if (picked[i]) t.classList.toggle("is-done", picked[i] === QUESTIONS[i].answer);
    });
    promptEl.textContent = q.prompt;
    const chosen = picked[curQ];

    gridEl.innerHTML = q.options
      .map((opt) => {
        const isChosen = chosen === opt.id;
        const isAns = opt.id === q.answer;
        let stateCls = "";
        if (chosen) {
          if (isChosen && isAns) stateCls = "is-correct";
          else if (isChosen && !isAns) stateCls = "is-wrong";
          else if (isAns) stateCls = "is-reveal";
        }
        return `
          <button type="button" class="q-card ${stateCls}" data-opt="${opt.id}" aria-pressed="${isChosen}">
            <div class="q-thumb">${opt.svg}</div>
            <div class="q-meta">
              <span class="q-label">${opt.label}</span>
              <span class="q-spec">${opt.spec}</span>
            </div>
          </button>
        `;
      })
      .join("");

    gridEl.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[curQ] = btn.dataset.opt;
        render();
      });
    });

    if (!chosen) {
      fbEl.className = "q-feedback";
      fbEl.innerHTML = `<p>选出你认为最稳的一版，页面会立刻拆解四个方案之间的唯一变量差在哪。</p>`;
    } else {
      const opt = q.options.find((o) => o.id === chosen);
      const ans = q.options.find((o) => o.id === q.answer);
      const ok = chosen === q.answer;
      fbEl.className = `q-feedback ${ok ? "is-ok" : "is-err"}`;
      fbEl.innerHTML = ok
        ? `<p><strong>✓ 判断准确（${opt.label}）：</strong>${opt.why}</p>`
        : `<p><strong>你选了 ${opt.label}：</strong>${opt.why}</p><p class="q-ans-hint"><strong>更稳的是 ${ans.label}：</strong>${ans.why}</p>`;
    }
  }

  qTabs.forEach((t, i) => t.addEventListener("click", () => { curQ = i; render(); }));
  render();
}

function quizSvg(kind) {
  const L = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="5" fill="#E9DAB9" opacity="0.88"/>`;
  const linesTop = L(16, 16, 168) + L(16, 28, 168);
  const linesBot = L(16, 114, 168) + L(16, 126, 140);
  let mid = "";

  if (kind === "centerSplit") {
    mid = `<rect x="66" y="42" width="68" height="62" fill="#FEC43E"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 42) + L(142, y, 42)).join("");
  } else if (kind === "leftFlush") {
    mid = `<rect x="16" y="42" width="68" height="62" fill="#FEC43E"/>` +
      [44, 56, 68, 80, 92].map((y) => L(94, y, 90)).join("");
  } else if (kind === "rightFlush") {
    mid = `<rect x="116" y="42" width="68" height="62" fill="#FEC43E"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 90)).join("");
  } else if (kind === "crevice") {
    mid = `<rect x="44" y="42" width="68" height="62" fill="#FEC43E"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 22) + L(120, y, 64)).join("");
  } else if (kind === "offZero") {
    mid = `<rect x="116" y="40" width="68" height="66" fill="#FEC43E"/>` +
      [42, 54, 66, 78, 90, 102].map((y) => L(16, y, 100)).join("");
  } else if (kind === "offIdeal") {
    mid = `<rect x="116" y="42" width="68" height="60" fill="#FEC43E"/>` +
      `<rect x="104" y="42" width="80" height="70" fill="none" stroke="#5CE0A8" stroke-width="1" stroke-dasharray="3 2"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 86)).join("");
  } else if (kind === "offWide") {
    mid = `<rect x="122" y="50" width="62" height="46" fill="#FEC43E"/>` +
      `<rect x="94" y="34" width="90" height="76" fill="none" stroke="#E9DAB9" stroke-width="1" stroke-dasharray="3 2"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 74)).join("");
  } else if (kind === "offIndent") {
    mid = `<rect x="104" y="48" width="68" height="58" fill="#FEC43E"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 80)).join("") +
      L(16, 111, 168);
    return `<svg viewBox="0 0 200 144" aria-hidden="true"><rect width="200" height="144" fill="#003831"/><rect x="16" y="10" width="168" height="124" fill="none" stroke="rgba(233,218,185,0.22)"/>${linesTop}${mid}${L(16, 126, 140)}</svg>`;
  } else if (kind === "wideRight") {
    mid = `<rect x="70" y="42" width="114" height="62" fill="#FEC43E"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 44)).join("");
  } else if (kind === "wideCenter") {
    mid = `<rect x="43" y="42" width="114" height="62" fill="#FEC43E"/>` +
      [44, 56, 68, 80, 92].map((y) => L(16, y, 21) + L(163, y, 21)).join("");
  } else if (kind === "wideJump") {
    mid = `<rect x="43" y="42" width="114" height="60" fill="#FEC43E"/>`;
  } else if (kind === "wideTiny") {
    mid = `<rect x="154" y="42" width="30" height="28" fill="#FEC43E"/>` +
      [44, 56, 68].map((y) => L(16, y, 130)).join("") +
      [80, 92].map((y) => L(16, y, 168)).join("");
  }

  return `<svg viewBox="0 0 200 144" aria-hidden="true"><rect width="200" height="144" fill="#003831"/><rect x="16" y="10" width="168" height="124" fill="none" stroke="rgba(233,218,185,0.22)"/>${linesTop}${mid}${linesBot}</svg>`;
}

// ========== 07 节：原海报灯箱（点击放大、缩放、拖动平移、Esc 关） ==========
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-modal");
  const modalImg = document.getElementById("modal-poster-img");
  const stage = document.getElementById("modal-stage");
  const btnIn = document.getElementById("zoom-in");
  const btnOut = document.getElementById("zoom-out");
  const btnReset = document.getElementById("zoom-reset");
  const btnClose = document.getElementById("modal-close");
  if (!trigger || !posterImg || !dialog || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = null;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    if (!modalImg.src) modalImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.75, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.75, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  stage.addEventListener("mousedown", (e) => {
    if (e.target === stage) { close(); return; }
    panning = { x: e.clientX - tx, y: e.clientY - ty };
    stage.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", (e) => {
    if (!panning) return;
    tx = e.clientX - panning.x;
    ty = e.clientY - panning.y;
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    if (!panning) return;
    panning = null;
    stage.style.cursor = "grab";
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) close();
  });
}
