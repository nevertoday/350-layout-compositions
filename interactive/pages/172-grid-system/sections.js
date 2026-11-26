// 172 网格系统 — 英雄区三联微缩图 + 01–07 全部独立互动模块

// ==================== HERO 三枚原海报活体微缩图 ====================
export function renderHeroMinis(state, audit) {
  const colsHost = document.getElementById("mini-cols");
  const modsHost = document.getElementById("mini-modules");
  const alignHost = document.getElementById("mini-align");
  if (!colsHost || !modsHost || !alignHost) return;

  // 1. 列 / COLUMNS（动态同步列数与栏距比例）
  const n = state.cols;
  const gap = Math.max(1.5, Math.min(10, state.gutter * 0.22));
  const totalW = 240;
  const colW = (totalW - gap * (n - 1)) / n;
  let colRects = "";
  const colFill = state.gutter < 10 || state.gutter > 38 ? "#F5D0CD" : "#DCE1ED";
  for (let i = 0; i < n; i++) {
    colRects += `<rect x="${(i * (colW + gap)).toFixed(1)}" y="2" width="${colW.toFixed(1)}" height="42" fill="${colFill}" stroke="${audit.pGutter ? "#5B7BB2" : "#D93324"}" stroke-width="0.6"/>`;
  }
  colsHost.innerHTML = `<svg viewBox="0 0 240 46" preserveAspectRatio="none">${colRects}</svg>`;

  // 2. 模块 / MODULES（1:1 呼应原海报 5×4 矩阵，按当前主次反差着色）
  let modRects = "";
  const mw = 44;
  const mh = 9;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const hi = audit.pRhythm && ((r < 2 && c < 2) || (r === 2 && c === 3));
      modRects += `<rect x="${c * 48 + 1}" y="${r * 11 + 1}" width="${mw}" height="${mh}" fill="${hi ? "#0A4EC0" : "#DCE1ED"}"/>`;
    }
  }
  modsHost.innerHTML = `<svg viewBox="0 0 240 46" preserveAspectRatio="none">${modRects}</svg>`;

  // 3. 对齐 / ALIGNMENT（反映当前是否齐线或偏移）
  const shift = audit.pCols && audit.pHang ? 0 : 7;
  alignHost.innerHTML = `<svg viewBox="0 0 240 46" preserveAspectRatio="none">
    <line x1="16" y1="2" x2="16" y2="44" stroke="${audit.pCols ? "#3B6AC6" : "#D93324"}" stroke-dasharray="3 2" stroke-width="1"/>
    <line x1="6" y1="24" x2="234" y2="24" stroke="${audit.pHang ? "#3B6AC6" : "#D93324"}" stroke-dasharray="3 2" stroke-width="1"/>
    <rect x="${16 + shift}" y="4" width="22" height="16" fill="#0A4EC0"/>
    <rect x="48" y="6" width="84" height="3" fill="#0C1016"/>
    <rect x="${48 - shift * 0.7}" y="12" width="70" height="2.5" fill="#3D4657"/>
    <circle cx="${198 + shift * 0.6}" cy="13" r="9" fill="#E53E32"/>
    <rect x="${16 - shift * 0.4}" y="${28 + shift * 0.4}" width="22" height="14" fill="#D93324"/>
    <rect x="48" y="30" width="96" height="2.5" fill="#0C1016"/>
    <rect x="48" y="36" width="76" height="2.5" fill="#3D4657"/>
  </svg>`;
}

// ==================== 01 拉幕透视对比器 ====================
export function initSection01() {
  const xrayHost = document.getElementById("curtain-xray-svg");
  const printHost = document.getElementById("curtain-print-svg");
  const range = document.getElementById("curtain-range");
  const divider = document.getElementById("curtain-divider");
  const readout = document.getElementById("curtain-readout");
  const modeBtns = [...document.querySelectorAll("[data-curtain-mode]")];
  if (!xrayHost || !printHost || !range) return;

  let mode = "aligned";

  function buildSpreadSVG(isXray, aligned) {
    // 6 列坐标系：padX=34, innerW=532, gutter=14 -> colW=77
    const cols = [34, 125, 216, 307, 398, 489];
    const cw = 77;
    const dx = aligned ? [0, 0, 0, 0, 0, 0] : [11, -13, 15, -16, 12, -14];
    const dy = aligned ? [0, 0, 0, 0, 0, 0] : [-7, 9, 12, -8, 10, -9];

    let gridLayer = "";
    if (isXray) {
      for (const cx of cols) {
        gridLayer += `<rect x="${cx}" y="28" width="${cw}" height="318" fill="#E4E8F0"/>`;
      }
      gridLayer += `
        <line x1="22" y1="28" x2="578" y2="28" stroke="#3B6AC6" stroke-width="1.2" stroke-dasharray="4 4"/>
        <line x1="22" y1="158" x2="578" y2="158" stroke="#3B6AC6" stroke-width="1.2" stroke-dasharray="4 4"/>
        <line x1="22" y1="252" x2="578" y2="252" stroke="#3B6AC6" stroke-width="1.2" stroke-dasharray="4 4"/>
        <line x1="22" y1="346" x2="578" y2="346" stroke="#3B6AC6" stroke-width="1.2" stroke-dasharray="4 4"/>
        <line x1="34" y1="16" x2="34" y2="358" stroke="#3B6AC6" stroke-width="1.2" stroke-dasharray="4 4"/>
        <line x1="566" y1="16" x2="566" y2="358" stroke="#3B6AC6" stroke-width="1.2" stroke-dasharray="4 4"/>
      `;
      if (aligned) {
        // 标出 4 条强共用纵轴
        for (const ax of [34, 216, 398, 489]) {
          gridLayer += `<line x1="${ax}" y1="14" x2="${ax}" y2="360" stroke="#0A4EC0" stroke-width="1.6"/>`;
        }
      } else {
        // 标出散乱的 11 条红错线
        for (const rx of [34 + dx[0], 216 + dx[1], 216 + dx[2], 489 + dx[3], 398 + dx[4], 216 + dx[5], 398 + 18]) {
          gridLayer += `<line x1="${rx}" y1="18" x2="${rx}" y2="356" stroke="#D93324" stroke-width="1.1" stroke-dasharray="3 3"/>`;
        }
      }
    }

    const badgeText = isXray
      ? (aligned ? "透视骨架 · 仅 4 条共用轴" : "透视骨架 · 11 条散乱错边")
      : (aligned ? "纸面成品 · 藏线依然稳固" : "纸面成品 · 隐隐觉得摆歪了");

    return `<svg viewBox="0 0 600 375" aria-hidden="true">
      <rect width="600" height="375" fill="#FCF6ED"/>
      ${gridLayer}
      <!-- 蓝主块 -->
      <rect x="${cols[0] + dx[0]}" y="${44 + dy[0]}" width="${cw * 2 + 14}" height="188" fill="#0A4EC0"/>
      <!-- 主标两行 -->
      <text x="${cols[2] + dx[1]}" y="${86 + dy[1]}" font-size="30" font-weight="900" fill="#0C1016" font-family="Noto Sans SC, sans-serif">清晰的秩序</text>
      <text x="${cols[2] + dx[1]}" y="${124 + dy[1]}" font-size="30" font-weight="900" fill="#0C1016" font-family="Noto Sans SC, sans-serif">高效的沟通</text>
      <!-- 正文四线 -->
      <rect x="${cols[2] + dx[2]}" y="${174 + dy[2]}" width="${cw * 2 + 10}" height="4" fill="#0C1016"/>
      <rect x="${cols[2] + dx[2]}" y="${190 + dy[2]}" width="${cw * 2 + 4}" height="4" fill="#0C1016"/>
      <rect x="${cols[2] + dx[2]}" y="${206 + dy[2]}" width="${cw * 2 + 10}" height="4" fill="#0C1016"/>
      <rect x="${cols[2] + dx[2]}" y="${222 + dy[2]}" width="${cw * 1.6}" height="4" fill="#3D4657"/>
      <!-- 红圆 -->
      <circle cx="${cols[5] + cw / 2 + dx[3]}" cy="${96 + dy[3]}" r="34" fill="#E53E32"/>
      <!-- 蓝点阵 -->
      ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((k) =>
        `<circle cx="${cols[4] + 22 + k * 24 + dx[4]}" cy="${176 + r * 18 + dy[4]}" r="3.4" fill="#0A4EC0"/>`
      ).join("")).join("")}
      <!-- 底行三块 -->
      <rect x="${cols[0]}" y="268" width="46" height="46" fill="#0A4EC0"/>
      <rect x="${cols[0] + 60}" y="272" width="104" height="3.5" fill="#0C1016"/>
      <rect x="${cols[0] + 60}" y="284" width="96" height="3.5" fill="#0C1016"/>
      <rect x="${cols[0] + 60}" y="296" width="84" height="3.5" fill="#3D4657"/>
      <rect x="${cols[2] + dx[5]}" y="${268 + dy[5]}" width="${cw}" height="58" fill="#D93324"/>
      <rect x="${cols[4] + (aligned ? 0 : 18)}" y="${268 + (aligned ? 0 : -8)}" width="46" height="46" fill="#0A4EC0"/>
      <rect x="${cols[4] + 60 + (aligned ? 0 : 18)}" y="${272 + (aligned ? 0 : -8)}" width="104" height="3.5" fill="#0C1016"/>
      <rect x="${cols[4] + 60 + (aligned ? 0 : 18)}" y="${284 + (aligned ? 0 : -8)}" width="94" height="3.5" fill="#0C1016"/>
      <rect x="${cols[4] + 60 + (aligned ? 0 : 18)}" y="${296 + (aligned ? 0 : -8)}" width="82" height="3.5" fill="#3D4657"/>
      <!-- 角标 -->
      <rect x="${isXray ? 396 : 16}" y="348" width="188" height="21" fill="${isXray ? (aligned ? "#0A4EC0" : "#D93324") : "#0C1016"}"/>
      <text x="${isXray ? 490 : 110}" y="362" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF" font-family="Noto Sans SC, sans-serif">${badgeText}</text>
    </svg>`;
  }

  function render() {
    const aligned = mode === "aligned";
    xrayHost.innerHTML = buildSpreadSVG(true, aligned);
    printHost.innerHTML = buildSpreadSVG(false, aligned);
    const pct = Number(range.value);
    printHost.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    divider.style.left = `${pct}%`;
    readout.innerHTML = aligned
      ? `左半边是读者看到的「无框成品」，右半边剥开了背后的 6 列与 3 条水平挂线：全页 8 个模块只落在了 <strong>4 条共用纵轴</strong>上，所以藏起线条后依然稳如磐石。`
      : `肉眼手摆看似只偏了几毫米，拉开幕布立刻露馅：全页冒出了 <strong>11 条互不对齐的散乱边缘</strong>，眼睛每换一块都要重新对焦，整张版面显得拖沓不干脆。`;
  }

  range.addEventListener("input", render);
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.curtainMode;
      modeBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  render();
}

// ==================== 02 栅格解剖：五件骨架 ====================
const ANATOMY_DATA = {
  margins: {
    title: "页边距（Margins）：给整张版面留出呼吸护城河",
    desc: "页边距隔开物理纸边或屏幕边框，防止文字贴边窒息，也让手指持握书页时不遮正文。印刷版式常让下边距略大于上边距（经验值约 1.2×–1.5×），用来托住视觉下坠感。",
    css: "padding: clamp(24px, 4vw, 64px);",
  },
  columns: {
    title: "列轨（Columns）：决定内容宽度的纵向轨道",
    desc: "列把内容区等分成若干纵道。列数越多，版面能组合出的非对称跨度越丰富（如 6 列可组 2+4、3+3、2+2+2）；但单列太窄会导致中文频繁折行，因此多列必须靠「跨列合并」来承接长正文。",
    css: "grid-template-columns: repeat(6, minmax(0, 1fr));",
  },
  gutters: {
    title: "栏距（Gutters）：隔开相邻列、防串行的通道",
    desc: "栏距不是随便留的空隙。排版经验值建议栏距至少等于或略大于正文行高（约 1×–1.5× 行高）：太窄会让左右列跨缝串行，太宽则会把页面劈成彼此陌生的孤岛。",
    css: "column-gap: 20px; row-gap: 24px;",
  },
  flowlines: {
    title: "水平挂线（Flowlines）：让横向扫读齐平不跌宕",
    desc: "很多初学者只画竖列，忘了水平挂线。几条穿通全页的隐形横线决定了标题、图片顶沿和次级栏目的起跑高度——正如 172 原海报中腰那条蓝色虚线，让正文与点阵稳稳挂在同一水平面上。",
    css: "grid-template-rows: auto 1fr auto; align-items: start;",
  },
  zones: {
    title: "模块与空间区（Modules & Spatial Zones）：把格子拼成领地",
    desc: "列轨与水平挂线相交得到最小单元「模块」，而把相邻的几个模块合并起来（比如跨 2 列 × 2 行放主视觉蓝块），就形成了有主次大小反差的「空间区」——这就是网格既有统一性又有节奏感的关键。",
    css: ".hero-visual { grid-column: 1 / span 2; grid-row: 1 / span 2; }",
  },
};

export function initSection02() {
  const host = document.getElementById("anatomy-svg-host");
  const titleEl = document.getElementById("anat-title");
  const descEl = document.getElementById("anat-desc");
  const cssEl = document.getElementById("anat-css");
  const tabs = [...document.querySelectorAll("[data-anat]")];
  if (!host || !tabs.length) return;

  let active = "margins";

  function drawSVG(key) {
    const hiM = key === "margins";
    const hiC = key === "columns";
    const hiG = key === "gutters";
    const hiF = key === "flowlines";
    const hiZ = key === "zones";

    const cols = [56, 138, 220, 302, 384, 466];
    const cw = 66;
    const gap = 16;

    const colSvg = cols.map((cx, i) => `
      <rect x="${cx}" y="44" width="${cw}" height="248"
        fill="${hiC ? "rgba(10, 78, 192, 0.24)" : "#E4E8F0"}"
        stroke="${hiC ? "#0A4EC0" : "none"}" stroke-width="${hiC ? 1.8 : 0}"/>
      <text x="${cx + cw / 2}" y="38" text-anchor="middle" font-size="11" font-weight="700"
        fill="${hiC ? "#0A4EC0" : "#5C6678"}" font-family="IBM Plex Mono, monospace">0${i + 1}</text>
    `).join("");

    const gutterSvg = cols.slice(0, 5).map((cx) => `
      <rect x="${cx + cw}" y="44" width="${gap}" height="248"
        fill="${hiG ? "rgba(229, 62, 50, 0.32)" : "transparent"}"
        stroke="${hiG ? "#D93324" : "none"}" stroke-width="1.2"/>
    `).join("");

    const marginSvg = hiM
      ? `<path d="M0,0 H600 V338 H0 Z M56,44 V292 H532 V44 Z" fill-rule="evenodd" fill="rgba(10, 78, 192, 0.22)"/>
         <rect x="56" y="44" width="476" height="248" fill="none" stroke="#0A4EC0" stroke-width="2" stroke-dasharray="6 4"/>
         <text x="300" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="#0A4EC0" font-family="Noto Sans SC, sans-serif">上边距 · TOP MARGIN</text>
         <text x="300" y="320" text-anchor="middle" font-size="12" font-weight="700" fill="#0A4EC0" font-family="Noto Sans SC, sans-serif">下边距略宽（经验值 1.2×–1.5×）· BOTTOM MARGIN</text>`
      : `<rect x="56" y="44" width="476" height="248" fill="none" stroke="#9EAAC0" stroke-width="1" stroke-dasharray="4 4"/>`;

    const flowSvg = [44, 152, 224, 292].map((fy, idx) => `
      <line x1="${hiF ? 22 : 44}" y1="${fy}" x2="${hiF ? 578 : 544}" y2="${fy}"
        stroke="${hiF ? "#D93324" : "#3B6AC6"}" stroke-width="${hiF ? 2.4 : 1.1}" stroke-dasharray="${hiF ? "6 3" : "4 4"}"/>
      ${hiF && idx < 3 ? `<rect x="466" y="${fy - 11}" width="106" height="20" fill="#D93324"/><text x="519" y="${fy + 3}" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF" font-family="Noto Sans SC, sans-serif">${["顶沿挂线", "中腰挂线", "二行挂线"][idx]}</text>` : ""}
    `).join("");

    const zoneSvg = `
      <rect x="${cols[0]}" y="52" width="${cw * 2 + gap}" height="158"
        fill="${hiZ ? "#0A4EC0" : "rgba(10, 78, 192, 0.28)"}" stroke="${hiZ ? "#0C1016" : "none"}" stroke-width="1.5"/>
      <rect x="${cols[2]}" y="52" width="${cw * 2 + gap}" height="88"
        fill="${hiZ ? "#0C1016" : "rgba(12, 16, 22, 0.14)"}"/>
      <rect x="${cols[2]}" y="160" width="${cw * 2 + gap}" height="50"
        fill="${hiZ ? "#3D4657" : "rgba(12, 16, 22, 0.1)"}"/>
      <rect x="${cols[4]}" y="52" width="${cw * 2 + gap}" height="88"
        fill="${hiZ ? "#E53E32" : "rgba(229, 62, 50, 0.22)"}"/>
      <rect x="${cols[2]}" y="232" width="${cw}" height="52"
        fill="${hiZ ? "#D93324" : "rgba(217, 51, 36, 0.22)"}"/>
      ${hiZ ? `
        <text x="${cols[0] + cw + gap / 2}" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF" font-family="Noto Sans SC, sans-serif">空间区 A（跨 2 列×2 行）</text>
        <text x="${cols[2] + cw + gap / 2}" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFFFF" font-family="Noto Sans SC, sans-serif">标题区（2 列）</text>
        <text x="${cols[4] + cw + gap / 2}" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFFFF" font-family="Noto Sans SC, sans-serif">焦图区（2 列）</text>
      ` : ""}
    `;

    const gutterLabel = hiG
      ? `<rect x="190" y="128" width="220" height="28" fill="#D93324"/>
         <text x="300" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFFFF" font-family="Noto Sans SC, sans-serif">5 道栏距通道 · 建议 ≥ 正文行高</text>`
      : "";

    return `<svg viewBox="0 0 600 338" role="img" aria-label="网格结构解剖图">
      <rect width="600" height="338" fill="#FCF6ED" stroke="#CBD3E1"/>
      ${colSvg}
      ${gutterSvg}
      ${zoneSvg}
      ${flowSvg}
      ${marginSvg}
      ${gutterLabel}
    </svg>`;
  }

  function render() {
    const info = ANATOMY_DATA[active];
    host.innerHTML = drawSVG(active);
    titleEl.textContent = info.title;
    descEl.textContent = info.desc;
    cssEl.textContent = info.css;
    tabs.forEach((t) => {
      const on = t.dataset.anat === active;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => {
    active = t.dataset.anat;
    render();
  }));
  render();
}

// ==================== 03 整除拆解器 + 响应式断点推演 ====================
const DIVISOR_RECIPES = {
  12: [
    { name: "两等分（6+6）", spans: [6, 6], accent: [] },
    { name: "三等分（4+4+4）", spans: [4, 4, 4], accent: [] },
    { name: "四等分（3+3+3+3）", spans: [3, 3, 3, 3], accent: [] },
    { name: "经典非对称（5+7）", spans: [5, 7], accent: [0] },
    { name: "报刊主次（3+6+3）", spans: [3, 6, 3], accent: [1] },
  ],
  6: [
    { name: "两等分（3+3）", spans: [3, 3], accent: [] },
    { name: "三等分（2+2+2）", spans: [2, 2, 2], accent: [] },
    { name: "原海报 172（2+2+2）", spans: [2, 2, 1, 1], accent: [0] },
    { name: "黄金近似（4+2）", spans: [4, 2], accent: [0] },
  ],
  5: [
    { name: "强制非对称（2+3）", spans: [2, 3], accent: [1] },
    { name: "轻重三段（1+2+2）", spans: [1, 2, 2], accent: [0] },
    { name: "宽图配窄栏（4+1）", spans: [4, 1], accent: [0] },
    { name: "五列卡片（1×5）", spans: [1, 1, 1, 1, 1], accent: [] },
  ],
  4: [
    { name: "两等分（2+2）", spans: [2, 2], accent: [] },
    { name: "主文配边栏（3+1）", spans: [3, 1], accent: [0] },
    { name: "四格图录（1+1+1+1）", spans: [1, 1, 1, 1], accent: [] },
  ],
};

const BP_CONFIG = {
  desktop: {
    label: "桌面端（≥1200px）· 12 列底座",
    css: "grid-template-columns: repeat(12, 1fr); gap: 20px;",
    cols: 12,
    cards: [
      { title: "主视觉导图", span: 5, meta: "SPAN 5 / 12", red: false },
      { title: "核心专题正文", span: 5, meta: "SPAN 5 / 12", red: false },
      { title: "侧栏索引", span: 2, meta: "SPAN 2 / 12", red: true },
      { title: "延展卡片 A", span: 4, meta: "SPAN 4 / 12", red: false },
      { title: "延展卡片 B", span: 4, meta: "SPAN 4 / 12", red: false },
      { title: "延展卡片 C", span: 4, meta: "SPAN 4 / 12", red: false },
    ],
    note: "宽屏下 12 列同时容得下「5+5+2」的非对称首行与「4+4+4」的三卡次行，全页共用一套垂直轨线。",
  },
  tablet: {
    label: "平板端（768px）· 收敛为 6 列底座",
    css: "grid-template-columns: repeat(6, 1fr); gap: 16px;",
    cols: 6,
    cards: [
      { title: "主视觉导图", span: 3, meta: "SPAN 3 / 6", red: false },
      { title: "核心专题正文", span: 3, meta: "SPAN 3 / 6", red: false },
      { title: "侧栏索引（横置）", span: 6, meta: "SPAN 6 / 6", red: true },
      { title: "延展卡片 A", span: 2, meta: "SPAN 2 / 6", red: false },
      { title: "延展卡片 B", span: 2, meta: "SPAN 2 / 6", red: false },
      { title: "延展卡片 C", span: 2, meta: "SPAN 2 / 6", red: false },
    ],
    note: "列数减半到 6 列，窄侧栏顺势横跨满 6 列变成导流条，三张卡片仍保持 2+2+2 齐底，绝不挤碎行宽。",
  },
  mobile: {
    label: "手机端（390px）· 精简为 4 列底座",
    css: "grid-template-columns: repeat(4, 1fr); gap: 12px;",
    cols: 4,
    cards: [
      { title: "主视觉导图", span: 4, meta: "SPAN 4 / 4", red: false },
      { title: "核心专题正文", span: 4, meta: "SPAN 4 / 4", red: false },
      { title: "侧栏索引", span: 4, meta: "SPAN 4 / 4", red: true },
      { title: "卡片 A", span: 2, meta: "SPAN 2 / 4", red: false },
      { title: "卡片 B", span: 2, meta: "SPAN 2 / 4", red: false },
      { title: "延展卡片 C（通栏）", span: 4, meta: "SPAN 4 / 4", red: false },
    ],
    note: "手机屏宽有限，文字和主图通栏占满 4 列保持易读，轻卡片两两并排（2+2），同一份内容换一套跨度即可落地。",
  },
};

export function initSection03() {
  const matHost = document.getElementById("divisor-matrix");
  const bpStage = document.getElementById("bp-stage");
  const bpLabel = document.getElementById("bp-label");
  const bpCss = document.getElementById("bp-css");
  const bpNote = document.getElementById("bp-note");
  const divBtns = [...document.querySelectorAll("[data-div]")];
  const bpBtns = [...document.querySelectorAll("[data-bp]")];
  if (!matHost || !bpStage) return;

  let curDiv = 12;
  let curBp = "desktop";

  function renderDiv() {
    const list = DIVISOR_RECIPES[curDiv];
    matHost.innerHTML = list.map((row) => `
      <div class="div-row">
        <div class="div-row-head">
          <span>${row.name}</span>
          <strong>${curDiv} 列底座</strong>
        </div>
        <div class="div-bars" style="grid-template-columns: repeat(${curDiv}, minmax(0, 1fr))">
          ${row.spans.map((s, idx) => `
            <div class="div-bar ${row.accent.includes(idx) ? "is-accent" : ""}" style="grid-column: span ${s}">${s}列</div>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function renderBp() {
    const cfg = BP_CONFIG[curBp];
    bpLabel.textContent = cfg.label;
    bpCss.textContent = cfg.css;
    bpNote.textContent = cfg.note;
    bpStage.style.gridTemplateColumns = `repeat(${cfg.cols}, minmax(0, 1fr))`;
    bpStage.innerHTML = cfg.cards.map((c) => `
      <div class="bp-card ${c.red ? "is-red" : ""}" style="grid-column: span ${c.span}">
        <strong>${c.title}</strong>
        <span>${c.meta}</span>
      </div>
    `).join("");
  }

  divBtns.forEach((b) => b.addEventListener("click", () => {
    curDiv = Number(b.dataset.div);
    divBtns.forEach((x) => {
      const on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-pressed", String(on));
    });
    renderDiv();
  }));

  bpBtns.forEach((b) => b.addEventListener("click", () => {
    curBp = b.dataset.bp;
    bpBtns.forEach((x) => {
      const on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-pressed", String(on));
    });
    renderBp();
  }));

  renderDiv();
  renderBp();
}

// ==================== 04 历史谱系（经核实的 6 个坐标节点） ====================
const ERAS = {
  1928: {
    badge: "1928 · DIE NEUE TYPOGRAPHIE · BERLIN",
    title: "扬·奇肖尔德《新字体排印学》",
    desc: "1928 年由德国印刷工教育联盟在柏林出版。奇肖尔德系统整理了包豪斯与俄国构成主义的排版实验，反对死板的居中对称，倡导以非对称结构、无衬线体与理性纵横比例服务现代信息沟通。",
    impact: "留给今天的核心方法：放弃千篇一律的居中堆叠，靠清晰的非对称比例与留白建立阅读顺序。",
    svg: `<svg viewBox="0 0 420 260"><rect width="420" height="260" fill="#FCF6ED" stroke="#0C1016" stroke-width="1.5"/>
      <rect x="24" y="24" width="12" height="212" fill="#D93324"/>
      <rect x="52" y="24" width="344" height="10" fill="#0C1016"/>
      <text x="52" y="84" font-size="28" font-weight="900" fill="#0C1016" font-family="Chivo, sans-serif">DIE NEUE</text>
      <text x="52" y="114" font-size="28" font-weight="900" fill="#0C1016" font-family="Chivo, sans-serif">TYPOGRAPHIE</text>
      <line x1="52" y1="136" x2="396" y2="136" stroke="#0C1016" stroke-width="2"/>
      <rect x="176" y="154" width="220" height="5" fill="#0C1016"/>
      <rect x="176" y="168" width="196" height="5" fill="#3D4657"/>
      <rect x="176" y="182" width="210" height="5" fill="#3D4657"/>
      <rect x="176" y="196" width="150" height="5" fill="#3D4657"/>
      <text x="52" y="226" font-size="11" font-weight="700" fill="#D93324" font-family="IBM Plex Mono, monospace">1928 · ASYMMETRIC ORDER</text>
    </svg>`,
  },
  1958: {
    badge: "1958–1965 · NEUE GRAFIK · ZURICH (18 ISSUES)",
    title: "《新平面设计》与苏黎世四人组",
    desc: "1958 至 1965 年间在苏黎世出版共 18 期，由约瑟夫·米勒-布罗克曼、理查德·保罗·洛泽、汉斯·诺伊堡与卡洛·维瓦雷利共同创办。杂志本身以德、英、法三语并排，用严格多栏网格把客观排版推向世界。",
    impact: "留给今天的核心方法：多语种、多图文并排时，统一列轨与基线能让三种语言共享同一套节奏。",
    svg: `<svg viewBox="0 0 420 260"><rect width="420" height="260" fill="#FCF6ED" stroke="#0C1016" stroke-width="1.5"/>
      <rect x="24" y="22" width="114" height="216" fill="#E4E8F0"/>
      <rect x="153" y="22" width="114" height="216" fill="#E4E8F0"/>
      <rect x="282" y="22" width="114" height="216" fill="#E4E8F0"/>
      <text x="24" y="54" font-size="16" font-weight="900" fill="#0C1016" font-family="Chivo, sans-serif">Neue Grafik</text>
      <text x="153" y="54" font-size="16" font-weight="900" fill="#0A4EC0" font-family="Chivo, sans-serif">New Graphic</text>
      <text x="282" y="54" font-size="16" font-weight="900" fill="#D93324" font-family="Chivo, sans-serif">Graphisme</text>
      <line x1="24" y1="68" x2="396" y2="68" stroke="#0C1016" stroke-width="1.5"/>
      ${[24, 153, 282].map((x) => [84, 98, 112, 126, 140].map((y) => `<rect x="${x + 4}" y="${y}" width="102" height="3.5" fill="#0C1016"/>`).join("")).join("")}
      <rect x="24" y="162" width="243" height="66" fill="#0A4EC0"/>
      <rect x="282" y="162" width="114" height="66" fill="#0C1016"/>
    </svg>`,
  },
  1964: {
    badge: "1964 · DESIGNING PROGRAMMES · KARL GERSTNER",
    title: "卡尔·格斯特纳《设计程序》",
    desc: "瑞士设计师卡尔·格斯特纳（1930–2017）1964 年出版《设计程序》，提出「与其为单个问题做一次性方案，不如写出能生成多种解的程序」。他为德国《Capital》杂志设计的复合网格，把 1 至 6 栏多种切法嵌套在同一矩阵中。",
    impact: "留给今天的核心方法：好的网格像一套可复用的生成规则，为现代设计系统与组件库埋下思想伏笔。",
    svg: `<svg viewBox="0 0 420 260"><rect width="420" height="260" fill="#FCF6ED" stroke="#0C1016" stroke-width="1.5"/>
      ${[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3, 4, 5].map((c) =>
        `<rect x="${26 + c * 62}" y="${24 + r * 36}" width="54" height="28" fill="#DCE1ED" stroke="#3B6AC6" stroke-width="0.7"/>`
      ).join("")).join("")}
      <rect x="26" y="24" width="178" height="100" fill="rgba(10,78,192,0.82)"/>
      <rect x="212" y="24" width="178" height="64" fill="rgba(229,62,50,0.86)"/>
      <rect x="212" y="96" width="116" height="136" fill="rgba(12,16,22,0.82)"/>
      <text x="115" y="79" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF" font-family="IBM Plex Mono, monospace">3×3 UNIT</text>
      <text x="301" y="61" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF" font-family="IBM Plex Mono, monospace">3×2 UNIT</text>
    </svg>`,
  },
  1977: {
    badge: "1977–1978 · MASSIMO VIGNELLI · NPS UNIGRID",
    title: "维涅利与美国国家公园 Unigrid",
    desc: "1977 年，马西莫·维涅利受美国国家公园管理局委托开发 Unigrid，用一张母版网格、十种标准折叠与标志性的顶部黑条，统一了全美数百座公园原本五花八门的宣传折页。1978 年首发，1985 年获总统设计奖。",
    impact: "留给今天的核心方法：大规模公共信息系统靠网格消除了重复决策，让团队把精力集中在地图与内容质量上。",
    svg: `<svg viewBox="0 0 420 260"><rect width="420" height="260" fill="#FCF6ED" stroke="#0C1016" stroke-width="1.5"/>
      <rect x="20" y="20" width="380" height="44" fill="#0C1016"/>
      <text x="34" y="47" font-size="18" font-weight="900" fill="#FFFFFF" font-family="Chivo, sans-serif">UNIGRID · NATIONAL PARK</text>
      <polygon points="366,28 384,28 388,42 375,56 362,42" fill="#E53E32"/>
      ${[0, 1, 2, 3].map((i) => `<line x1="${20 + (i + 1) * 95}" y1="64" x2="${20 + (i + 1) * 95}" y2="240" stroke="#3B6AC6" stroke-dasharray="4 3"/>`).join("")}
      <rect x="28" y="74" width="174" height="156" fill="#0A4EC0"/>
      <rect x="218" y="74" width="80" height="72" fill="#DCE1ED"/>
      <rect x="312" y="74" width="80" height="72" fill="#E53E32"/>
      <rect x="218" y="158" width="174" height="5" fill="#0C1016"/>
      <rect x="218" y="172" width="164" height="5" fill="#3D4657"/>
      <rect x="218" y="186" width="170" height="5" fill="#3D4657"/>
      <rect x="218" y="200" width="130" height="5" fill="#3D4657"/>
    </svg>`,
  },
  1981: {
    badge: "1981 · RASTERSYSTEME · NIGGLI VERLAG",
    title: "米勒-布罗克曼《平面设计中的网格系统》",
    desc: "约瑟夫·米勒-布罗克曼（1914–1996）于 1981 年由瑞士 Arthur Niggli 出版社推出德英双语经典手册，手把手示范了从 8 格到 32 格的书刊、海报乃至三维展览空间建构方法，至今仍是设计学院核心教材。",
    impact: "留给今天的核心方法：列数与模块格数不是玄学，而是从正文行宽、图片比例与信息层级里算出来的。",
    svg: `<svg viewBox="0 0 420 260"><rect width="420" height="260" fill="#FCF6ED" stroke="#0C1016" stroke-width="1.5"/>
      ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) =>
        `<rect x="${28 + c * 93}" y="${24 + r * 74}" width="83" height="64" fill="#E4E8F0" stroke="#3B6AC6" stroke-dasharray="3 2"/>`
      ).join("")).join("")}
      <rect x="28" y="24" width="176" height="138" fill="#0A4EC0"/>
      <rect x="214" y="24" width="176" height="64" fill="#0C1016"/>
      <text x="302" y="61" text-anchor="middle" font-size="14" font-weight="700" fill="#FFFFFF" font-family="Chivo, sans-serif">8–32 FIELDS</text>
      <rect x="214" y="172" width="83" height="64" fill="#D93324"/>
    </svg>`,
  },
  2007: {
    badge: "2007 ELAM · 2017 W3C CSS GRID LEVEL 1",
    title: "伊拉姆八大系统与浏览器原生 CSS Grid",
    desc: "2007 年金伯利·伊拉姆在《字体排印系统》中把网格系统与其他七种文字组织法并置教学；2017 年 3 月，Firefox 52、Chrome 57、Safari 10.1 同步无前缀上线 W3C CSS Grid Layout Level 1，印刷时代的二维坐标网格正式进入原生网页引擎。",
    impact: "留给今天的核心方法：用几行原生 CSS 就能同时管住行、列、栏距与断点跨度，不再依赖浮动拼凑。",
    svg: `<svg viewBox="0 0 420 260"><rect width="420" height="260" fill="#0B1A3A" stroke="#29447A" stroke-width="1.5"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${28 + i * 62}" y1="22" x2="${28 + i * 62}" y2="238" stroke="#29447A" stroke-dasharray="4 3"/>`).join("")}
      <rect x="28" y="28" width="364" height="36" fill="#0A4EC0"/>
      <text x="40" y="51" font-size="12.5" font-weight="600" fill="#FFFFFF" font-family="IBM Plex Mono, monospace">display: grid; grid-template-columns: repeat(12, 1fr);</text>
      <rect x="28" y="78" width="176" height="152" fill="#122652" stroke="#7FB2FF" stroke-width="1.5"/>
      <rect x="216" y="78" width="176" height="70" fill="#E53E32"/>
      <rect x="216" y="160" width="82" height="70" fill="#122652" stroke="#7FB2FF" stroke-width="1.5"/>
      <rect x="310" y="160" width="82" height="70" fill="#122652" stroke="#5CE0A8" stroke-width="1.5"/>
      <text x="116" y="158" text-anchor="middle" font-size="13" font-weight="700" fill="#7FB2FF" font-family="IBM Plex Mono, monospace">1fr · AUTO</text>
      <text x="304" y="118" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF" font-family="IBM Plex Mono, monospace">2D TRACKS</text>
    </svg>`,
  },
};

export function initSection04() {
  const vis = document.getElementById("era-visual");
  const badge = document.getElementById("era-badge");
  const title = document.getElementById("era-title");
  const desc = document.getElementById("era-desc");
  const impact = document.getElementById("era-impact");
  const btns = [...document.querySelectorAll("[data-era]")];
  if (!vis || !btns.length) return;

  function render(key) {
    const e = ERAS[key];
    vis.innerHTML = e.svg;
    badge.textContent = e.badge;
    title.textContent = e.title;
    desc.textContent = e.desc;
    impact.innerHTML = `<strong>${e.impact.split("：")[0]}：</strong>${e.impact.split("：")[1]}`;
    btns.forEach((b) => {
      const on = b.dataset.era === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.era)));
  render("1928");
}

// ==================== 05 守格 vs 单点破格 vs 全员散架 ====================
const BREAK_MODES = {
  rigid: {
    tagClass: "is-warn",
    tag: "整齐但呆板（表格感）",
    title: "100% 死守并把 6 列全部塞满，秩序变成了铁笼",
    desc: "每一个模块都严丝合缝却大小雷同、填满空位，没有呼吸空白也没有视觉焦点。读者感觉像在看一张严肃的排班表，安全有余、活力不足。",
    svg: `<svg viewBox="0 0 540 336"><rect width="540" height="336" fill="#FCF6ED" stroke="#CBD3E1"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${26 + i * 82}" y="22" width="72" height="292" fill="#E4E8F0"/>`).join("")}
      ${[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) => `
        <rect x="${26 + c * 82}" y="${28 + r * 96}" width="72" height="84" fill="${(r + c) % 3 === 0 ? "#0A4EC0" : "#CBD3E1"}" stroke="#0C1016" stroke-width="0.8"/>
        <rect x="${34 + c * 82}" y="${42 + r * 96}" width="44" height="4" fill="${(r + c) % 3 === 0 ? "#FFFFFF" : "#0C1016"}"/>
        <rect x="${34 + c * 82}" y="${54 + r * 96}" width="54" height="3" fill="${(r + c) % 3 === 0 ? "rgba(255,255,255,0.75)" : "#3D4657"}"/>
      `).join("")).join("")}
    </svg>`,
  },
  controlled: {
    tagClass: "is-ok",
    tag: "秩序 + 张力兼得",
    title: "五块锁死 6 列骨架，仅朱红主圆越过第 5 列线破格而出",
    desc: "因为背景列轨、主标题、正文和底栏全部严丝合缝地守住网格，这枚唯一越线的朱红圆瞬间变成了整张海报的视觉惊叹号——读者立刻明白它是刻意强调，而不是没摆齐。",
    svg: `<svg viewBox="0 0 540 336"><rect width="540" height="336" fill="#FCF6ED" stroke="#CBD3E1"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${26 + i * 82}" y="22" width="72" height="292" fill="#E4E8F0"/>`).join("")}
      <line x1="18" y1="154" x2="522" y2="154" stroke="#3B6AC6" stroke-dasharray="4 4"/>
      <line x1="18" y1="242" x2="522" y2="242" stroke="#3B6AC6" stroke-dasharray="4 4"/>
      <rect x="26" y="34" width="154" height="196" fill="#0A4EC0"/>
      <text x="190" y="76" font-size="26" font-weight="900" fill="#0C1016" font-family="Noto Sans SC, sans-serif">秩序为底</text>
      <text x="190" y="112" font-size="26" font-weight="900" fill="#0C1016" font-family="Noto Sans SC, sans-serif">一点破格</text>
      <rect x="190" y="168" width="154" height="4" fill="#0C1016"/>
      <rect x="190" y="182" width="144" height="4" fill="#0C1016"/>
      <rect x="190" y="196" width="150" height="4" fill="#3D4657"/>
      <rect x="190" y="210" width="110" height="4" fill="#3D4657"/>
      <!-- 唯一刻意跨线出血破格的朱红主圆 -->
      <circle cx="446" cy="116" r="56" fill="#E53E32"/>
      <line x1="354" y1="22" x2="354" y2="314" stroke="#D93324" stroke-width="1.4" stroke-dasharray="3 3"/>
      <rect x="372" y="20" width="136" height="22" fill="#D93324"/>
      <text x="440" y="35" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF" font-family="Noto Sans SC, sans-serif">仅此一处主动跨线破格</text>
      <!-- 底行齐线稳托 -->
      <rect x="26" y="254" width="44" height="44" fill="#0A4EC0"/>
      <rect x="82" y="260" width="98" height="3.5" fill="#0C1016"/>
      <rect x="82" y="272" width="84" height="3.5" fill="#3D4657"/>
      <rect x="190" y="254" width="72" height="44" fill="#0C1016"/>
      <rect x="354" y="254" width="154" height="44" fill="#DCE1ED"/>
    </svg>`,
  },
  chaos: {
    tagClass: "is-warn",
    tag: "失去参照（全员散架）",
    title: "如果六块全部「破格」，就没有「格」可破",
    desc: "破格之所以有冲击力，靠的是其他元素提供的强烈秩序反差。当标题、图块、正文和红圆各自漂离列轨，观众看不到张力，只能看到一张还没来得及对齐的草稿。",
    svg: `<svg viewBox="0 0 540 336"><rect width="540" height="336" fill="#FCF6ED" stroke="#CBD3E1"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${26 + i * 82}" y="22" width="72" height="292" fill="#E4E8F0"/>`).join("")}
      <rect x="48" y="22" width="154" height="178" fill="#0A4EC0" transform="rotate(-2 125 110)"/>
      <text x="172" y="88" font-size="25" font-weight="900" fill="#0C1016" font-family="Noto Sans SC, sans-serif">秩序全丢</text>
      <text x="206" y="124" font-size="25" font-weight="900" fill="#0C1016" font-family="Noto Sans SC, sans-serif">无人参照</text>
      <rect x="224" y="180" width="154" height="4" fill="#0C1016"/>
      <rect x="202" y="196" width="144" height="4" fill="#0C1016"/>
      <rect x="234" y="212" width="136" height="4" fill="#3D4657"/>
      <circle cx="408" cy="144" r="48" fill="#E53E32" opacity="0.9"/>
      <rect x="14" y="256" width="54" height="44" fill="#0A4EC0"/>
      <rect x="158" y="274" width="84" height="42" fill="#D93324"/>
      <rect x="386" y="236" width="124" height="48" fill="#0C1016"/>
    </svg>`,
  },
};

export function initSection05() {
  const host = document.getElementById("break-svg-host");
  const tag = document.getElementById("break-tag");
  const title = document.getElementById("break-title");
  const desc = document.getElementById("break-desc");
  const btns = [...document.querySelectorAll("[data-break]")];
  if (!host || !btns.length) return;

  function render(key) {
    const m = BREAK_MODES[key];
    host.innerHTML = m.svg;
    tag.className = `break-tag ${m.tagClass}`;
    tag.textContent = m.tag;
    title.textContent = m.title;
    desc.textContent = m.desc;
    btns.forEach((b) => {
      const on = b.dataset.break === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.break)));
  render("controlled");
}

// ==================== 06 单变量视觉判断小练习（中性标签 A/B/C/D） ====================
const QUIZ_QUESTIONS = [
  {
    id: "q1",
    tag: "题 1 / 2 · 列轨对齐与栏距",
    title: "同为 6 列展览信息页，哪一版的对齐与栏距最稳？",
    correct: "B",
    options: [
      {
        key: "A",
        meta: "6列 · 变式一",
        // 齐线但栏距 2px 粘连
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          <rect x="16" y="18" width="68" height="96" fill="#0A4EC0"/>
          <rect x="86" y="18" width="68" height="36" fill="#0C1016"/>
          <rect x="86" y="60" width="68" height="4" fill="#0C1016"/>
          <rect x="86" y="70" width="66" height="4" fill="#3D4657"/>
          <rect x="86" y="80" width="68" height="4" fill="#3D4657"/>
          <rect x="86" y="90" width="54" height="4" fill="#3D4657"/>
          <circle cx="174" cy="40" r="18" fill="#E53E32"/>
          <rect x="156" y="64" width="66" height="50" fill="#DCE1ED"/>
          <rect x="16" y="128" width="68" height="34" fill="#0A4EC0"/>
          <rect x="86" y="128" width="34" height="34" fill="#D93324"/>
          <rect x="156" y="128" width="66" height="34" fill="#0C1016"/>
        </svg>`,
        reason: "方案 A 虽然齐线，但相邻图文之间几乎没有栏距，左图、中栏和右区粘在一起，扫读极易跨缝串行。",
      },
      {
        key: "B",
        meta: "6列 · 变式二",
        // 齐列齐挂线 + 合理栏距 + 留白透气（正确）
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          <rect x="16" y="18" width="62" height="92" fill="#0A4EC0"/>
          <rect x="92" y="18" width="62" height="34" fill="#0C1016"/>
          <rect x="92" y="64" width="62" height="4" fill="#0C1016"/>
          <rect x="92" y="74" width="58" height="4" fill="#3D4657"/>
          <rect x="92" y="84" width="60" height="4" fill="#3D4657"/>
          <rect x="92" y="94" width="46" height="4" fill="#3D4657"/>
          <circle cx="196" cy="36" r="17" fill="#E53E32"/>
          <rect x="168" y="64" width="56" height="46" fill="#DCE1ED"/>
          <rect x="16" y="128" width="62" height="34" fill="#0A4EC0"/>
          <rect x="92" y="128" width="28" height="34" fill="#D93324"/>
          <rect x="168" y="128" width="56" height="34" fill="#0C1016"/>
        </svg>`,
        reason: "答对了！方案 B 全部模块严格落在 6 列与三条水平挂线上，栏距宽于正文行距形成清晰走廊，且二行留出透气空白，秩序与节奏兼备。",
      },
      {
        key: "C",
        meta: "6列 · 变式三",
        // 栏距合理，但标题、正文、红块各自左右/上下错牙
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          <rect x="16" y="18" width="62" height="92" fill="#0A4EC0"/>
          <rect x="104" y="26" width="62" height="34" fill="#0C1016"/>
          <rect x="86" y="74" width="62" height="4" fill="#0C1016"/>
          <rect x="86" y="84" width="58" height="4" fill="#3D4657"/>
          <rect x="86" y="94" width="60" height="4" fill="#3D4657"/>
          <rect x="86" y="104" width="46" height="4" fill="#3D4657"/>
          <circle cx="192" cy="44" r="17" fill="#E53E32"/>
          <rect x="176" y="72" width="50" height="42" fill="#DCE1ED"/>
          <rect x="24" y="132" width="62" height="34" fill="#0A4EC0"/>
          <rect x="104" y="138" width="28" height="32" fill="#D93324"/>
          <rect x="160" y="124" width="56" height="34" fill="#0C1016"/>
        </svg>`,
        reason: "方案 C 栏距虽够宽，但标题、正文与底行各自错牙漂移，水平挂线和纵列轴全断了，视觉上反复打断扫读节奏。",
      },
      {
        key: "D",
        meta: "6列 · 变式四",
        // 全部等宽等高 1×1 均分塞满
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          ${[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) => `
            <rect x="${16 + c * 35}" y="${18 + r * 50}" width="29" height="42" fill="${(r + c) % 3 === 0 ? "#0A4EC0" : (r + c) % 4 === 0 ? "#D93324" : "#CBD3E1"}"/>
          `).join("")).join("")}
        </svg>`,
        reason: "方案 D 虽然完全贴齐网格，但把所有内容强行压进 18 个一模一样的小格子，既没有主次大小反差也没有留白呼吸，退化成了呆板表格。",
      },
    ],
  },
  {
    id: "q2",
    tag: "题 2 / 2 · 有节制的破格",
    title: "在已建好 6 列网格的海报里，哪一版「破格」最有张力且不散架？",
    correct: "B",
    options: [
      {
        key: "A",
        meta: "破格 · 变式一",
        // 全员微偏离轨
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          <rect x="26" y="12" width="62" height="90" fill="#0A4EC0"/>
          <rect x="106" y="28" width="62" height="30" fill="#0C1016"/>
          <rect x="84" y="70" width="62" height="4" fill="#0C1016"/>
          <rect x="96" y="82" width="58" height="4" fill="#3D4657"/>
          <circle cx="192" cy="54" r="22" fill="#E53E32"/>
          <rect x="10" y="130" width="62" height="32" fill="#0A4EC0"/>
          <rect x="108" y="140" width="44" height="28" fill="#0C1016"/>
        </svg>`,
        reason: "方案 A 里几乎每一块都歪离了列轨，没有留下足够稳固的秩序参照，观众只会觉得排版粗心，看不出破格意图。",
      },
      {
        key: "B",
        meta: "破格 · 变式二",
        // 5块锁死6列，仅主红圆跨越列轨破格而出（正确）
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          <rect x="16" y="18" width="62" height="92" fill="#0A4EC0"/>
          <rect x="92" y="18" width="62" height="34" fill="#0C1016"/>
          <rect x="92" y="64" width="62" height="4" fill="#0C1016"/>
          <rect x="92" y="74" width="58" height="4" fill="#3D4657"/>
          <rect x="92" y="84" width="60" height="4" fill="#3D4657"/>
          <circle cx="192" cy="60" r="32" fill="#E53E32"/>
          <rect x="16" y="128" width="62" height="34" fill="#0A4EC0"/>
          <rect x="92" y="128" width="62" height="34" fill="#0C1016"/>
          <rect x="168" y="128" width="56" height="34" fill="#DCE1ED"/>
        </svg>`,
        reason: "答对了！方案 B 让蓝块、标题、正文和底栏全部严丝合缝锁死 6 列骨架，只放任唯一的朱红大圆跨线破格——秩序托住了焦点，破格才显得刻意而有力。",
      },
      {
        key: "C",
        meta: "破格 · 变式三",
        // 零破格且把留白全填满
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          <rect x="16" y="18" width="62" height="92" fill="#0A4EC0"/>
          <rect x="92" y="18" width="62" height="34" fill="#0C1016"/>
          <rect x="92" y="64" width="62" height="46" fill="#CBD3E1"/>
          <rect x="168" y="18" width="56" height="92" fill="#CBD3E1"/>
          <rect x="16" y="128" width="62" height="34" fill="#0A4EC0"/>
          <rect x="92" y="128" width="62" height="34" fill="#0C1016"/>
          <rect x="168" y="128" width="56" height="34" fill="#CBD3E1"/>
        </svg>`,
        reason: "方案 C 没有破格，反而把所有空位都用灰块塞满，全页平淡无高潮。",
      },
      {
        key: "D",
        meta: "破格 · 变式四",
        // 仅红圆守格，标题与正文全部斜散乱飞
        svg: `<svg viewBox="0 0 240 180"><rect width="240" height="180" fill="#FCF6ED"/>
          <rect x="20" y="26" width="60" height="82" fill="#0A4EC0" transform="rotate(8 50 67)"/>
          <rect x="86" y="24" width="68" height="28" fill="#0C1016" transform="rotate(-11 120 38)"/>
          <rect x="88" y="80" width="66" height="4" fill="#0C1016" transform="rotate(6 121 82)"/>
          <rect x="90" y="94" width="58" height="4" fill="#3D4657" transform="rotate(-7 119 96)"/>
          <circle cx="196" cy="40" r="16" fill="#E53E32"/>
          <rect x="28" y="128" width="64" height="30" fill="#0C1016" transform="rotate(-5 60 143)"/>
        </svg>`,
        reason: "方案 D 颠倒了主次：用来阅读的正文和标题全都斜散脱离骨架，只把一颗装饰圆留在网格里，整页立刻失去可读秩序。",
      },
    ],
  },
];

export function initSection06() {
  const host = document.getElementById("quiz-shell");
  if (!host) return;

  const picked = {};

  function render() {
    host.innerHTML = QUIZ_QUESTIONS.map((q) => {
      const choice = picked[q.id];
      const chosenOpt = choice ? q.options.find((o) => o.key === choice) : null;
      const isRight = choice === q.correct;

      return `<article class="quiz-card" data-qid="${q.id}">
        <div class="quiz-q-head">
          <h3 class="quiz-q-title">${q.title}</h3>
          <span class="quiz-q-tag">${q.tag}</span>
        </div>
        <div class="quiz-opts" role="group" aria-label="${q.title}">
          ${q.options.map((o) => {
            let cls = "quiz-opt";
            if (choice === o.key) cls += o.key === q.correct ? " is-picked-ok" : " is-picked-err";
            return `<button type="button" class="${cls}" data-quiz="${q.id}" data-opt="${o.key}" aria-pressed="${choice === o.key}">
              <div class="quiz-opt-svg" aria-hidden="true">${o.svg}</div>
              <div class="quiz-opt-label">
                <span>方案 ${o.key}</span>
                <span>${o.meta}</span>
              </div>
            </button>`;
          }).join("")}
        </div>
        ${chosenOpt ? `<div class="quiz-feedback ${isRight ? "is-ok" : "is-err"}" role="status">
          <strong>${isRight ? "✓ 选对了（方案 " + choice + "）" : "× 再看看（已选方案 " + choice + "）"}：</strong>${chosenOpt.reason}
        </div>` : ""}
      </article>`;
    }).join("");

    host.querySelectorAll("[data-quiz]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[btn.dataset.quiz] = btn.dataset.opt;
        render();
      });
    });
  }

  render();
}

// ==================== 07 原海报灯箱（缩放 + 拖动 + Esc 关闭） ====================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const vp = document.getElementById("lb-viewport");
  const scaleOut = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!openBtn || !lb || !lbImg || !posterImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleOut.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3, scale + 0.3); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.6, scale - 0.3); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3, scale + (e.deltaY < 0 ? 0.16 : -0.16)));
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp) {
      close();
      return;
    }
    pan = { sx: e.clientX - tx, sy: e.clientY - ty };
    vp.classList.add("is-panning");
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - pan.sx;
    ty = e.clientY - pan.sy;
    applyTransform();
  });
  vp.addEventListener("pointerup", () => { pan = null; vp.classList.remove("is-panning"); });
  vp.addEventListener("pointercancel", () => { pan = null; vp.classList.remove("is-panning"); });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
