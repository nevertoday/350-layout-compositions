// 162 栏目开启页 · 正文 01–08 节各独立交互实验（相邻节控件互不重复）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

/* ========================================================================
   01 节：海报三符号 X 光透视解剖（● 主题导入 / ☰ 层级清晰 / ◎ 视觉锚点）
   ======================================================================== */
const XRAY_DATA = {
  entry: {
    code: "01 · ENTRY · 主题导入",
    title: "第一眼宣告：上一栏结束了，新频道开始",
    body: "主题导入靠的是「切口隔离 + 栏目编号 + 巨幅栏目名」三件套。右缘通高朱红出血色带从装订切口一路切进版面，配合醒目的栏目序号与大字，让读者在 0.5 秒内把大脑从上一栏目的内容惯性里抽离出来，建立对新板块的心理预期。",
    check: "看透视图里被点亮的右缘出血色带、左上栏目号与巨幅栏目名——少了任何一块，这一页就容易被误当成普通正文。",
  },
  hierarchy: {
    code: "02 · HIERARCHY · 层级清晰",
    title: "四级阶梯一目了然，绝不塞成全刊目录",
    body: "一页栏目开启页往往同时承载刊号、主标题、导语和 2–4 条子目页码路标。它们必须拉开清晰的字号阶梯（经验上主标约为导语的 2.4×–4.5×），同时守住 35% 以上的净留白，只预告本栏核心文章，绝不能堆满几十条细目去抢目录页的活。",
    check: "看透视图里按 ①→②→③→④ 标出的阶梯比例条：每一级字号与留白逐层递减，视线不用猜先读哪一行。",
  },
  orientation: {
    code: "03 · ORIENTATION · 视觉锚点",
    title: "一个稳固落焦，加上指向下一页的方向力",
    body: "视觉锚点负责把散乱的目光先收拢到一点，再顺着构图动势推向翻页方向（右侧书口）。原海报用一支水平贯通的朱红大箭刺入右缘半圆豁口，把「先锚定、再前推」画成了最凝练的几何语言。",
    check: "看透视图里的同心靶锚点与向右指向的虚线眼动箭：焦点唯一，且动势直奔右缘翻页口。",
  },
};

export function initXrayDemo() {
  const btns = [...document.querySelectorAll("[data-xray]")];
  const svg = document.getElementById("xray-svg");
  const titleEl = document.getElementById("xray-title");
  const codeEl = document.getElementById("xray-code");
  const bodyEl = document.getElementById("xray-body");
  const checkEl = document.getElementById("xray-check");
  if (!btns.length || !svg) return;

  function setLayer(key) {
    const d = XRAY_DATA[key] || XRAY_DATA.entry;
    svg.setAttribute("data-layer", key);
    btns.forEach((b) => {
      const active = b.dataset.xray === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    codeEl.textContent = d.code;
    titleEl.textContent = d.title;
    bodyEl.textContent = d.body;
    checkEl.textContent = d.check;
  }

  btns.forEach((b) => b.addEventListener("click", () => setLayer(b.dataset.xray)));
  setLayer("entry");
}

/* ========================================================================
   02 节：从书口切口到现代期刊 · 历史年代标本轴（SVG 动态骨架切换）
   ======================================================================== */
const HISTORY_ERAS = {
  "1923": {
    year: "1923",
    who: "El Lissitzky（埃尔·利西茨基）·《为了声音》（Dlia golosa）",
    pub: "莫斯科—柏林国家出版社（State Publishing House），MoMA 馆藏 280.2001.1–25",
    rule: "留下的规矩：把书口本身变成栏目导航器官",
    desc: "马雅可夫斯基的诗集专为公开朗诵而印，利西茨基在右书口逐篇裁出阶梯状拇指切口（thumb index），每一篇开启页用红黑双色活版与几何符号作标识。朗诵者不必翻目录，大拇指一拨切口就直落该篇起页——这正是现代出血色带与栏目切口的直接先声。",
    svg: `
      <rect x="20" y="18" width="248" height="310" fill="#EFE4D1" stroke="#121311" stroke-width="2"/>
      <rect x="268" y="28" width="44" height="54" fill="#D63D1E" stroke="#121311" stroke-width="1.5"/>
      <text x="290" y="60" text-anchor="middle" fill="#FAF3E6" font-family="Space Mono, monospace" font-size="12" font-weight="700">01</text>
      <rect x="268" y="88" width="44" height="54" fill="#121311" stroke="#121311" stroke-width="1.5"/>
      <text x="290" y="120" text-anchor="middle" fill="#FAF3E6" font-family="Space Mono, monospace" font-size="12" font-weight="700">02</text>
      <rect x="268" y="148" width="44" height="54" fill="#E5D7BF" stroke="#121311" stroke-width="1.5"/>
      <text x="290" y="180" text-anchor="middle" fill="#121311" font-family="Space Mono, monospace" font-size="12" font-weight="700">03</text>
      <rect x="268" y="208" width="44" height="54" fill="#E5D7BF" stroke="#121311" stroke-width="1.5"/>
      <text x="290" y="240" text-anchor="middle" fill="#121311" font-family="Space Mono, monospace" font-size="12" font-weight="700">04</text>
      <rect x="44" y="48" width="134" height="24" fill="#121311"/>
      <rect x="44" y="80" width="96" height="24" fill="#121311"/>
      <circle cx="212" cy="128" r="28" fill="#D63D1E"/>
      <polygon points="44,180 228,180 228,166 254,192 228,218 228,204 44,204" fill="#D63D1E"/>
      <rect x="44" y="244" width="120" height="8" fill="#121311"/>
      <rect x="44" y="262" width="160" height="6" fill="#7D766B"/>
      <rect x="44" y="276" width="136" height="6" fill="#7D766B"/>
      <text x="44" y="310" fill="#A52910" font-family="Space Mono, monospace" font-size="10.5" font-weight="700">THUMB INDEX · RED &amp; BLACK</text>
    `,
  },
  "1959": {
    year: "1959",
    who: "Willy Fleckhaus（威利·弗莱克豪斯）· 西德《twen》杂志",
    pub: "创刊于 1959 年 4 月（1959–1971），12 栏模块网格",
    rule: "留下的规矩：用极端比例反差把翻页做成换场",
    desc: "弗莱克豪斯把瑞士 12 栏严格网格与美国杂志的戏剧张力揉在一起：在栏目与专题开启处，把特粗窄体大字（Schmalfette Grotesk）或全出血紧裁照片推到极致，同时留出整片白墙呼吸。读者一翻到这种节奏突变，不用解释就知道进入了新板块。",
    svg: `
      <rect x="18" y="28" width="296" height="290" fill="#F7F1E5" stroke="#121311" stroke-width="2"/>
      <line x1="166" y1="28" x2="166" y2="318" stroke="#121311" stroke-width="1" stroke-dasharray="4 4"/>
      <rect x="28" y="42" width="126" height="260" fill="#121311"/>
      <text x="91" y="138" text-anchor="middle" fill="#FAF3E6" font-family="Syne, sans-serif" font-size="56" font-weight="800">02</text>
      <rect x="48" y="160" width="86" height="6" fill="#D63D1E"/>
      <text x="91" y="196" text-anchor="middle" fill="#E8DFCE" font-family="Chivo, sans-serif" font-size="11" font-weight="700">12-COL SCALE</text>
      <rect x="184" y="54" width="112" height="122" fill="#D63D1E"/>
      <circle cx="240" cy="115" r="32" fill="#F7F1E5"/>
      <rect x="184" y="196" width="112" height="12" fill="#121311"/>
      <rect x="184" y="218" width="90" height="7" fill="#6F6B64"/>
      <rect x="184" y="232" width="102" height="7" fill="#6F6B64"/>
      <rect x="184" y="246" width="76" height="7" fill="#6F6B64"/>
      <text x="184" y="294" fill="#A52910" font-family="Space Mono, monospace" font-size="10.5" font-weight="700">CINEMATIC SCALE JUMP</text>
    `,
  },
  "1974": {
    year: "1974",
    who: "Jan V. White（扬·V·怀特）·《Editing by Design》与《Designing for Magazines》",
    pub: "R.R. Bowker（1974 / 1976 初版，1982 二版；2003 Allworth 三版）",
    rule: "留下的规矩：栏目开启页是功能路标，不是装饰空白",
    desc: "怀特与同期艾伦·赫尔伯特（Allen Hurlburt，《Publication Design》1971）把期刊编辑设计系统化。怀特专门拆解「Department / Section Openers」，强调开启页应当把固定栏目徽标、强层级标题与精炼的本栏子目索引合为一体，帮忙碌读者一秒决定要不要停下来读。",
    svg: `
      <rect x="26" y="18" width="280" height="310" fill="#EFE4D1" stroke="#121311" stroke-width="2"/>
      <rect x="26" y="18" width="280" height="44" fill="#121311"/>
      <rect x="42" y="34" width="16" height="14" fill="#D63D1E"/>
      <text x="68" y="45" fill="#FAF3E6" font-family="Chivo, sans-serif" font-size="12" font-weight="700">DEPARTMENT SIGNAGE</text>
      <rect x="42" y="84" width="168" height="26" fill="#121311"/>
      <rect x="42" y="118" width="118" height="26" fill="#121311"/>
      <line x1="42" y1="162" x2="290" y2="162" stroke="#D63D1E" stroke-width="3"/>
      <rect x="42" y="182" width="110" height="106" fill="#E3D4BC" stroke="#121311" stroke-width="1"/>
      <text x="52" y="204" fill="#A52910" font-family="Space Mono, monospace" font-size="10" font-weight="700">IN THIS SECTION</text>
      <rect x="52" y="218" width="84" height="6" fill="#121311"/>
      <rect x="52" y="236" width="76" height="6" fill="#121311"/>
      <rect x="52" y="254" width="88" height="6" fill="#121311"/>
      <rect x="172" y="182" width="118" height="106" fill="#D63D1E"/>
      <path d="M194 235 H258 M242 219 L258 235 L242 251" stroke="#FAF3E6" stroke-width="5" fill="none"/>
      <text x="42" y="312" fill="#A52910" font-family="Space Mono, monospace" font-size="10.5" font-weight="700">SIGNPOST + MINI-INDEX</text>
    `,
  },
  "1981": {
    year: "1981",
    who: "Josef Müller-Brockmann（约瑟夫·米勒-布罗克曼）·《网格系统》",
    pub: "Verlag Arthur Niggli（1981 年德英双语首版，176 页）",
    rule: "留下的规矩：开启页与正文共享同一套网格模数",
    desc: "在《Grid Systems in Graphic Design》中，米勒-布罗克曼展示了多栏网格如何统御整本出版物：栏目开启页即使放空 60% 纸面，栏目标题、出血色块与子目页码依然严格落回与后续正文相同的纵横网格线上，既制造出换挡反差，又保持全书建筑般的连贯秩序。",
    svg: `
      <rect x="26" y="18" width="280" height="310" fill="#F7F1E5" stroke="#121311" stroke-width="2"/>
      <g stroke="#121311" stroke-opacity="0.16" stroke-width="1">
        <line x1="96" y1="18" x2="96" y2="328"/><line x1="166" y1="18" x2="166" y2="328"/><line x1="236" y1="18" x2="236" y2="328"/>
        <line x1="26" y1="96" x2="306" y2="96"/><line x1="26" y1="174" x2="306" y2="174"/><line x1="26" y1="252" x2="306" y2="252"/>
      </g>
      <rect x="236" y="18" width="70" height="310" fill="#D63D1E"/>
      <rect x="40" y="96" width="182" height="34" fill="#121311"/>
      <rect x="40" y="138" width="124" height="24" fill="#121311"/>
      <rect x="96" y="174" width="140" height="14" fill="#D63D1E"/>
      <rect x="96" y="252" width="60" height="8" fill="#121311"/>
      <rect x="96" y="268" width="124" height="6" fill="#6F6B64"/>
      <rect x="96" y="282" width="110" height="6" fill="#6F6B64"/>
      <text x="40" y="314" fill="#A52910" font-family="Space Mono, monospace" font-size="10.5" font-weight="700">SHARED MODULAR GRID</text>
    `,
  },
};

export function initHistoryDemo() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const svg = document.getElementById("era-svg");
  const whoEl = document.getElementById("era-who");
  const pubEl = document.getElementById("era-pub");
  const ruleEl = document.getElementById("era-rule");
  const descEl = document.getElementById("era-desc");
  if (!btns.length || !svg) return;

  function setEra(key) {
    const d = HISTORY_ERAS[key] || HISTORY_ERAS["1923"];
    btns.forEach((b) => {
      const active = b.dataset.era === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    svg.innerHTML = d.svg;
    whoEl.textContent = d.who;
    pubEl.textContent = d.pub;
    ruleEl.textContent = d.rule;
    descEl.textContent = d.desc;
  }

  btns.forEach((b) => b.addEventListener("click", () => setEra(b.dataset.era)));
  setEra("1923");
}

/* ========================================================================
   03 节：书口色带 · 128 页厚刊拇指速翻模拟槽（2D Canvas + range）
   ======================================================================== */
const FLIP_SECTIONS = [
  { start: 1, end: 32, num: "01", name: "空间与尺度", color: "#D63D1E" },
  { start: 33, end: 64, num: "02", name: "建造与构造", color: "#E86A33" },
  { start: 65, end: 96, num: "03", name: "器物与材料", color: "#F29D52" },
  { start: 97, end: 128, num: "04", name: "纸上档案", color: "#D63D1E" },
];

export function initThumbFlipDemo() {
  const canvas = document.getElementById("flip-canvas");
  const slider = document.getElementById("flip-page-slider");
  const modeBtns = [...document.querySelectorAll("[data-flip-mode]")];
  const jumpBtns = [...document.querySelectorAll("[data-flip-jump]")];
  const readoutPage = document.getElementById("flip-read-page");
  const readoutSec = document.getElementById("flip-read-sec");
  const readoutVis = document.getElementById("flip-read-vis");
  const readoutExplain = document.getElementById("flip-read-explain");
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  let page = 18;
  let mode = "stepped"; // "none" | "same" | "stepped"

  function currentSection(p) {
    return FLIP_SECTIONS.find((s) => p >= s.start && p <= s.end) || FLIP_SECTIONS[0];
  }

  function updateReadouts() {
    const sec = currentSection(page);
    const isOpener = page === sec.start;
    readoutPage.textContent = `P.${String(page).padStart(3, "0")} / 128`;
    readoutSec.textContent = `栏目 ${sec.num} · ${sec.name}${isOpener ? "（开启页）" : ""}`;
    if (mode === "none") {
      readoutVis.textContent = "极低（示意）";
      readoutVis.dataset.tone = "bad";
      readoutExplain.textContent = isOpener
        ? `你恰好停在第 ${page} 页的栏目开启页，但侧面 128 页书口全是一片惨白——高速拇指翻阅时肉眼根本刹不住车。`
        : `书口没有任何出血色带。你现在落在第 ${page} 页，只看侧面完全不知道距离「${sec.num}」或下一栏开启页还有几页。`;
    } else if (mode === "same") {
      readoutVis.textContent = "中等（示意）";
      readoutVis.dataset.tone = "warn";
      readoutExplain.textContent = `每栏开启页都在右上同一高度印了朱红出血块：速翻时能看见 4 道红杠知道「有换栏」，但四栏叠在同一纵坐标，不翻开还是分不清哪一道是第 02 栏、哪一道是第 04 栏。`;
    } else {
      readoutVis.textContent = "清晰定位（示意）";
      readoutVis.dataset.tone = "good";
      readoutExplain.textContent = isOpener
        ? `正中第 ${page} 页「栏目 ${sec.num} · ${sec.name}」开启页！阶梯式出血色带把四个板块错落排在书口纵轴上，拇指一滑就精准停在入口。`
        : `当前在栏目 ${sec.num} 内页（第 ${page} 页）。看左侧厚刊书口：四级阶梯朱红标清晰标出第 1 / 33 / 65 / 97 页四个开启页位置，随时一拨即达。`;
    }
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const dpr = pixelRatio(2);
    const W = Math.round(rect.width);
    const H = Math.round(rect.height);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#171614";
    ctx.fillRect(0, 0, W, H);

    const pad = 16;
    const narrow = W < 520;
    const edgeW = narrow ? Math.round(W * 0.44) : Math.round(W * 0.46);
    const edgeX = pad;
    const edgeY = pad + 18;
    const edgeH = H - edgeY - pad - 8;

    // 标题标
    ctx.fillStyle = "#C7BEB0";
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", sans-serif`;
    ctx.fillText("128 页厚刊书口侧面（拇指速翻视图）", edgeX, pad + 10);

    // 左侧：128 页书口侧面（每页一条竖细线，按页码展开）
    ctx.fillStyle = "#26231F";
    ctx.fillRect(edgeX, edgeY, edgeW, edgeH);
    ctx.strokeStyle = "rgba(245, 237, 224, 0.25)";
    ctx.strokeRect(edgeX + 0.5, edgeY + 0.5, edgeW - 1, edgeH - 1);

    const total = 128;
    const stepX = edgeW / total;
    for (let p = 1; p <= total; p++) {
      const px = edgeX + (p - 1) * stepX;
      // 纸边纹理
      ctx.fillStyle = p % 2 === 0 ? "#EAE0CE" : "#DFD3BE";
      ctx.fillRect(px, edgeY + 1, Math.max(1, stepX - 0.3), edgeH - 2);

      // 书口出血色带（开启页及其后 2 页连续出血更显眼，或在对应区段标色）
      const secIdx = FLIP_SECTIONS.findIndex((s) => p >= s.start && p <= s.end);
      const sec = FLIP_SECTIONS[secIdx];
      const isOpenerBand = p >= sec.start && p < sec.start + 4;
      if (mode !== "none" && isOpenerBand) {
        const bandH = Math.round(edgeH * 0.21);
        const bandY = mode === "same" ? edgeY + 8 : edgeY + 8 + secIdx * Math.round((edgeH - 16) / 4);
        ctx.fillStyle = "#D63D1E";
        ctx.fillRect(px, bandY, Math.max(1.8, stepX + 0.4), bandH);
      } else if (mode === "stepped" && p > sec.start + 3 && p <= sec.end) {
        // 本栏其余内页保留一根浅色连续阶梯引导细块（真实期刊常用做法）
        const bandH = Math.round(edgeH * 0.21);
        const bandY = edgeY + 8 + secIdx * Math.round((edgeH - 16) / 4);
        ctx.fillStyle = "rgba(214, 61, 30, 0.22)";
        ctx.fillRect(px, bandY, Math.max(1, stepX), bandH);
      }
    }

    // 标注四个开启页纵标线
    FLIP_SECTIONS.forEach((s) => {
      const sx = edgeX + (s.start - 1) * stepX;
      ctx.fillStyle = "#FAF3E6";
      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.fillText(s.num, sx + 2, edgeY + edgeH - 6);
    });

    // 当前拇指游标竖线
    const curX = edgeX + (page - 0.5) * stepX;
    ctx.strokeStyle = "#F57256";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(curX, edgeY - 6);
    ctx.lineTo(curX, edgeY + edgeH + 6);
    ctx.stroke();
    ctx.fillStyle = "#F57256";
    ctx.beginPath();
    ctx.moveTo(curX - 6, edgeY - 7);
    ctx.lineTo(curX + 6, edgeY - 7);
    ctx.lineTo(curX, edgeY + 1);
    ctx.closePath();
    ctx.fill();

    // 右侧：当前翻开的页面实时预览
    const prevX = edgeX + edgeW + 22;
    const prevW = W - prevX - pad;
    const prevY = edgeY;
    const prevH = edgeH;
    const sec = currentSection(page);
    const isOpener = page === sec.start;

    ctx.fillStyle = "#C7BEB0";
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", sans-serif`;
    ctx.fillText(isOpener ? `当前页：栏目 ${sec.num} 开启页` : `当前页：第 ${page} 页（正文内页）`, prevX, pad + 10);

    ctx.fillStyle = isOpener ? "#EFE4D1" : "#F7F1E5";
    ctx.fillRect(prevX, prevY, prevW, prevH);
    ctx.strokeStyle = isOpener ? "#F57256" : "rgba(245, 237, 224, 0.35)";
    ctx.lineWidth = isOpener ? 2.5 : 1;
    ctx.strokeRect(prevX + 0.5, prevY + 0.5, prevW - 1, prevH - 1);

    const secIdx = FLIP_SECTIONS.indexOf(sec);
    if (isOpener) {
      // 开启页视图
      if (mode !== "none") {
        const bw = Math.round(prevW * 0.22);
        const bh = mode === "stepped" ? Math.round(prevH * 0.28) : prevH;
        const by = mode === "stepped" ? prevY + 8 + secIdx * Math.round((prevH - 16) / 4) : prevY;
        ctx.fillStyle = "#D63D1E";
        ctx.fillRect(prevX + prevW - bw, by, bw, Math.min(bh, prevY + prevH - by));
      }
      ctx.fillStyle = "#A52910";
      ctx.font = `700 11px "Space Mono", monospace`;
      ctx.fillText(`SECTION ${sec.num}`, prevX + 16, prevY + 28);
      ctx.fillStyle = "#121311";
      ctx.font = `900 ${Math.min(30, Math.round(prevW * 0.13))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(sec.name, prevX + 16, prevY + 68);
      // 向右导流箭
      const ay = prevY + Math.round(prevH * 0.55);
      ctx.fillStyle = "#D63D1E";
      ctx.fillRect(prevX, ay - 6, Math.round(prevW * 0.62), 12);
      ctx.beginPath();
      ctx.moveTo(prevX + Math.round(prevW * 0.56), ay - 16);
      ctx.lineTo(prevX + Math.round(prevW * 0.72), ay);
      ctx.lineTo(prevX + Math.round(prevW * 0.56), ay + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#46433D";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillText(`本栏起页 · P.${String(page).padStart(3, "0")}`, prevX + 16, prevY + prevH - 18);
    } else {
      // 正文双栏密排内页
      ctx.fillStyle = "#6F6A61";
      ctx.font = `600 10px "Space Mono", "Noto Sans SC", sans-serif`;
      ctx.fillText(`${sec.num} ${sec.name}`, prevX + 14, prevY + 20);
      ctx.fillText(`P.${String(page).padStart(3, "0")}`, prevX + prevW - 44, prevY + 20);
      if (mode === "stepped") {
        const by = prevY + 8 + secIdx * Math.round((prevH - 16) / 4);
        ctx.fillStyle = "#D63D1E";
        ctx.fillRect(prevX + prevW - 8, by, 8, Math.round(prevH * 0.21));
      }
      const colW = Math.floor((prevW - 44) / 2);
      for (let c = 0; c < 2; c++) {
        const cx = prevX + 14 + c * (colW + 12);
        for (let y = prevY + 34; y < prevY + prevH - 18; y += 10) {
          ctx.fillStyle = "rgba(18, 19, 17, 0.22)";
          ctx.fillRect(cx, y, colW - ((y * (c + 3)) % 18), 4);
        }
      }
    }

    ctx.restore();
  }

  function sync() {
    slider.value = String(page);
    modeBtns.forEach((b) => {
      const a = b.dataset.flipMode === mode;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", a ? "true" : "false");
    });
    updateReadouts();
    draw();
  }

  slider.addEventListener("input", () => {
    page = Number(slider.value);
    sync();
  });
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.flipMode;
      sync();
    })
  );
  jumpBtns.forEach((b) =>
    b.addEventListener("click", () => {
      page = Number(b.dataset.flipJump);
      sync();
    })
  );
  window.addEventListener("resize", draw);
  sync();
}

/* ========================================================================
   04 节：方向与锚点 · 四向构图 2D 视线流束模拟（loop 动画）
   ======================================================================== */
const FLOW_CASES = {
  back: {
    name: "左指反推",
    verdict: "视线被拽回上一栏",
    detail: "视觉重心与楔形线条朝左收束，读者的眼动先被拉回左页旧栏，再费力折返寻找右侧翻页入口，削弱了换挡推进感。",
    points: [
      { x: 0.62, y: 0.34, label: "① 落焦" },
      { x: 0.26, y: 0.56, label: "② 被拽向左缘" },
      { x: 0.14, y: 0.62, label: "③ 退回上栏" },
    ],
    tone: "bad",
  },
  static: {
    name: "居中僵滞",
    verdict: "停在页面中央不动",
    detail: "所有文字和色块死死居中对称，没有不对称缺口，也没有指向右书口的方向势能；看起来像一张孤立的海报，不像会继续翻下去的栏目入口。",
    points: [
      { x: 0.5, y: 0.36, label: "① 居中落焦" },
      { x: 0.5, y: 0.56, label: "② 原地打转" },
      { x: 0.5, y: 0.74, label: "③ 缺少翻页动势" },
    ],
    tone: "warn",
  },
  split: {
    name: "双焦拉扯",
    verdict: "左右两头互抢第一眼",
    detail: "左上方的大标与右下方同等饱和度的色块旗鼓相当，眼睛在两端反复横跳，既建立不起唯一锚点，也形成不了向前的合力。",
    points: [
      { x: 0.26, y: 0.3, label: "① 焦点甲" },
      { x: 0.74, y: 0.68, label: "② 焦点乙抢眼" },
      { x: 0.3, y: 0.36, label: "③ 回跳犹豫" },
    ],
    tone: "bad",
  },
  forward: {
    name: "右偏导流",
    verdict: "单锚点顺势滑进正文",
    detail: "大标题在左上确立唯一第一落点，下方无需硬画真实红箭头——仅凭左密右空的留白缺口、向右延伸的标题轴线与右缘出血豁口，就能把视线自然送进下一页。",
    points: [
      { x: 0.28, y: 0.3, label: "① 栏目大标" },
      { x: 0.56, y: 0.54, label: "② 顺隐形动势右滑" },
      { x: 0.88, y: 0.56, label: "③ 翻入正文" },
    ],
    tone: "good",
  },
};

export function initFlowDemo() {
  const canvas = document.getElementById("flow-canvas");
  const btns = [...document.querySelectorAll("[data-flow-case]")];
  const verdictEl = document.getElementById("flow-verdict");
  const detailEl = document.getElementById("flow-detail");
  if (!canvas || !btns.length) return;

  const ctx = canvas.getContext("2d");
  let activeKey = "forward";

  function draw(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const dpr = pixelRatio(2);
    const W = Math.round(rect.width);
    const H = Math.round(rect.height);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    const c = FLOW_CASES[activeKey];
    ctx.save();
    ctx.scale(dpr, dpr);

    // 暖米纸底
    ctx.fillStyle = "#EFE4D1";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#121311";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);

    // 按当前模式画出真实的隐形构图骨架（不靠硬画箭头！）
    if (activeKey === "forward") {
      // 右缘出血色带 + 半圆豁口 + 左重右轻隐形导流块
      ctx.fillStyle = "#D63D1E";
      ctx.fillRect(W * 0.82, 0, W * 0.18, H);
      ctx.beginPath();
      ctx.arc(W * 0.82, H * 0.56, Math.min(H * 0.24, W * 0.14), -Math.PI / 2, Math.PI / 2);
      ctx.fillStyle = "#EFE4D1";
      ctx.fill();
      ctx.fillStyle = "#121311";
      ctx.fillRect(W * 0.08, H * 0.18, W * 0.36, 22);
      ctx.fillRect(W * 0.08, H * 0.29, W * 0.24, 22);
      ctx.fillStyle = "rgba(18,19,17,0.16)";
      ctx.fillRect(W * 0.08, H * 0.52, W * 0.52, 8);
      ctx.fillRect(W * 0.08, H * 0.68, W * 0.32, 6);
      ctx.fillRect(W * 0.08, H * 0.74, W * 0.28, 6);
    } else if (activeKey === "back") {
      // 反指左倾楔块
      ctx.fillStyle = "#D8D3C9";
      ctx.fillRect(0, 0, W * 0.12, H);
      ctx.fillStyle = "#A51B14";
      ctx.beginPath();
      ctx.moveTo(W * 0.78, H * 0.44);
      ctx.lineTo(W * 0.22, H * 0.56);
      ctx.lineTo(W * 0.78, H * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#121311";
      ctx.fillRect(W * 0.46, H * 0.22, W * 0.34, 20);
    } else if (activeKey === "static") {
      // 四面锁死居中块
      ctx.strokeStyle = "rgba(18,19,17,0.28)";
      ctx.strokeRect(W * 0.16, H * 0.14, W * 0.68, H * 0.72);
      ctx.fillStyle = "#121311";
      ctx.fillRect(W * 0.32, H * 0.28, W * 0.36, 22);
      ctx.fillStyle = "#B56A4A";
      ctx.fillRect(W * 0.38, H * 0.48, W * 0.24, 26);
      ctx.fillStyle = "rgba(18,19,17,0.25)";
      ctx.fillRect(W * 0.34, H * 0.7, W * 0.32, 8);
    } else {
      // 双焦对峙
      ctx.fillStyle = "#121311";
      ctx.fillRect(W * 0.08, H * 0.18, W * 0.34, 62);
      ctx.fillStyle = "#D63D1E";
      ctx.fillRect(W * 0.56, H * 0.52, W * 0.34, 72);
    }

    // 画出眼动轨迹连线与实时巡游光点
    const pts = c.points.map((p) => ({ x: p.x * W, y: p.y * H, label: p.label }));
    const pathColor = c.tone === "good" ? "#156347" : c.tone === "warn" ? "#915B12" : "#A51B14";
    ctx.save();
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();

    // 动态视线粒子
    if (!still) {
      const prog = (t * 0.45) % 1;
      const seg = prog < 0.5 ? 0 : 1;
      const local = seg === 0 ? prog * 2 : (prog - 0.5) * 2;
      const a = pts[seg];
      const b = pts[seg + 1];
      const px = a.x + (b.x - a.x) * local;
      const py = a.y + (b.y - a.y) * local;
      ctx.fillStyle = pathColor;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FAF3E6";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 节点圆标与白底高对比标签
    pts.forEach((p) => {
      ctx.fillStyle = "#FAF3E6";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(p.label).width;
      const lx = Math.max(8, Math.min(W - tw - 18, p.x - tw / 2 - 5));
      const ly = Math.max(22, p.y - 16);
      ctx.fillStyle = "#121311";
      ctx.fillRect(lx, ly - 13, tw + 10, 18);
      ctx.fillStyle = "#FAF3E6";
      ctx.fillText(p.label, lx + 5, ly);
    });

    ctx.restore();
  }

  const runner = loop(canvas, draw);

  function selectCase(key) {
    activeKey = key;
    const c = FLOW_CASES[key];
    btns.forEach((b) => {
      const a = b.dataset.flowCase === key;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", a ? "true" : "false");
    });
    verdictEl.textContent = `${c.name} · ${c.verdict}`;
    verdictEl.dataset.tone = c.tone;
    detailEl.textContent = c.detail;
    runner.draw();
  }

  btns.forEach((b) => b.addEventListener("click", () => selectCase(b.dataset.flowCase)));
  selectCase("forward");
}

/* ========================================================================
   05 节：四种刊物，四种开启页骨架（规格蓝图矩阵）
   ======================================================================== */
const ARCHETYPES = {
  mag: {
    name: "文化生活杂志",
    ratio: "3.0× – 4.5×（经验参考）",
    subs: "2 – 4 条主打篇目 + 页码",
    edge: "右缘阶梯出血色带 + 栏目短标",
    space: "40% – 55% 留白",
    note: "读者翻阅杂志是跳跃式的。开启页要像站牌一样醒目：一边用大标题与情绪图把氛围拉满，一边给出两三条最诱人的文章页码，把路过的人留住。",
    svg: `
      <rect x="10" y="14" width="164" height="202" fill="#E6DFD3" stroke="#121311" stroke-width="1.5"/>
      <rect x="174" y="14" width="164" height="202" fill="#EFE4D1" stroke="#121311" stroke-width="1.5"/>
      <rect x="24" y="28" width="136" height="174" fill="#2A2825"/>
      <circle cx="92" cy="108" r="34" fill="#D63D1E"/>
      <rect x="306" y="14" width="32" height="202" fill="#D63D1E"/>
      <rect x="190" y="34" width="96" height="24" fill="#121311"/>
      <rect x="190" y="64" width="72" height="20" fill="#121311"/>
      <rect x="190" y="102" width="110" height="8" fill="#D63D1E"/>
      <rect x="190" y="132" width="94" height="6" fill="#121311"/>
      <rect x="190" y="148" width="84" height="6" fill="#6F6B64"/>
      <rect x="190" y="164" width="90" height="6" fill="#6F6B64"/>
      <text x="24" y="208" fill="#FAF3E6" font-family="Space Mono, monospace" font-size="9">LEFT BLEED PHOTO</text>
      <text x="190" y="204" fill="#A52910" font-family="Space Mono, monospace" font-size="9">RIGHT OPENER + TAB</text>
    `,
  },
  annual: {
    name: "企业 / 机构年报",
    ratio: "2.8× – 4.0×（经验参考）",
    subs: "3 项年度关键指标或分节目录",
    edge: "纯色出血块 + 超大板块编号",
    space: "45% – 60% 留白",
    note: "投资人与审计师看年报是带着问题直奔数据板块的。年报开启页通常把超大板块编号（01–05）、核心业绩摘要和清晰的分节页码放在同一视野内，降低检索成本。",
    svg: `
      <rect x="10" y="14" width="164" height="202" fill="#171614" stroke="#121311" stroke-width="1.5"/>
      <rect x="174" y="14" width="164" height="202" fill="#F7F1E5" stroke="#121311" stroke-width="1.5"/>
      <text x="30" y="114" fill="#D63D1E" font-family="Syne, sans-serif" font-size="68" font-weight="800">03</text>
      <rect x="30" y="134" width="90" height="6" fill="#FAF3E6"/>
      <text x="30" y="164" fill="#C9C0B2" font-family="Space Mono, monospace" font-size="10">FINANCE &amp; AUDIT</text>
      <rect x="192" y="34" width="124" height="22" fill="#121311"/>
      <rect x="192" y="76" width="56" height="40" fill="#EFE4D1" stroke="#121311" stroke-width="1"/>
      <rect x="256" y="76" width="56" height="40" fill="#EFE4D1" stroke="#121311" stroke-width="1"/>
      <rect x="192" y="136" width="120" height="6" fill="#121311"/>
      <rect x="192" y="152" width="106" height="6" fill="#6F6B64"/>
      <rect x="192" y="168" width="114" height="6" fill="#6F6B64"/>
      <rect x="322" y="84" width="16" height="54" fill="#D63D1E"/>
    `,
  },
  art: {
    name: "艺术与建筑画册",
    ratio: "2.4× – 3.5×（经验参考）",
    subs: "1 句策展导语（可省去子目）",
    edge: "整张换色插纸（彩色特种纸）",
    space: "65% – 80% 留白",
    note: "画册里的栏目开启页更接近展厅之间的过廊。常直接换用一张染纸或高留白素页，只放组别标题与一小段策展引言，让读者的眼睛从上一组摄影色调中彻底清空。",
    svg: `
      <rect x="10" y="14" width="164" height="202" fill="#D63D1E" stroke="#121311" stroke-width="1.5"/>
      <rect x="174" y="14" width="164" height="202" fill="#EFE4D1" stroke="#121311" stroke-width="1.5"/>
      <rect x="36" y="148" width="84" height="20" fill="#FAF3E6"/>
      <rect x="36" y="176" width="60" height="6" fill="#FAF3E6" fill-opacity="0.7"/>
      <rect x="206" y="152" width="104" height="6" fill="#121311"/>
      <rect x="206" y="166" width="90" height="6" fill="#6F6B64"/>
      <rect x="206" y="180" width="72" height="6" fill="#6F6B64"/>
      <text x="36" y="42" fill="#FAF3E6" font-family="Space Mono, monospace" font-size="10">TINTED DIVIDER SHEET</text>
    `,
  },
  manual: {
    name: "品牌与设计规范手册",
    ratio: "2.6× – 3.8×（经验参考）",
    subs: "本节全部条款编号速查",
    edge: "右侧固定索引色带 + 编号压边",
    space: "45% – 55% 留白",
    note: "规范手册不是用来从头读到尾的，设计师每次都在找「色彩」「字体」「网格」某一章。开启页右侧做死出血色条，正文左侧直接列出本节 3–5 个条款编号，实用胜过抒情。",
    svg: `
      <rect x="10" y="14" width="164" height="202" fill="#F7F1E5" stroke="#121311" stroke-width="1.5"/>
      <rect x="174" y="14" width="164" height="202" fill="#F7F1E5" stroke="#121311" stroke-width="1.5"/>
      <rect x="24" y="30" width="60" height="22" fill="#121311"/>
      <text x="54" y="45" text-anchor="middle" fill="#FAF3E6" font-family="Space Mono, monospace" font-size="11" font-weight="700">SEC 04</text>
      <rect x="24" y="66" width="122" height="22" fill="#121311"/>
      <rect x="24" y="114" width="120" height="1" fill="#121311"/>
      <rect x="24" y="128" width="110" height="7" fill="#6F6B64"/>
      <rect x="24" y="144" width="98" height="7" fill="#6F6B64"/>
      <rect x="190" y="34" width="110" height="22" fill="#EFE4D1" stroke="#121311" stroke-width="1"/>
      <rect x="190" y="66" width="110" height="22" fill="#EFE4D1" stroke="#121311" stroke-width="1"/>
      <rect x="190" y="98" width="110" height="22" fill="#EFE4D1" stroke="#121311" stroke-width="1"/>
      <rect x="190" y="130" width="110" height="22" fill="#EFE4D1" stroke="#121311" stroke-width="1"/>
      <rect x="316" y="14" width="22" height="202" fill="#D63D1E"/>
    `,
  },
};

export function initArchetypeDemo() {
  const btns = [...document.querySelectorAll("[data-arch]")];
  const svg = document.getElementById("arch-svg");
  const nameEl = document.getElementById("arch-name");
  const ratioEl = document.getElementById("arch-ratio");
  const subsEl = document.getElementById("arch-subs");
  const edgeEl = document.getElementById("arch-edge");
  const spaceEl = document.getElementById("arch-space");
  const noteEl = document.getElementById("arch-note");
  if (!btns.length || !svg) return;

  function setArch(key) {
    const d = ARCHETYPES[key] || ARCHETYPES.mag;
    btns.forEach((b) => {
      const a = b.dataset.arch === key;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", a ? "true" : "false");
    });
    svg.innerHTML = d.svg;
    nameEl.textContent = d.name;
    ratioEl.textContent = d.ratio;
    subsEl.textContent = d.subs;
    edgeEl.textContent = d.edge;
    spaceEl.textContent = d.space;
    noteEl.textContent = d.note;
  }

  btns.forEach((b) => b.addEventListener("click", () => setArch(b.dataset.arch)));
  setArch("mag");
}

/* ========================================================================
   06 节：什么时候别用 · 四条件出版决策诊断拨钮
   ======================================================================== */
export function initSkipDecisionDemo() {
  const inputs = [...document.querySelectorAll("[data-skip-cond]")];
  const badgeEl = document.getElementById("skip-verdict-badge");
  const headEl = document.getElementById("skip-verdict-head");
  const bodyEl = document.getElementById("skip-verdict-body");
  if (!inputs.length || !badgeEl) return;

  const state = {
    pages: "thick", // "thin" (≤24页) | "thick" (≥64页)
    perSec: "long", // "short" (1-3页) | "long" (≥8页)
    reading: "browse", // "linear" (连续读小说) | "browse" (跳跃选读)
    medium: "print", // "mobile" (竖屏手机流) | "print" (纸本/横屏PDF)
  };

  function evaluate() {
    const blockers = [];
    if (state.medium === "mobile") blockers.push("竖屏移动端信息流没有物理翻页惯性，整页过场只会挡住首屏正文");
    if (state.reading === "linear") blockers.push("从头读到尾的连续叙事怕被打断，更适合轻盈的章节扉页");
    if (state.pages === "thin") blockers.push("总页数偏薄（≤24 页），塞入整页开启页会把整本册子切碎");
    if (state.perSec === "short") blockers.push("单个栏目只有 1–3 页，开启页占比过高，读者刚进门就出门");

    if (blockers.length >= 2 || state.medium === "mobile" || state.reading === "linear") {
      badgeEl.textContent = "结论 · 直接省去整页开启页";
      badgeEl.dataset.tone = "bad";
      headEl.textContent = "此刻强加栏目开启页，反而拖慢阅读";
      bodyEl.textContent = `触发原因：${blockers.join("；")}。建议改用顶部变色栏眉、书口拇指小标，或在连续长文里换用克制的章节扉页。`;
    } else if (blockers.length === 1) {
      badgeEl.textContent = "结论 · 降级为「半页栏头条」";
      badgeEl.dataset.tone = "warn";
      headEl.textContent = "没必要独占整页，用半页或顶带完成换挡即可";
      bodyEl.textContent = `制约因素：${blockers[0]}。把栏目名、短导语和色带压缩到上半页，下半页直接接第一篇正文，兼顾识别与紧凑度。`;
    } else {
      badgeEl.textContent = "结论 · 值得给足整页开启页";
      badgeEl.dataset.tone = "good";
      headEl.textContent = "厚刊、长栏目、跳跃翻阅——正是栏目开启页的主场";
      bodyEl.textContent = "具备四项理想条件：纸本或宽幅翻页媒介、64 页以上体量、单栏内容厚实且读者会跳着找板块。配齐书口出血色带、3× 左右主标阶梯与 2–4 条子目路标，体验最顺畅。";
    }
  }

  inputs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.skipCond;
      const v = btn.dataset.skipVal;
      state[k] = v;
      inputs
        .filter((x) => x.dataset.skipCond === k)
        .forEach((x) => {
          const active = x.dataset.skipVal === v;
          x.classList.toggle("is-active", active);
          x.setAttribute("aria-pressed", active ? "true" : "false");
        });
      evaluate();
    });
  });
  evaluate();
}

/* ========================================================================
   07 节：练一练（四个纯中性标签方案 A/B/C/D，只差一个结构变量）
   ======================================================================== */
const QUIZ_FEEDBACK = {
  A: {
    correct: false,
    head: "方案 A 不成立：层级塌陷，且把开启页塞成了目录",
    body: "主标题只比下方文字略大（约 1.2×），底下又硬塞进全部 4 篇文章的冗长提要和作者信息。视觉没有换挡落差，净留白被吃光——这类清单应该交给「目录版式」，而不是栏目开启页。",
  },
  B: {
    correct: false,
    head: "方案 B 不成立：视觉动势向左反推，把眼睛拽回上一栏",
    body: "标题字号足够大，但左上角斜切的厚重朱红楔块与指向线明显朝左压回书脊。读者刚翻进「03 构造与材料」，视线却被惯性往回拉向第 02 栏，与翻页方向背道而驰。",
  },
  C: {
    correct: true,
    head: "选对了！方案 C 同时立住了导入、层级与向右导流",
    body: "3.4× 粗黑大标一眼确立新栏目，一行短导语接住主题预期，3 条带页码的子目路标留足呼吸空白；右缘出血朱红书口切出半圆弧豁口，视觉动势自然向右滑进下一页正文。",
  },
  D: {
    correct: false,
    head: "方案 D 不成立：双焦互抢，且缺少内容导览",
    body: "中段并排塞了两块同等体量、同等饱和度的色块与广告条，读者第一眼在左右两头之间反复跳动，建立不起唯一锚点；同时没有导语和子目预告，翻开只看到两张抢戏的方块。",
  },
};

export function initQuizDemo() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const fb = document.getElementById("quiz-feedback");
  const fbHead = document.getElementById("quiz-fb-head");
  const fbBody = document.getElementById("quiz-fb-body");
  const resetBtn = document.getElementById("quiz-reset");
  if (!cards.length || !fb) return;

  function pick(opt) {
    const res = QUIZ_FEEDBACK[opt];
    cards.forEach((c) => {
      const isMe = c.dataset.quizOpt === opt;
      const isAns = c.dataset.quizOpt === "C";
      c.classList.toggle("is-picked", isMe);
      c.classList.toggle("is-correct", isAns);
      c.classList.toggle("is-wrong", isMe && !res.correct);
      c.setAttribute("aria-pressed", isMe ? "true" : "false");
    });
    fb.hidden = false;
    fb.dataset.tone = res.correct ? "good" : "bad";
    fbHead.textContent = res.head;
    fbBody.textContent = res.body;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.quizOpt)));
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      cards.forEach((c) => {
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", "false");
      });
      fb.hidden = true;
    });
  }
}

/* ========================================================================
   08 节：原海报灯箱（放大、拖拽、滚轮缩放、Esc 关闭，draggable="false"）
   ======================================================================== */
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const img = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  if (!trigger || !img || !modal || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function openModal() {
    if (!modalImg.src) modalImg.src = img.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeModal();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  modalImg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  modalImg.addEventListener("pointerdown", (e) => {
    drag = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try {
      modalImg.setPointerCapture(e.pointerId);
    } catch {}
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => (drag = false));
  modalImg.addEventListener("pointercancel", () => (drag = false));
}
