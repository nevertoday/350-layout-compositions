// 219 正文七节的独立交互模块（每节控件各不相同，不重复套用）

// =========================================================================
// 01 节：字格剖视切换器（左缘硬齐 vs 字框居中 vs 光学中轴）
// =========================================================================
export function initSection01() {
  const root = document.getElementById("sec01-demo");
  if (!root) return;
  const svg = root.querySelector("#s01-svg");
  const readout = root.querySelector("#s01-readout");
  const modeBtns = [...root.querySelectorAll("[data-align-mode]")];
  const gridBtn = root.querySelector("#s01-grid-toggle");

  let mode = "left"; // "left" | "box" | "optical"
  let showGrid = true;

  const LETTERS = [
    { ch: "W", w: 36, optShift: 0 },
    { ch: "I", w: 10, optShift: 0 },
    { ch: "M", w: 33, optShift: 0 },
    { ch: "L", w: 22, optShift: 3.5 }, // L 的视觉重心偏左，光学居中需右移微调
    { ch: "O", w: 30, optShift: 0 },
    { ch: "T", w: 25, optShift: 0 },
  ];
  const CJK = ["纵", "向", "中", "轴", "对", "准"];

  const COPY = {
    left: {
      title: "左缘硬齐：窄字母 I 缩在左墙，视觉中轴扯出 13px 锯齿",
      desc: "宽字母 W（36px）与窄字母 I（10px）共享同一条左边界，导致两者的中心横坐标相差整整 13px。眼睛沿着列往下扫时，视线被迫左右大幅来回跳动。",
    },
    box: {
      title: "几何字框居中：收住绝大多数宽窄差，仅不对称字 L 略偏左",
      desc: "把每个字母的水平中心钉在同一条纵向铅垂线上，W、I、M、O、T 瞬间站成一根直线。但像 L、P、F 这样笔画偏向一侧的字母，几何框居中时视觉重心仍会微偏约 2–3px。",
    },
    optical: {
      title: "光学中轴 + 顶底锚定：笔画重心全部收进一条铅垂线",
      desc: "在几何居中的基础上，把 L 这类左重字母向反方向微调 2–4px，同时把西文列顶线、底线与左侧中文方块和底部奶油锚点锁平——这就是原海报看起来稳如石碑的真正原因。",
    },
  };

  function render() {
    const railL = 166;
    const railR = 234;
    const railCx = (railL + railR) * 0.5;
    const startY = 34;
    const step = 44;

    const pts = [];
    let glyphsMarkup = "";

    for (let i = 0; i < LETTERS.length; i++) {
      const l = LETTERS[i];
      const cy = startY + i * step + 18;
      let gx;
      if (mode === "left") gx = railL + 8 + l.w * 0.5;
      else if (mode === "box") gx = railCx;
      else gx = railCx + l.optShift;

      pts.push({ x: gx, y: cy });

      const boxX = gx - l.w * 0.5;
      const boxY = cy - 15;
      const isJagged = mode === "left" && (l.ch === "I" || l.ch === "L");
      const boxColor = isJagged ? "#9E2A20" : "#185A37";

      if (showGrid) {
        glyphsMarkup += `<rect x="${boxX.toFixed(1)}" y="${boxY.toFixed(1)}" width="${l.w}" height="30" fill="${isJagged ? "rgba(158,42,32,0.12)" : "rgba(24,90,55,0.08)"}" stroke="${boxColor}" stroke-width="0.9" stroke-dasharray="2.5 2"/>`;
        glyphsMarkup += `<circle cx="${gx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2" fill="${boxColor}"/>`;
      }
      glyphsMarkup += `<text x="${gx.toFixed(1)}" y="${(cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Outfit, sans-serif" font-weight="600" font-size="23" fill="${isJagged ? "#9E2A20" : "#111512"}">${l.ch}</text>`;
    }

    let cjkMarkup = "";
    for (let i = 0; i < CJK.length; i++) {
      const cy = startY + i * step + 18;
      if (showGrid) {
        cjkMarkup += `<rect x="74" y="${(cy - 18).toFixed(1)}" width="36" height="36" fill="none" stroke="rgba(17,21,18,0.22)" stroke-width="0.9" stroke-dasharray="2.5 2.5"/>`;
      }
      cjkMarkup += `<text x="92" y="${(cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="28" fill="#111512">${CJK[i]}</text>`;
    }

    const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const spineColor = mode === "left" ? "#9E2A20" : "#185A37";
    const endY = startY + LETTERS.length * step - 6;

    svg.innerHTML = `
      <rect x="0" y="0" width="320" height="328" fill="#A8B490"/>
      <!-- 顶底齐平线 -->
      <line x1="52" y1="${startY - 2}" x2="294" y2="${startY - 2}" stroke="#111512" stroke-opacity="0.55" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="52" y1="${endY}" x2="294" y2="${endY}" stroke="#111512" stroke-opacity="0.55" stroke-width="1" stroke-dasharray="3 3"/>
      <!-- 竖轨 -->
      <line x1="66" y1="${startY - 2}" x2="66" y2="${endY}" stroke="#111512" stroke-opacity="0.45" stroke-width="1"/>
      <line x1="118" y1="${startY - 2}" x2="118" y2="${endY}" stroke="#111512" stroke-opacity="0.45" stroke-width="1"/>
      <line x1="${railL}" y1="${startY - 2}" x2="${railL}" y2="${endY}" stroke="#111512" stroke-opacity="0.45" stroke-width="1"/>
      <line x1="${railR}" y1="${startY - 2}" x2="${railR}" y2="${endY}" stroke="#111512" stroke-opacity="0.45" stroke-width="1"/>
      <!-- 右侧暖奶油参照主轴 -->
      <rect x="262" y="${startY - 2}" width="20" height="${endY - startY - 26}" fill="#F7EACB"/>
      <rect x="262" y="${endY - 20}" width="20" height="20" fill="#F7EACB"/>
      <!-- 理想铅垂线 -->
      ${showGrid ? `<line x1="92" y1="16" x2="92" y2="310" stroke="#111512" stroke-opacity="0.22" stroke-dasharray="4 3"/>` : ""}
      ${showGrid ? `<line x1="${railCx}" y1="16" x2="${railCx}" y2="310" stroke="#111512" stroke-opacity="0.32" stroke-dasharray="4 3"/>` : ""}
      <!-- 实测中轴折线 -->
      ${showGrid ? `<polyline points="${poly}" fill="none" stroke="${spineColor}" stroke-width="1.8"/>` : ""}
      ${cjkMarkup}
      ${glyphsMarkup}
      <text x="92" y="18" text-anchor="middle" font-family="Archivo, Noto Sans SC, sans-serif" font-size="10.5" font-weight="700" fill="#111512">中文中轴</text>
      <text x="${railCx}" y="18" text-anchor="middle" font-family="Archivo, Noto Sans SC, sans-serif" font-size="10.5" font-weight="700" fill="${spineColor}">${mode === "left" ? "偏左锯齿" : mode === "box" ? "字框居中" : "光学中轴"}</text>
      <text x="160" y="316" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="10.5" font-weight="600" fill="#262F23">最大中轴偏移：${mode === "left" ? "13px（严重锯齿）" : mode === "box" ? "约 2.5px（L 微偏）" : "≤ 0.5px（铅垂笔直）"}</text>
    `;

    readout.innerHTML = `<strong>${COPY[mode].title}</strong><p>${COPY[mode].desc}</p>`;
    for (const b of modeBtns) {
      const on = b.dataset.alignMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    gridBtn.textContent = showGrid ? "辅助字格：开" : "辅助字格：关";
    gridBtn.setAttribute("aria-pressed", String(showGrid));
  }

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      mode = b.dataset.alignMode;
      render();
    });
  }
  gridBtn.addEventListener("click", () => {
    showGrid = !showGrid;
    render();
  });
  render();
}

// =========================================================================
// 02 节：大小写 × 字体风格 × 步距节奏试验台
// =========================================================================
export function initSection02() {
  const root = document.getElementById("sec02-demo");
  if (!root) return;
  const svg = root.querySelector("#s02-svg");
  const slider = root.querySelector("#s02-step");
  const stepVal = root.querySelector("#s02-step-val");
  const verdict = root.querySelector("#s02-verdict");
  const caseBtns = [...root.querySelectorAll("[data-s02-case]")];
  const fontBtns = [...root.querySelectorAll("[data-s02-font]")];

  let letterCase = "lower"; // 开场故意先看反面「小写」，点一下切大写立马震撼对比
  let fontKind = "sans";    // "sans" (Outfit) | "serif" (Libre Baskerville)
  let stepRatio = 1.24;

  const WORD = "TYPOGRAPHY";
  const ASC = new Set(["h", "t", "l", "b", "d", "f", "k"]);
  const DESC = new Set(["y", "p", "g", "q", "j"]);

  function render() {
    const capH = 22;
    const pitch = capH * stepRatio;
    const chars = [...(letterCase === "upper" ? WORD.toUpperCase() : WORD.toLowerCase())];
    const svgH = Math.max(330, Math.round(44 + chars.length * pitch + 20));
    svg.setAttribute("viewBox", `0 0 360 ${svgH}`);

    const family = fontKind === "sans" ? "Outfit, sans-serif" : "Libre Baskerville, serif";
    const weight = fontKind === "sans" ? "600" : "700";

    // 计算每个字的实际视觉上下沿，真实检出升降部碰撞与间距方差
    const items = [];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const y0 = 32 + i * pitch;
      const isLow = letterCase === "lower";
      const asc = isLow && ASC.has(ch);
      const desc = isLow && DESC.has(ch);
      const top = y0 + (isLow ? (asc ? -1 : capH * 0.30) : 0);
      const bot = y0 + capH + (desc ? capH * 0.34 : 0);
      items.push({ ch, y0, cy: y0 + capH * 0.52, top, bot, asc, desc });
    }

    let minGap = Infinity;
    let maxGap = -Infinity;
    let collideCount = 0;
    const gapBars = [];
    for (let i = 0; i < items.length - 1; i++) {
      const gap = items[i + 1].top - items[i].bot;
      if (gap < minGap) minGap = gap;
      if (gap > maxGap) maxGap = gap;
      if (gap < 2.2) collideCount++;
      gapBars.push({ y1: items[i].bot, y2: items[i + 1].top, gap });
    }
    const variance = Math.max(0, maxGap - minGap);

    let markup = `<rect x="0" y="0" width="360" height="${svgH}" fill="#FAF5E8"/>`;
    // 左侧对比：大写理想柱参考轮廓（极淡）
    markup += `<rect x="34" y="24" width="118" height="${svgH - 40}" fill="#EDF1E5" stroke="#566348" stroke-opacity="0.35"/>`;
    markup += `<line x1="93" y1="24" x2="93" y2="${svgH - 16}" stroke="#566348" stroke-opacity="0.35" stroke-dasharray="3 3"/>`;

    // 右侧留白间隙条形图（直观显示每对字母之间的实际留白是否等宽！）
    markup += `<text x="250" y="22" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700" fill="#262F23">实测相邻字间空隙（px）</text>`;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const warn = it.asc || it.desc;
      markup += `<rect x="64" y="${it.top.toFixed(1)}" width="58" height="${(it.bot - it.top).toFixed(1)}" fill="${warn ? "rgba(158,42,32,0.13)" : "rgba(24,90,55,0.08)"}" stroke="${warn ? "#9E2A20" : "#566348"}" stroke-width="0.8" stroke-dasharray="2 2"/>`;
      markup += `<text x="93" y="${it.cy.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="${family}" font-weight="${weight}" font-size="${fontKind === "serif" ? 23 : 24}" fill="${warn ? "#9E2A20" : "#111512"}">${it.ch}</text>`;
    }

    for (let i = 0; i < gapBars.length; i++) {
      const g = gapBars[i];
      const midY = (g.y1 + g.y2) * 0.5;
      const clampedW = Math.max(4, Math.min(130, Math.max(0, g.gap) * 5.2));
      const bad = g.gap < 2.2 || g.gap > 20 || (letterCase === "lower" && Math.abs(g.gap - (minGap + maxGap) * 0.5) > 4);
      markup += `<line x1="158" y1="${midY.toFixed(1)}" x2="178" y2="${midY.toFixed(1)}" stroke="#566348" stroke-opacity="0.35"/>`;
      markup += `<rect x="180" y="${(midY - 5).toFixed(1)}" width="${clampedW.toFixed(1)}" height="10" fill="${bad ? "#9E2A20" : "#185A37"}"/>`;
      markup += `<text x="${(186 + clampedW).toFixed(1)}" y="${midY.toFixed(1)}" dominant-baseline="central" font-family="Archivo, sans-serif" font-size="10.5" font-weight="700" fill="${bad ? "#9E2A20" : "#185A37"}">${g.gap.toFixed(1)}px</text>`;
    }

    svg.innerHTML = markup;
    stepVal.textContent = `${stepRatio.toFixed(2)}×`;

    let msg;
    if (letterCase === "lower") {
      msg = `小写叠排：y/p/g 下伸部与 t/h 上伸部打破统一字高，字间净距在 ${minGap.toFixed(1)}px 到 ${maxGap.toFixed(1)}px 之间剧烈跳动（极差 ${variance.toFixed(1)}px${collideCount ? `，已有 ${collideCount} 处贴撞` : ""}）。右侧绿色/红色条形长度一眼就能看出节奏失稳。`;
    } else if (stepRatio < 1.15) {
      msg = `全大写但步距过紧（${stepRatio.toFixed(2)}×）：虽然所有字高一致（极差 0.0px），但上下字净距仅 ${minGap.toFixed(1)}px，字母快要叠到一起，需要拉到 1.24×–1.55×。`;
    } else if (stepRatio > 1.65) {
      msg = `全大写但步距过疏（${stepRatio.toFixed(2)}×）：净距高达 ${minGap.toFixed(1)}px，快比字母本身还高，眼睛很难再把 T-Y-P-O 读成一个词。`;
    } else if (fontKind === "serif") {
      msg = `全大写 + 经典衬线体：字间净距完全一致（${minGap.toFixed(1)}px，极差 0.0px），但衬线体的尖锐横脚与粗细反差让边缘更华丽、略显精致装饰感；若追求原海报那种理性建筑稳重感，可切回几何无衬线体对比。`;
    } else {
      msg = `全大写 + 几何无衬线（理想态）：所有字母齐顶齐底，每一格净距恒定 ${minGap.toFixed(1)}px（方差 0.0px），右侧空隙条完全齐平——这正是直立西文能和汉字方块并立的结构前提。`;
    }
    verdict.textContent = msg;

    for (const b of caseBtns) {
      const on = b.dataset.s02Case === letterCase;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of fontBtns) {
      const on = b.dataset.s02Font === fontKind;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  for (const b of caseBtns) b.addEventListener("click", () => { letterCase = b.dataset.s02Case; render(); });
  for (const b of fontBtns) b.addEventListener("click", () => { fontKind = b.dataset.s02Font; render(); });
  slider.addEventListener("input", () => { stepRatio = parseFloat(slider.value); render(); });
  render();
}

// =========================================================================
// 03 节：历史标准时间轴 + 真实浏览器 CSS Writing Modes 实码对照台
// =========================================================================
export function initSection03() {
  const root = document.getElementById("sec03-demo");
  if (!root) return;
  const milBtns = [...root.querySelectorAll("[data-era]")];
  const milTitle = root.querySelector("#s03-era-title");
  const milBody = root.querySelector("#s03-era-body");
  const milRef = root.querySelector("#s03-era-ref");

  const cssBtns = [...root.querySelectorAll("[data-css-orient]")];
  const trackSlider = root.querySelector("#s03-tracking");
  const trackVal = root.querySelector("#s03-tracking-val");
  const liveBox = root.querySelector("#s03-live-css");
  const codeEl = root.querySelector("#s03-code");

  const ERAS = {
    "1995": {
      title: "1995 / 2004 · JIS X 4051 把竖排混排写进国家标准",
      body: "日本工业标准 JIS X 4051 在 1993 年初版先规范了横排，1995 年第二版正式纳入纵组（竖排）规矩，2004 年 3 月第三版系统整理了竖排西文与数字的三种排法：逐字直立（用于单字与短大写缩写）、顺转 90° 横组（用于长词句）以及纵中横（2–3 位数字横排入格）。",
      ref: "标准依据：JIS X 4051:1995 / JIS X 4051:2004（《日本語文書の組版方法》）",
    },
    "2009": {
      title: "2009 / 2012 / 2020 · W3C JLReq 将传统纵组带入 Web",
      body: "W3C 于 2009 年 6 月 4 日发布《日文排版需求》（JLReq）首版 Working Group Note，2012 年更新二版、2020 年再次修订。它向浏览器引擎说明了东亚竖排何时需要让单字母、首字母缩写以正立姿态落进方块字格，而不是一律粗暴侧转。",
      ref: "核实出处：W3C Requirements for Japanese Text Layout（w3.org/TR/jlreq/）",
    },
    "2015": {
      title: "2015 · W3C CLReq《中文排版需求》首份公开草案",
      body: "2015 年 7 月 23 日，W3C 中文排版需求任务组发布 CLReq 首份公开工作草案，面向简繁体中文网页与电子书，系统梳理了直排中嵌入拉丁缩写、数字与标点时的直立、转向与纵中横规则。",
      ref: "核实出处：W3C Requirements for Chinese Text Layout（w3.org/TR/clreq/）",
    },
    "2017": {
      title: "2017 · Unicode UAX #50 正式并入 Unicode 10.0 字符库",
      body: "由 Eric Muller、Koji Ishii、Ken Lunde 等人推进的 Unicode 标准附件 UAX #50 定义了 Vertical_Orientation 属性（U 直立、R 侧转、Tu/Tr 需竖排字形替换），并于 2017 年随 Unicode 10.0 纳入 UCD——从此不同操作系统对「默认谁站着、谁躺着」有了统一真源。",
      ref: "核实出处：Unicode Standard Annex #50（unicode.org/reports/tr50/）",
    },
    "2019": {
      title: "2019-12-10 · W3C CSS Writing Modes Level 3 正式推荐标准",
      body: "由 Elika J. Etemad 与 Koji Ishii 编辑的 CSS Writing Modes Level 3 成为 W3C 正式推荐标准。只需两行声明（writing-mode: vertical-rl 与 text-orientation: upright），现代浏览器就能原生渲染「直排中西文直立」，不再依赖手动换行拼字符。",
      ref: "核实出处：W3C CSS Writing Modes Level 3 Recommendation（w3.org/TR/css-writing-modes-3/）",
    },
  };

  let curEra = "2019";
  let orient = "upright";
  let tracking = 0.14;

  function renderEra() {
    const e = ERAS[curEra];
    milTitle.textContent = e.title;
    milBody.textContent = e.body;
    milRef.textContent = e.ref;
    for (const b of milBtns) {
      const on = b.dataset.era === curEra;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  function renderCss() {
    liveBox.style.textOrientation = orient;
    liveBox.style.letterSpacing = `${tracking.toFixed(2)}em`;
    trackVal.textContent = `${tracking.toFixed(2)}em`;
    codeEl.textContent = `writing-mode: vertical-rl;\ntext-orientation: ${orient};\nletter-spacing: ${tracking.toFixed(2)}em;`;
    for (const b of cssBtns) {
      const on = b.dataset.cssOrient === orient;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  for (const b of milBtns) b.addEventListener("click", () => { curEra = b.dataset.era; renderEra(); });
  for (const b of cssBtns) b.addEventListener("click", () => { orient = b.dataset.cssOrient; renderCss(); });
  trackSlider.addEventListener("input", () => { tracking = parseFloat(trackSlider.value); renderCss(); });
  renderEra();
  renderCss();
}

// =========================================================================
// 04 节：真实载体切页预览（精装书脊 / 茶罐竖签 / 展厅立柱）× 双轨/同列切换
// =========================================================================
export function initSection04() {
  const root = document.getElementById("sec04-demo");
  if (!root) return;
  const svg = root.querySelector("#s04-svg");
  const note = root.querySelector("#s04-note");
  const carrierBtns = [...root.querySelectorAll("[data-carrier]")];
  const layoutBtns = [...root.querySelectorAll("[data-s04-layout]")];
  const anchorToggle = root.querySelector("#s04-anchor");

  let carrier = "spine"; // "spine" | "tin" | "pillar"
  let layoutMode = "single"; // "single" | "twin"
  let showAnchor = true;

  const CARRIERS = {
    spine: {
      name: "精装书脊（24mm 窄宽）",
      cjk: ["建", "筑", "秩", "序"],
      latin: ["A", "R", "C", "H", "•", "0", "4"],
      bg: "#242E23",
      fg: "#F7EACB",
      accent: "#A8B490",
      singleNote: "24mm 窄书脊几乎放不下两列并行文字。用「同列直立混排」把汉字、短缩写 ARCH 与卷号 04 串在同一中轴上，摆上书架远看一眼立得住。",
      twinNote: "在 24mm 窄书脊里硬塞「双轨并置」，两列字号被迫砍半，互相挤占边白，远看容易糊成一片。窄长物理载体通常优先选同列直立。",
    },
    tin: {
      name: "茶罐立面竖签（52mm 贴纸）",
      cjk: ["白", "毫", "银", "针"],
      latin: ["T", "E", "A", "•", "N", "O", ".", "8"],
      bg: "#F7EACB",
      fg: "#111512",
      accent: "#A8B490",
      singleNote: "茶罐贴纸宽裕时用同列混排显得克制清雅，但中英文总高拉长，需要留意罐身高度别把底脚推到卷边弧面上。",
      twinNote: "52mm 茶罐竖签正好适合「双轨并置」：左侧大汉字撑品名，右侧细直立大写英文补国际识别，底部一颗色块锚点把两列钉成一个礼盒视觉符号。",
    },
    pillar: {
      name: "美术馆展厅立柱导视",
      cjk: ["东", "亚", "字", "体", "展"],
      latin: ["T", "Y", "P", "E", "•", "L", "A", "B"],
      bg: "#A8B490",
      fg: "#111512",
      accent: "#F7EACB",
      singleNote: "展厅立柱细长高耸，同列直立能把标题推到 2 米以上的远距视高，观众在走廊尽头不用歪头即可从上往下读完中英文。",
      twinNote: "宽面立柱采用「双轨并置」最像 219 原海报本身：中文主列 + 直立英文副列 + 实心奶油锚点，既有建筑纪念碑气质，又把双语层级分得清清楚楚。",
    },
  };

  function render() {
    const c = CARRIERS[carrier];
    const isTwin = layoutMode === "twin";
    const cardW = carrier === "spine" ? 96 : carrier === "tin" ? 156 : 186;
    const cardX = (360 - cardW) * 0.5;
    const cardY = 22;
    const cardH = 316;

    let inner = "";
    if (isTwin) {
      const cjkX = cardX + cardW * 0.36;
      const latX = cardX + cardW * 0.68;
      const cjkSize = carrier === "spine" ? 19 : 28;
      const latSize = carrier === "spine" ? 11 : 14.5;
      const cjkStep = (cardH - (showAnchor ? 76 : 44)) / c.cjk.length;
      const latStep = (cardH - (showAnchor ? 52 : 44)) / c.latin.length;

      inner += `<line x1="${(cardX + cardW * 0.53).toFixed(1)}" y1="${cardY + 18}" x2="${(cardX + cardW * 0.53).toFixed(1)}" y2="${cardY + cardH - 22}" stroke="${c.fg}" stroke-opacity="0.32" stroke-dasharray="2.5 2.5"/>`;
      c.cjk.forEach((ch, i) => {
        inner += `<text x="${cjkX.toFixed(1)}" y="${(cardY + 34 + i * cjkStep).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="${cjkSize}" fill="${c.fg}">${ch}</text>`;
      });
      c.latin.forEach((ch, i) => {
        inner += `<text x="${latX.toFixed(1)}" y="${(cardY + 30 + i * latStep).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Outfit, sans-serif" font-weight="600" font-size="${latSize}" fill="${c.fg}">${ch}</text>`;
      });
      if (showAnchor) {
        const s = carrier === "spine" ? 14 : 20;
        inner += `<rect x="${(cjkX - s * 0.5).toFixed(1)}" y="${cardY + cardH - 24 - s}" width="${s}" height="${s}" fill="${c.accent}"/>`;
      }
    } else {
      const cx = cardX + cardW * 0.5;
      const all = [...c.cjk, "•", ...c.latin];
      const step = (cardH - (showAnchor ? 66 : 40)) / all.length;
      all.forEach((ch, i) => {
        const isCjk = /[\u4e00-\u9fff]/.test(ch);
        const fz = isCjk ? (carrier === "spine" ? 20 : 22) : (ch === "•" ? 12 : 14);
        inner += `<text x="${cx}" y="${(cardY + 26 + i * step).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="${isCjk ? "Noto Sans SC, sans-serif" : "Outfit, sans-serif"}" font-weight="${isCjk ? 900 : 600}" font-size="${fz}" fill="${c.fg}">${ch}</text>`;
      });
      if (showAnchor) {
        const s = 16;
        inner += `<rect x="${cx - s * 0.5}" y="${cardY + cardH - 22 - s}" width="${s}" height="${s}" fill="${c.accent}"/>`;
      }
    }

    // 物理载体微立体边线
    const frameExtra = carrier === "spine"
      ? `<rect x="${cardX - 18}" y="${cardY + 6}" width="18" height="${cardH - 12}" fill="#171E16" opacity="0.35"/><rect x="${cardX + cardW}" y="${cardY + 6}" width="10" height="${cardH - 12}" fill="#171E16" opacity="0.22"/>`
      : carrier === "tin"
        ? `<rect x="${cardX - 28}" y="${cardY - 8}" width="${cardW + 56}" height="${cardH + 16}" rx="6" fill="#262F23" opacity="0.16"/>`
        : `<line x1="${cardX - 14}" y1="0" x2="${cardX - 14}" y2="360" stroke="#566348" stroke-opacity="0.35"/><line x1="${cardX + cardW + 14}" y1="0" x2="${cardX + cardW + 14}" y2="360" stroke="#566348" stroke-opacity="0.35"/>`;

    svg.innerHTML = `
      <rect x="0" y="0" width="360" height="360" fill="#EDF1E5"/>
      ${frameExtra}
      <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" fill="${c.bg}" stroke="#111512" stroke-opacity="0.28"/>
      ${inner}
      <text x="180" y="352" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600" fill="#262F23">${c.name} · ${isTwin ? "双轨并置" : "同列直立"}${showAnchor ? " · 含底锚" : " · 无底锚"}</text>
    `;

    note.textContent = (isTwin ? c.twinNote : c.singleNote) + (showAnchor ? " 底部的方形视觉锚点稳稳截住向下视线，形成收口。" : " 拿掉底部视觉锚点后，竖列的收尾感明显变轻，视觉重心略有下坠。");

    for (const b of carrierBtns) {
      const on = b.dataset.carrier === carrier;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of layoutBtns) {
      const on = b.dataset.s04Layout === layoutMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    anchorToggle.textContent = showAnchor ? "底部视觉锚点：开" : "底部视觉锚点：关";
    anchorToggle.setAttribute("aria-pressed", String(showAnchor));
  }

  for (const b of carrierBtns) b.addEventListener("click", () => { carrier = b.dataset.carrier; render(); });
  for (const b of layoutBtns) b.addEventListener("click", () => { layoutMode = b.dataset.s04Layout; render(); });
  anchorToggle.addEventListener("click", () => { showAnchor = !showAnchor; render(); });
  render();
}

// =========================================================================
// 05 节：英文词长崩塌压力测试（2 字母 → 34 字母长句）
// =========================================================================
export function initSection05() {
  const root = document.getElementById("sec05-demo");
  if (!root) return;
  const slider = root.querySelector("#s05-len");
  const labelEl = root.querySelector("#s05-len-label");
  const stage = root.querySelector("#s05-stage");
  const statusEl = root.querySelector("#s05-status");
  const meterFill = root.querySelector("#s05-meter-fill");
  const meterText = root.querySelector("#s05-meter-text");

  const SAMPLES = [
    {
      len: 2,
      text: "AI",
      level: "理想区间（1–3 字）",
      cls: "good",
      pct: 18,
      advice: "2 个大写字母直立叠放，高度不到两个汉字，眼睛一瞥即识，完全不需要歪头——这正是直排直立最省力的甜区（经验值）。",
    },
    {
      len: 5,
      text: "TOKYO",
      level: "稳健区间（4–6 字）",
      cls: "good",
      pct: 38,
      advice: "5 个大写字母依然可以作为单个标识词整块辨认，适合展题、店招、茶罐与书脊品牌词。",
    },
    {
      len: 10,
      text: "TYPOGRAPHY",
      level: "临界区间（7–10 字）",
      cls: "warn",
      pct: 66,
      advice: "10 个字母竖直排开已占掉大半列高，人眼开始被迫逐字母拼读。只适合海报装饰副标，不适合需要快速扫读的正文信息。",
    },
    {
      len: 18,
      text: "VERTICAL•ALIGNMENT",
      level: "过长预警（11–20 字）",
      cls: "bad",
      pct: 86,
      advice: "两词 18 个字母纵向排成高梯，高度已经把前后的中文主文彻底割裂。遇到这种长度，建议立刻转用 218 号「直排中西文转向」顺转 90°。",
    },
    {
      len: 32,
      text: "DESIGN•IS•THINKING•MADE•VISUAL",
      level: "阅读崩塌（长句禁用）",
      cls: "bad",
      pct: 100,
      advice: "一整句英文直立叠排会拉出极长的字母梯子，横排时的词形轮廓荡然无存，扫视负担急剧攀升（示意）。长英文句子在直排里绝对不要逐字直立。",
    },
  ];

  function render() {
    const idx = parseInt(slider.value, 10) || 0;
    const s = SAMPLES[idx];
    labelEl.textContent = `${s.len} 字符 · ${s.text.replace(/•/g, " ")}`;

    // 渲染真实直立列（超过 14 字时折成多段并标示列高膨胀）
    const chars = [...s.text];
    const itemsHtml = [
      `<span class="s05-ch is-cjk">竖</span>`,
      `<span class="s05-ch is-cjk">排</span>`,
      `<span class="s05-ch is-dot">•</span>`,
      ...chars.map((c) => `<span class="s05-ch ${c === "•" ? "is-dot" : "is-lat"}">${c}</span>`),
      `<span class="s05-ch is-dot">•</span>`,
      `<span class="s05-ch is-cjk">例</span>`,
    ].join("");

    stage.innerHTML = `<div class="s05-col is-${s.cls}">${itemsHtml}</div>`;
    statusEl.className = `s05-status is-${s.cls}`;
    statusEl.innerHTML = `<strong>${s.level}</strong><p>${s.advice}</p>`;
    meterFill.style.width = `${s.pct}%`;
    meterFill.className = `s05-meter-fill is-${s.cls}`;
    meterText.textContent = `逐字拼读负荷（示意）：${s.cls === "good" ? "低" : s.cls === "warn" ? "中偏高" : "极高"}`;
  }

  slider.addEventListener("input", render);
  render();
}

// =========================================================================
// 06 节：双题单变量盲测小练习（中性选项 A/B/C/D，绝不剧透好坏）
// =========================================================================
export function initSection06() {
  const root = document.getElementById("sec06-quiz");
  if (!root) return;
  const promptEl = root.querySelector("#s06-prompt");
  const badgeEl = root.querySelector("#s06-round-badge");
  const grid = root.querySelector("#s06-grid");
  const feedback = root.querySelector("#s06-feedback");
  const nextBtn = root.querySelector("#s06-next");

  const ROUNDS = [
    {
      id: 1,
      badge: "第 1 题 / 共 2 题 · 单一变量：纵向字步",
      prompt: "四张海报草稿用了完全相同的汉字、大写字母、居中中轴和颜色，只改变了西文列的「纵向字步节奏」。哪一列最稳且收束到位？",
      cjk: ["筑", "境", "研", "究", "社"],
      latin: ["D", "E", "S", "I", "G", "N", "•", "L", "A", "B"],
      answer: "B",
      options: [
        {
          key: "A",
          mode: "crushed",
          why: "方案 A 的纵向步距压到 0.94×，上下字母几乎贴撞，整个英文列提前悬在半空，没能和左侧中文及底部奶油锚点对齐。",
        },
        {
          key: "B",
          mode: "balanced",
          why: "答对了！方案 B 保持均匀的 1.38× 纵向步距，每个字母既有清晰呼吸缝又不松散，词间圆点清楚，且末字 B 稳稳齐平底部视觉锚点。",
        },
        {
          key: "C",
          mode: "loose",
          why: "方案 C 把纵向步距拉到 1.98×，字母之间散成孤立圆点，不但读不出 DESIGN LAB 的词块感，尾脚还冲出了底线。",
        },
        {
          key: "D",
          mode: "uneven",
          why: "方案 D 按横排字宽去算竖向步距，导致 I、L 处骤然挤紧、D、G 处又骤然拉宽，竖向节拍忽快忽慢。",
        },
      ],
    },
    {
      id: 2,
      badge: "第 2 题 / 共 2 题 · 单一变量：横轴对准",
      prompt: "这次四列的大写字形与纵向步距完全一致，只改变西文字母在轨道内的「水平对准基准」。哪一列真正对齐了纵向中轴？",
      cjk: ["极", "简", "空", "间", "志"],
      latin: ["M", "I", "N", "I", "M", "A", "L", "•", "I", "I"],
      answer: "C",
      options: [
        {
          key: "A",
          mode: "flush-left",
          why: "方案 A 把所有字母贴左轨硬齐，窄字母 I 和宽字母 M 的中心大幅错开，列脊向左塌成锯齿。",
        },
        {
          key: "B",
          mode: "flush-right",
          why: "方案 B 把所有字母贴右轨硬齐，窄字母 I 悬在最右侧，左侧出现明显空洞缺口。",
        },
        {
          key: "C",
          mode: "center-axis",
          why: "答对了！方案 C 让最宽的 M 与最窄的 I 共用同一条纵向铅垂中轴，列形像建筑立柱一样笔直稳定。",
        },
        {
          key: "D",
          mode: "zig",
          why: "方案 D 让宽窄字母左右交替偏摆，每一行视线都要重新找落点，失去了直排直立的秩序感。",
        },
      ],
    },
  ];

  let roundIdx = 0;
  let picked = null;

  function buildOptionSvg(round, opt, reveal) {
    const W = 180;
    const H = 266;
    const topY = 20;
    const botY = 230;
    const cjkX = 56;
    const latRailL = 94;
    const latRailR = 138;
    const latCx = 116;
    const capH = 13.5;

    let cjkMarkup = "";
    const cjkStep = 35;
    round.cjk.forEach((ch, i) => {
      const cy = topY + 20 + i * cjkStep;
      cjkMarkup += `<text x="${cjkX}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="25" fill="#111512">${ch}</text>`;
    });

    // 西文坐标按选项唯一变量算出
    let latMarkup = "";
    const pts = [];
    let cy = topY + 13;

    round.latin.forEach((ch, i) => {
      let x = latCx;
      const isNarrow = ch === "I" || ch === "L" || ch === "•";
      const approxW = ch === "M" ? 13 : isNarrow ? 4 : 10;

      if (opt.mode === "flush-left") x = latRailL + 5 + approxW * 0.5;
      else if (opt.mode === "flush-right") x = latRailR - 5 - approxW * 0.5;
      else if (opt.mode === "zig") x = latCx + (i % 2 === 0 ? -7 : 7);

      let step = 20.6;
      if (opt.mode === "crushed") step = 13.4;
      else if (opt.mode === "loose") step = 24.4;
      else if (opt.mode === "uneven") step = isNarrow ? 12.2 : 24.6;

      if (ch === "•") {
        latMarkup += `<circle cx="${x.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2" fill="#111512"/>`;
        pts.push({ x, y: cy });
        cy += step * 0.78;
      } else {
        const overflow = cy > botY - 2;
        latMarkup += `<text x="${x.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Outfit, sans-serif" font-weight="600" font-size="${capH}" fill="${reveal && overflow ? "#9E2A20" : "#111512"}">${ch}</text>`;
        pts.push({ x, y: cy });
        cy += step;
      }
    });

    const isCorrect = opt.key === round.answer;
    const guideColor = isCorrect ? "#185A37" : "#9E2A20";
    const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    return `
      <svg viewBox="0 0 ${W} ${H}" class="s06-svg" aria-hidden="true">
        <rect x="0" y="0" width="${W}" height="${H}" fill="#A8B490"/>
        <line x1="28" y1="${topY}" x2="164" y2="${topY}" stroke="#111512" stroke-opacity="0.45" stroke-dasharray="2.5 2.5"/>
        <line x1="28" y1="${botY}" x2="164" y2="${botY}" stroke="#111512" stroke-opacity="0.45" stroke-dasharray="2.5 2.5"/>
        <line x1="34" y1="${topY}" x2="34" y2="${botY}" stroke="#111512" stroke-opacity="0.35"/>
        <line x1="78" y1="${topY}" x2="78" y2="${botY}" stroke="#111512" stroke-opacity="0.35"/>
        <line x1="${latRailL}" y1="${topY}" x2="${latRailL}" y2="${botY}" stroke="#111512" stroke-opacity="0.35"/>
        <line x1="${latRailR}" y1="${topY}" x2="${latRailR}" y2="${botY}" stroke="#111512" stroke-opacity="0.35"/>
        <!-- 暖奶油锚点与参照柱 -->
        <rect x="46" y="${botY - 24}" width="20" height="20" fill="#F7EACB"/>
        <rect x="148" y="${topY}" width="12" height="${botY - topY - 22}" fill="#F7EACB"/>
        <rect x="148" y="${botY - 14}" width="12" height="12" fill="#F7EACB"/>
        ${reveal ? `<line x1="${latCx}" y1="${topY}" x2="${latCx}" y2="${botY}" stroke="${guideColor}" stroke-opacity="0.45" stroke-dasharray="3 2"/>` : ""}
        ${reveal ? `<polyline points="${poly}" fill="none" stroke="${guideColor}" stroke-width="1.6"/>` : ""}
        ${cjkMarkup}
        ${latMarkup}
      </svg>
    `;
  }

  function render() {
    const round = ROUNDS[roundIdx];
    badgeEl.textContent = round.badge;
    promptEl.textContent = round.prompt;
    const reveal = picked !== null;

    grid.innerHTML = round.options
      .map((opt) => {
        const isPicked = picked === opt.key;
        const isRight = opt.key === round.answer;
        let stateCls = "";
        if (reveal) {
          if (isRight) stateCls = "is-correct";
          else if (isPicked) stateCls = "is-wrong";
          else stateCls = "is-muted";
        }
        return `
          <button type="button" class="s06-card ${stateCls}" data-opt="${opt.key}" aria-pressed="${isPicked}">
            <div class="s06-card-head">
              <span class="s06-key">方案 ${opt.key}</span>
              ${reveal && isRight ? `<span class="s06-mark is-ok">正解</span>` : reveal && isPicked ? `<span class="s06-mark is-bad">所选</span>` : ""}
            </div>
            ${buildOptionSvg(round, opt, reveal)}
          </button>
        `;
      })
      .join("");

    for (const btn of grid.querySelectorAll("[data-opt]")) {
      btn.addEventListener("click", () => {
        picked = btn.dataset.opt;
        render();
      });
    }

    if (!reveal) {
      feedback.className = "s06-feedback";
      feedback.innerHTML = `<p>仔细观察四列西文的对齐轴线、字间留白与底部奶油锚点关系，点击你认为最稳的一张。</p>`;
      nextBtn.hidden = true;
    } else {
      const chosen = round.options.find((o) => o.key === picked);
      const right = round.options.find((o) => o.key === round.answer);
      const ok = picked === round.answer;
      feedback.className = `s06-feedback ${ok ? "is-ok" : "is-bad"}`;
      feedback.innerHTML = `
        <strong>${ok ? `判断准确：方案 ${round.answer} 成立` : `方案 ${picked} 有隐患，正确答案是方案 ${round.answer}`}</strong>
        <p>${chosen.why}</p>
        ${!ok ? `<p class="s06-right-note">为什么选方案 ${round.answer}：${right.why.replace(/^答对了！/, "")}</p>` : ""}
      `;
      nextBtn.hidden = false;
      nextBtn.textContent = roundIdx === 0 ? "挑战第 2 题 →" : "回到第 1 题重测";
    }
  }

  nextBtn.addEventListener("click", () => {
    roundIdx = (roundIdx + 1) % ROUNDS.length;
    picked = null;
    render();
  });

  render();
}

// =========================================================================
// 07 节：原海报灯箱（点击放大、拖拽平移、滚轮/按钮缩放、Esc 关闭）
// =========================================================================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const modal = document.getElementById("poster-lightbox");
  if (!thumb || !modal) return;

  const img = modal.querySelector("#lightbox-img");
  const stage = modal.querySelector("#lightbox-stage");
  const zoomIn = modal.querySelector("#lb-zoom-in");
  const zoomOut = modal.querySelector("#lb-zoom-out");
  const zoomReset = modal.querySelector("#lb-zoom-reset");
  const closeBtn = modal.querySelector("#lb-close");
  const scaleLabel = modal.querySelector("#lb-scale");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let start = { x: 0, y: 0, tx: 0, ty: 0 };

  function sync() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!img.src) img.src = thumb.src; // 只引用一次 poster data URI
    scale = 1;
    tx = 0;
    ty = 0;
    sync();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  thumb.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });

  zoomIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); sync(); });
  zoomOut.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    sync();
  });
  zoomReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; sync(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    sync();
  }, { passive: false });

  img.addEventListener("pointerdown", (e) => {
    dragging = true;
    start = { x: e.clientX, y: e.clientY, tx, ty };
    img.setPointerCapture(e.pointerId);
  });
  img.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = start.tx + (e.clientX - start.x);
    ty = start.ty + (e.clientY - start.y);
    sync();
  });
  img.addEventListener("pointerup", () => { dragging = false; });
  img.addEventListener("pointercancel", () => { dragging = false; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
