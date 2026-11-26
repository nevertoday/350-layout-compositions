// 218 正文七节交互模块：01 动线对照 / 02 UAX #50 分拣 / 03 暗房显微画布 / 04 编年卷轴 / 05 场景滤镜 / 06 单变量练习 / 07 海报灯箱
import { loop, pixelRatio } from "../../lib/stage.js";

// ---------- 01 三向视线向量对照仪 ----------
const FLOW_MODES = {
  cw90: {
    angle: 90,
    badge: "顺流统一",
    ok: true,
    title: "顺时针 +90°：中文下行，英文也顺势向下读",
    body: "头部只需轻微向右偏一次（或眼球直接扫读），拉丁字母从词首到词尾的方向仍是「由上而下」，与上下汉字保持完全一致的单向流，不需要视线回跳。",
    jumps: "方向折返 0 次 · 词形完整",
    headTilt: 16,
  },
  ccw90: {
    angle: -90,
    badge: "逆流撞车",
    ok: false,
    title: "逆时针 -90°：眼睛被迫先跳到词尾，再从下往上倒爬",
    body: "新手在设计软件里随手点一次向左旋转，西文就变成自下而上阅读。读者刚顺着中文往下读完「秩序」，眼球必须越过整串英文跳到底端再往上爬，读完再跳回底端接下一行汉字，动线连续打结。",
    jumps: "方向折返 2 次 · 视线逆行",
    headTilt: -18,
  },
  upright0: {
    angle: 0,
    badge: "词形碎裂",
    ok: false,
    title: "逐字直立 0°：整句英文被拆成竖排字母柱",
    body: "汉字本身是独立方块，竖排叠放仍能一眼认字；英文则依赖单词整体外形与字母连贯高低（升部 b/d/h、降部 g/p/y）。把整句英文硬竖成字母柱，眼睛只能逐字拼读，而且高度骤增。",
    jumps: "逐字母停顿 · 列高暴涨",
    headTilt: 0,
  },
};

export function initSection01() {
  const btns = [...document.querySelectorAll("[data-flow-mode]")];
  const svg = document.getElementById("sec01-svg");
  const titleEl = document.getElementById("sec01-title");
  const bodyEl = document.getElementById("sec01-body");
  const badgeEl = document.getElementById("sec01-badge");
  const jumpsEl = document.getElementById("sec01-jumps");
  if (!svg || !btns.length) return;

  function render(key) {
    const m = FLOW_MODES[key] || FLOW_MODES.cw90;
    btns.forEach((b) => {
      const on = b.dataset.flowMode === key;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    titleEl.textContent = m.title;
    bodyEl.textContent = m.body;
    badgeEl.textContent = m.badge;
    badgeEl.dataset.state = m.ok ? "ok" : "err";
    jumpsEl.textContent = m.jumps;

    const accent = m.ok ? "#166844" : "#B82914";
    const flowLine =
      key === "cw90"
        ? `<line x1="158" y1="36" x2="158" y2="274" stroke="#166844" stroke-width="2.4" />
           <polyline points="151,264 158,276 165,264" fill="none" stroke="#166844" stroke-width="2.4" />
           <text x="172" y="156" fill="#166844" font-size="12" font-family="DM Mono, Noto Serif SC, monospace">↓ 同向顺流</text>`
        : key === "ccw90"
        ? `<line x1="158" y1="36" x2="158" y2="96" stroke="#46413B" stroke-width="2" />
           <path d="M158 96 C 194 114, 194 210, 158 228" fill="none" stroke="#B82914" stroke-width="1.8" stroke-dasharray="4 4" />
           <line x1="158" y1="224" x2="158" y2="112" stroke="#B82914" stroke-width="2.6" />
           <polyline points="151,122 158,110 165,122" fill="none" stroke="#B82914" stroke-width="2.6" />
           <text x="176" y="166" fill="#B82914" font-size="12" font-family="DM Mono, Noto Serif SC, monospace">↑ 逆流爬坡</text>`
        : `<line x1="158" y1="36" x2="158" y2="96" stroke="#46413B" stroke-width="2" />
           <line x1="158" y1="104" x2="158" y2="246" stroke="#B82914" stroke-width="2" stroke-dasharray="2 8" />
           <circle cx="158" cy="126" r="3" fill="#B82914"/><circle cx="158" cy="150" r="3" fill="#B82914"/>
           <circle cx="158" cy="174" r="3" fill="#B82914"/><circle cx="158" cy="198" r="3" fill="#B82914"/>
           <circle cx="158" cy="222" r="3" fill="#B82914"/>
           <text x="172" y="166" fill="#B82914" font-size="12" font-family="DM Mono, Noto Serif SC, monospace">· 逐字顿挫</text>`;

    const latinMarkup =
      key === "upright0"
        ? `<g fill="#B82914" font-family="Sora, sans-serif" font-weight="600" font-size="15" text-anchor="middle">
             <text x="116" y="128">D</text><text x="116" y="148">e</text><text x="116" y="168">s</text>
             <text x="116" y="188">i</text><text x="116" y="208">g</text><text x="116" y="228">n</text>
           </g>`
        : `<text x="116" y="168" fill="${accent}" font-family="Sora, sans-serif" font-weight="600" font-size="18" text-anchor="middle" dominant-baseline="central" transform="rotate(${m.angle} 116 168)">Design Flow</text>`;

    // 无五官极简阅读倾角几何示意（圆冠+颈轴，绝不画眼口鼻）
    const tiltLabel = key === "cw90" ? "微向右偏，顺势扫读" : key === "ccw90" ? "被迫左歪并倒序寻头" : "正视但需逐字母拆拼";

    svg.innerHTML = `
      <rect x="0" y="0" width="380" height="304" fill="#FBF6EC" />
      <line x1="78" y1="22" x2="78" y2="282" stroke="#C2BAB0" stroke-dasharray="4 4" />
      <line x1="154" y1="22" x2="154" y2="282" stroke="#C2BAB0" stroke-dasharray="4 4" />
      <line x1="116" y1="26" x2="116" y2="278" stroke="rgba(13,12,11,0.12)" stroke-dasharray="2 3" />
      <g fill="#0D0C0B" font-family="Noto Serif SC, serif" font-weight="700" font-size="22" text-anchor="middle">
        <text x="116" y="54">秩</text>
        <text x="116" y="84">序</text>
        <text x="116" y="262">美</text>
        <text x="116" y="290">学</text>
      </g>
      ${latinMarkup}
      ${flowLine}
      <g transform="translate(302 146)">
        <circle cx="0" cy="0" r="56" fill="#F4ECE0" stroke="#DDD5C8" />
        <line x1="0" y1="-48" x2="0" y2="48" stroke="#C2BAB0" stroke-dasharray="3 3" />
        <g transform="rotate(${m.headTilt})">
          <rect x="-10" y="22" width="20" height="18" rx="4" fill="#46413B" />
          <circle cx="0" cy="-2" r="24" fill="#0D0C0B" />
          <line x1="0" y1="-26" x2="0" y2="-38" stroke="${accent}" stroke-width="2.5" />
          <circle cx="0" cy="-38" r="3.5" fill="${accent}" />
        </g>
        <text x="0" y="76" text-anchor="middle" fill="#46413B" font-size="11.5" font-family="Noto Serif SC, serif">${tiltLabel}</text>
      </g>
    `;
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.flowMode)));
  render("cw90");
}

// ---------- 02 Unicode UAX #50 字符分拣台 & 标点流派对比 ----------
const UAX_TOKENS = [
  {
    id: "han",
    glyph: "秩",
    name: "汉字（CJK 表意文字）",
    uax: "U · Upright",
    ot: "默认直立",
    css: "text-orientation: mixed（保持直立）",
    detail: "汉字、假名、全角字符在 UAX #50 中全部归为 U（Upright），无论西文怎么转，中文永远正立在全身方框里。",
    demoAngle: 0,
    demoText: "秩 序",
  },
  {
    id: "word",
    glyph: "Design",
    name: "拉丁单词与短语",
    uax: "R · Rotated",
    ot: "vrt2（顺转 90°）",
    css: "text-orientation: mixed",
    detail: "基础拉丁字母与西文词句归为 R（Rotated）。直排中自动顺时针转 90°，保留单词整体轮廓与下行节奏。",
    demoAngle: 90,
    demoText: "Design",
  },
  {
    id: "year",
    glyph: "2025",
    name: "四位年份与长编号",
    uax: "R · Rotated",
    ot: "vrt2（顺转 90°）",
    css: "text-orientation: mixed",
    detail: "三位及以上的年份、金额、ISBN 编号通常随西文一起顺时针转 90°；逐字直立会把 2025 扯成长串散码。",
    demoAngle: 90,
    demoText: "2025",
  },
  {
    id: "shortnum",
    glyph: "90%",
    name: "两位短数字（纵中横候选）",
    uax: "R · Rotated（可结合 TCY）",
    ot: "hwid / twid",
    css: "text-combine-upright: digits 2;",
    detail: "书刊正文里的两位日期或百分比（如 24 日、90）常采用纵中横（Tate-chu-yoko），把两位压进单个汉字方框横排，读起来最快。",
    demoAngle: "tcy",
    demoText: "90",
  },
  {
    id: "quote",
    glyph: "「」",
    name: "直角引号",
    uax: "Tr · Transformed_Rotated",
    ot: "vert（替换 ﹁ ﹂）",
    css: "font-feature-settings: 'vert' 1;",
    detail: "归属 Tr：有竖排字形时自动替换为 ﹁ ﹂，没有则退回顺时针转 90°。绝不能把横排「」原样硬塞进竖行。",
    demoAngle: "vert",
    demoText: "「」",
  },
  {
    id: "paren",
    glyph: "()",
    name: "圆括号",
    uax: "Tr · Transformed_Rotated",
    ot: "vert（替换 ︵ ︶）",
    css: "font-feature-settings: 'vert' 1;",
    detail: "竖排中括号开口必须朝下和朝上，把行内注释轻轻包住。若忘记转形，左右括号会像两面墙卡住下行视线。",
    demoAngle: "vert",
    demoText: "()",
  },
  {
    id: "stop",
    glyph: "。、",
    name: "句号与顿号",
    uax: "Tu · Transformed_Upright",
    ot: "vert（随地区定位）",
    css: "lang='zh-Hans' / 'zh-Hant'",
    detail: "归属 Tu：先找竖排专用字形，退回时保持直立。大陆与日文习惯置于全身格右上角，港台与 218 原海报则习惯居中对齐。",
    demoAngle: "punct",
    demoText: "。、",
  },
  {
    id: "dash",
    glyph: "——",
    name: "破折号与省略号",
    uax: "Tr · Transformed_Rotated",
    ot: "vert（转为竖线）",
    css: "text-orientation: mixed",
    detail: "破折号与省略号在竖排里必须转为沿列中轴延伸的纵向线条与竖排六点，否则一横直接把竖列拦腰斩断。",
    demoAngle: "vert",
    demoText: "——",
  },
];

export function initSection02() {
  const grid = document.getElementById("uax-grid");
  const card = document.getElementById("uax-detail");
  const punctBtns = [...document.querySelectorAll("[data-punct-style]")];
  const punctPreview = document.getElementById("punct-region-preview");
  const punctNote = document.getElementById("punct-region-note");
  if (!grid || !card) return;

  function selectToken(id) {
    const tk = UAX_TOKENS.find((t) => t.id === id) || UAX_TOKENS[0];
    grid.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.token === tk.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    let previewGlyph = "";
    if (tk.demoAngle === 90) {
      previewGlyph = `<text x="50" y="64" text-anchor="middle" dominant-baseline="central" font-family="Sora, sans-serif" font-weight="600" font-size="20" fill="#0D0C0B" transform="rotate(90 50 64)">${tk.demoText}</text>`;
    } else if (tk.demoAngle === "tcy") {
      previewGlyph = `<rect x="30" y="44" width="40" height="40" fill="rgba(22,104,68,0.1)" stroke="#166844" stroke-dasharray="3 2" />
        <text x="50" y="65" text-anchor="middle" dominant-baseline="central" font-family="Sora, sans-serif" font-weight="700" font-size="20" fill="#0D0C0B">${tk.demoText}</text>`;
    } else if (tk.demoAngle === "vert") {
      previewGlyph = `<text x="50" y="64" text-anchor="middle" dominant-baseline="central" font-family="Noto Serif SC, serif" font-weight="700" font-size="26" fill="#0D0C0B" transform="rotate(90 50 64)">${tk.demoText}</text>`;
    } else if (tk.demoAngle === "punct") {
      previewGlyph = `<rect x="32" y="24" width="36" height="36" fill="none" stroke="#C2BAB0" stroke-dasharray="2 2" />
        <circle cx="50" cy="42" r="4.5" fill="none" stroke="#0D0C0B" stroke-width="2" />
        <rect x="32" y="68" width="36" height="36" fill="none" stroke="#C2BAB0" stroke-dasharray="2 2" />
        <circle cx="60" cy="78" r="4.5" fill="none" stroke="#EB4E1B" stroke-width="2" />`;
    } else {
      previewGlyph = `<text x="50" y="44" text-anchor="middle" dominant-baseline="central" font-family="Noto Serif SC, serif" font-weight="700" font-size="26" fill="#0D0C0B">秩</text>
        <text x="50" y="84" text-anchor="middle" dominant-baseline="central" font-family="Noto Serif SC, serif" font-weight="700" font-size="26" fill="#0D0C0B">序</text>`;
    }

    card.innerHTML = `
      <div class="uax-detail-grid">
        <svg class="uax-mini-svg" viewBox="0 0 100 128" aria-hidden="true">
          <rect x="0" y="0" width="100" height="128" fill="#FFFDF8" />
          <line x1="50" y1="8" x2="50" y2="120" stroke="#DDD5C8" stroke-dasharray="3 3" />
          ${previewGlyph}
        </svg>
        <div class="uax-detail-copy">
          <div class="uax-badges">
            <span class="mono-chip is-dark">${tk.uax}</span>
            <span class="mono-chip">${tk.ot}</span>
          </div>
          <h3>${tk.name}</h3>
          <p>${tk.detail}</p>
          <p class="uax-css"><code>${tk.css}</code></p>
        </div>
      </div>
    `;
  }

  grid.innerHTML = UAX_TOKENS.map(
    (t) =>
      `<button type="button" class="uax-tile" data-token="${t.id}" aria-pressed="false">
         <span class="uax-glyph">${t.glyph}</span>
         <span class="uax-code">${t.uax.split(" · ")[0]}</span>
       </button>`
  ).join("");

  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-token]");
    if (b) selectToken(b.dataset.token);
  });
  selectToken("word");

  // 标点地区规范切换：港台/原海报居中 vs 大陆/日文右上
  function renderPunctRegion(mode) {
    punctBtns.forEach((b) => {
      const on = b.dataset.punctStyle === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const isCenter = mode === "center";
    const ox = isCenter ? 0 : 12;
    const oy = isCenter ? 0 : -12;
    punctNote.textContent = isCenter
      ? "港台繁体直排与 218 原海报规范：顿号、句号落在全身方框正中，与汉字中轴贯通，视觉最匀称。"
      : "大陆简体与日文 CLReq / JLReq 常见规范：顿号、句号靠向全身格右上角，紧贴前字左下收笔，留出左侧换气余白。";

    punctPreview.innerHTML = `
      <svg viewBox="0 0 320 94" aria-hidden="true">
        <rect x="0" y="0" width="320" height="94" fill="#FFFDF8" />
        ${[0, 1, 2, 3, 4]
          .map((i) => {
            const x = 22 + i * 58;
            return `<rect x="${x}" y="22" width="46" height="46" fill="none" stroke="#D5CEC2" stroke-dasharray="3 2" />
                    <line x1="${x + 23}" y1="14" x2="${x + 23}" y2="76" stroke="rgba(235,78,27,0.22)" stroke-dasharray="2 2" />`;
          })
          .join("")}
        <text x="45" y="46" text-anchor="middle" dominant-baseline="central" font-family="Noto Serif SC, serif" font-weight="700" font-size="24" fill="#0D0C0B">直</text>
        <text x="103" y="46" text-anchor="middle" dominant-baseline="central" font-family="Noto Serif SC, serif" font-weight="700" font-size="24" fill="#0D0C0B">排</text>
        <g transform="translate(${161 + ox} ${45 + oy})">
          <path d="M -4 -4 L 4 4" stroke="#EB4E1B" stroke-width="3.2" stroke-linecap="round" />
        </g>
        <text x="219" y="46" text-anchor="middle" dominant-baseline="central" font-family="Noto Serif SC, serif" font-weight="700" font-size="24" fill="#0D0C0B">韵</text>
        <circle cx="${277 + ox}" cy="${45 + oy}" r="5.5" fill="none" stroke="#EB4E1B" stroke-width="2.6" />
        <text x="161" y="85" text-anchor="middle" font-size="11" font-family="DM Mono, monospace" fill="#46413B">${isCenter ? "CENTERED IN EM-BOX" : "TOP-RIGHT QUADRANT"}</text>
      </svg>
    `;
  }

  punctBtns.forEach((b) => b.addEventListener("click", () => renderPunctRegion(b.dataset.punctStyle)));
  renderPunctRegion("center");
}

// ---------- 03 暗房 400% 显微字框放大画布 ----------
export function initSection03() {
  const canvas = document.getElementById("loupe-canvas");
  const modeBtns = [...document.querySelectorAll("[data-loupe-baseline]")];
  const gapBtns = [...document.querySelectorAll("[data-loupe-gap]")];
  const scaleInput = document.getElementById("loupe-scale");
  const scaleVal = document.getElementById("loupe-scale-val");
  const guideToggle = document.getElementById("loupe-guides");
  const readout = document.getElementById("loupe-readout");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const st = {
    baseline: "alphabetic", // "alphabetic" | "central"
    gap: 0.25, // 0 | 0.25 | 0.5 em
    scale: 0.92,
    guides: true,
  };
  let w = 640;
  let h = 360;
  let dpr = 1;
  let dirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    w = r.width;
    h = r.height;
    dpr = pixelRatio(2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    dirty = true;
  }

  function updateReadout() {
    if (!readout) return;
    const notes = [];
    if (st.baseline === "alphabetic") {
      notes.push("当前直接套用西文字母基线（alphabetic），顺转后小写字母的主体视觉重心向右偏离汉字中轴，整行像贴着右侧在走。");
    } else {
      notes.push("已切到光学中轴（central），把西文 x-height 的中线精准对准汉字全身方框中心，中英切换时视线零晃动。");
    }
    if (st.gap === 0) notes.push("中西间隙为 0em，汉字笔画与字母首尾直接贴撞。");
    else if (st.gap === 0.25) notes.push("加入 1/4 em 四分空（CLReq / JLReq 常见经验值），中英交界呼吸分明又不断行。");
    else notes.push("1/2 em 间隙偏宽，容易把同一句里的英文拆成孤岛。");
    readout.textContent = notes.join("");
  }

  function draw(t, dt, { still }) {
    if (!dirty && !still) return;
    dirty = false;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#1B1815";
    ctx.fillRect(0, 0, w, h);

    // 横放单条直排切片（相当于把一条竖行放大 400% 后平铺检视，或者竖排宽屏直接从上到下切片）
    // 实际上直接画成横剖面或真竖行？画成「真竖行 2.6× 显微剖面 + 侧边几何读尺」最直觉！
    const em = Math.min(58, Math.max(36, h * 0.145));
    const cx = w * 0.42;
    const gapPx = em * st.gap;
    const latinPx = em * st.scale;

    // 标尺中心轴（垂直贯穿）
    if (st.guides) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 117, 71, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 18);
      ctx.lineTo(cx, h - 18);
      ctx.stroke();

      // 左右全身字框边界线
      ctx.strokeStyle = "rgba(247, 241, 230, 0.16)";
      ctx.beginPath();
      ctx.moveTo(cx - em / 2, 18);
      ctx.lineTo(cx - em / 2, h - 18);
      ctx.moveTo(cx + em / 2, 18);
      ctx.lineTo(cx + em / 2, h - 18);
      ctx.stroke();
      ctx.restore();
    }

    // 上方汉字「排」
    const yTopHan = Math.max(46, h * 0.15);
    if (st.guides) {
      ctx.strokeStyle = "rgba(247, 241, 230, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - em / 2, yTopHan - em / 2, em, em);
    }
    ctx.fillStyle = "#F7F1E6";
    ctx.font = `700 ${Math.round(em * 0.88)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("排", cx, yTopHan);

    // 间隙标注带（上方 1/4 em）
    const latinLen = latinPx * 3.15;
    const yLatStart = yTopHan + em / 2 + gapPx;
    const yLatMid = yLatStart + latinLen / 2;
    const yBotHan = yLatStart + latinLen + gapPx + em / 2;

    if (st.guides && gapPx > 1) {
      ctx.fillStyle = st.gap === 0.25 ? "rgba(106, 224, 163, 0.18)" : "rgba(255, 117, 71, 0.18)";
      ctx.fillRect(cx - em / 2, yTopHan + em / 2, em, gapPx);
      ctx.fillRect(cx - em / 2, yLatStart + latinLen, em, gapPx);
    }

    // 中间顺转西文「Design」
    // alphabetic 模式下，字母基线紧贴中心轴导致视觉重心偏向右侧（+em*0.18）
    const offset = st.baseline === "alphabetic" ? em * 0.18 : 0;
    ctx.save();
    ctx.translate(cx + offset, yLatMid);
    ctx.rotate(Math.PI / 2);

    if (st.guides) {
      // x-height 带
      const xh = latinPx * 0.52;
      ctx.fillStyle = st.baseline === "central" ? "rgba(106, 224, 163, 0.16)" : "rgba(255, 117, 71, 0.18)";
      ctx.fillRect(-latinLen / 2, -xh / 2, latinLen, xh);
      // 字母基线
      ctx.strokeStyle = "#FF7547";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-latinLen / 2, latinPx * 0.27);
      ctx.lineTo(latinLen / 2, latinPx * 0.27);
      ctx.stroke();
    }

    ctx.fillStyle = st.baseline === "central" ? "#F7F1E6" : "#FF8A65";
    ctx.font = `600 ${Math.round(latinPx)}px "Sora", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Design", 0, 0);
    ctx.restore();

    // 下方汉字「韵」
    if (yBotHan + em / 2 <= h - 6) {
      if (st.guides) {
        ctx.strokeStyle = "rgba(247, 241, 230, 0.28)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - em / 2, yBotHan - em / 2, em, em);
      }
      ctx.fillStyle = "#F7F1E6";
      ctx.font = `700 ${Math.round(em * 0.88)}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("韵", cx, yBotHan);
    }

    // 右侧几何注释标注
    const rx = cx + em * 0.85;
    if (rx + 110 < w) {
      ctx.save();
      ctx.font = `500 11.5px "DM Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#C8BFB2";
      ctx.fillText("1.00 em 全身字框", rx, yTopHan);
      ctx.fillStyle = st.gap === 0.25 ? "#6AE0A3" : "#FF7547";
      ctx.fillText(`间隙 ${st.gap === 0 ? "0 em（贴撞）" : st.gap === 0.25 ? "1/4 em（四分空）" : "1/2 em（偏松）"}`, rx, yTopHan + em / 2 + Math.max(10, gapPx / 2));

      ctx.fillStyle = st.baseline === "central" ? "#6AE0A3" : "#FF7547";
      ctx.fillText(st.baseline === "central" ? "x-height 对齐中轴" : "alphabetic 基线偏右", rx, yLatMid - 10);
      ctx.fillStyle = "#C8BFB2";
      ctx.fillText(`西文视觉比例 ${Math.round(st.scale * 100)}%`, rx, yLatMid + 12);
      ctx.restore();
    }

    ctx.restore();
  }

  const runner = loop(canvas, draw);
  new ResizeObserver(() => {
    resize();
    runner.draw();
  }).observe(canvas);

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.baseline = b.dataset.loupeBaseline;
      modeBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      dirty = true;
      updateReadout();
      runner.draw();
    })
  );

  gapBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.gap = parseFloat(b.dataset.loupeGap);
      gapBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      dirty = true;
      updateReadout();
      runner.draw();
    })
  );

  if (scaleInput) {
    scaleInput.addEventListener("input", () => {
      st.scale = parseFloat(scaleInput.value) / 100;
      if (scaleVal) scaleVal.textContent = `${Math.round(st.scale * 100)}%`;
      dirty = true;
      updateReadout();
      runner.draw();
    });
  }

  if (guideToggle) {
    guideToggle.addEventListener("click", () => {
      st.guides = !st.guides;
      guideToggle.textContent = st.guides ? "字框标尺：开" : "字框标尺：关";
      guideToggle.setAttribute("aria-pressed", String(st.guides));
      dirty = true;
      runner.draw();
    });
  }

  resize();
  updateReadout();
  runner.draw();
}

// ---------- 04 历史编年卷轴 & 实操代码切换 ----------
const TIMELINE = [
  {
    year: "铅字时期",
    title: "活字版面里的机械解法",
    tag: "LETTERPRESS",
    body: "近代东亚报刊与双语书籍在直排铅字行中遇到拉丁词句时，排字工直接将横排西文铅字整段顺时针转 90° 嵌入直行，用铅空垫齐汉字全身方格网——这既不破坏书行宽度，也让读者偏一次头就能连贯读完外文。",
  },
  {
    year: "1993–2004",
    title: "JIS X 4051《日本語文書の組版方法》",
    tag: "JIS STANDARD",
    body: "日本工业标准 JIS X 4051 在 1993 年初版仅覆盖横排，1995 年修订版正式纳入纵排、和欧文混排与连数字处理，2004 年再度扩充字符类别，首次在国家标准层面把「直排中欧文顺时针 90° 与短数纵中横」写成了可计算的排版规则。",
  },
  {
    year: "2009 / 2012",
    title: "W3C JLReq《日文排版需求》",
    tag: "W3C NOTE",
    body: "2009 年 6 月 4 日发布第一版、2012 年 4 月 3 日发布第二版 W3C Working Group Note，以 JIS X 4051 为基础系统梳理直排中和欧文混排、四分空间距与行头行尾禁则，为现代浏览器引擎提供了规范蓝图。",
  },
  {
    year: "2015",
    title: "W3C CLReq《中文排版需求》",
    tag: "W3C DRAFT",
    body: "2015 年 7 月 23 日发布首份公开工作草案，细致记录了中文直排下西文顺转 90°、短缩写直立与标点定位差异——明确对照了大陆标点偏右上、港台标点居中的两套传统。",
  },
  {
    year: "2017",
    title: "Unicode 10.0 · UAX #50 纳入标准",
    tag: "UNICODE UCD",
    body: "2017 年 6 月 20 日发布的 Unicode 10.0.0 正式将 UAX #50（Unicode Vertical Text Layout）并入字符数据库，为全球全部码位指定 Vertical_Orientation 属性（U / R / Tr / Tu），终结了不同软件各转各的乱象。",
  },
  {
    year: "2019",
    title: "CSS Writing Modes Level 3 正式推荐",
    tag: "W3C REC",
    body: "由 Elika J. Etemad 与 Koji Ishii 等人编辑，2019 年 12 月 10 日成为 W3C 正式推荐标准。如今只需两行 CSS（writing-mode: vertical-rl 与 text-orientation: mixed）加上字体的 OpenType vert / vrt2 特性，网页即可原生完成规范直排转向。",
  },
];

const IMPL_SPECS = {
  css: {
    label: "网页 CSS（W3C 推荐标准）",
    code: `.vertical-mixed {\n  writing-mode: vertical-rl;   /* 自上而下，列从右至左 */\n  text-orientation: mixed;     /* 汉字直立，西文顺转 90° */\n  font-feature-settings: "vert" 1;\n}\n.short-num {\n  text-combine-upright: all;   /* 两位短数字纵中横 */\n}`,
    tip: "现代 Chrome、Safari、Firefox 均原生支持 writing-mode: vertical-rl 与 text-orientation: mixed，不需要手动用 transform: rotate(90deg) 硬拼。",
  },
  print: {
    label: "平面与出版软件（InDesign / 排版规范）",
    code: `1. 文本框切为「直排文本」（Vertical Type），避免用回车硬敲竖列\n2. 保持字符旋转「默认自动转向」（拉丁与长数字自动顺时针 +90°）\n3. 两位短数字（如 24、90）局部开启「纵中横」\n4. 避头尾禁则与「标点挤压 / 居中或右上」按目标地区统一设定`,
    tip: "千万不要把横排文字按字敲回车来假装竖排：那样不仅西文碎成字母柱，连括号、引号和顿句号也会全部停留在横排错位上。",
  },
};

export function initSection04() {
  const nav = document.getElementById("timeline-nav");
  const panel = document.getElementById("timeline-panel");
  const specBtns = [...document.querySelectorAll("[data-impl-spec]")];
  const specCode = document.getElementById("impl-code");
  const specTip = document.getElementById("impl-tip");

  if (nav && panel) {
    nav.innerHTML = TIMELINE.map(
      (item, idx) =>
        `<button type="button" class="tl-btn${idx === 0 ? " is-active" : ""}" data-tl="${idx}" aria-pressed="${idx === 0}">
           <span class="tl-year">${item.year}</span>
           <span class="tl-short">${item.tag}</span>
         </button>`
    ).join("");

    function show(idx) {
      const item = TIMELINE[idx] || TIMELINE[0];
      nav.querySelectorAll(".tl-btn").forEach((b, i) => {
        b.classList.toggle("is-active", i === idx);
        b.setAttribute("aria-pressed", String(i === idx));
      });
      panel.innerHTML = `
        <div class="tl-head">
          <span class="mono-chip is-vermilion">${item.year}</span>
          <span class="mono-chip">${item.tag}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      `;
    }

    nav.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tl]");
      if (b) show(Number(b.dataset.tl));
    });
    show(0);
  }

  if (specBtns.length && specCode && specTip) {
    function showSpec(key) {
      const sp = IMPL_SPECS[key] || IMPL_SPECS.css;
      specBtns.forEach((b) => {
        const on = b.dataset.implSpec === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      specCode.textContent = sp.code;
      specTip.textContent = sp.tip;
    }
    specBtns.forEach((b) => b.addEventListener("click", () => showSpec(b.dataset.implSpec)));
    showSpec("css");
  }
}

// ---------- 05 适用与避坑滤镜 ----------
export function initSection05() {
  const btns = [...document.querySelectorAll("[data-scene-filter]")];
  const cards = [...document.querySelectorAll("[data-scene-kind]")];
  if (!btns.length || !cards.length) return;

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      const f = b.dataset.sceneFilter;
      btns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      cards.forEach((c) => {
        const match = f === "all" || c.dataset.sceneKind === f;
        c.hidden = !match;
      });
    })
  );
}

// ---------- 06 双题单变量小练习 ----------
const QUIZ_ROUNDS = {
  r1: {
    prompt: "同一张竖排展讯签，四份样张的字体、字号、标点与列宽完全相同，只差「西文与年份的朝向处理」这一个变量。哪一份最顺畅？",
    correct: "B",
    options: [
      {
        id: "A",
        label: "样张 A",
        kind: "ccw",
        reason: "英文与年份被逆时针转了 -90°，读者刚顺着中文往下读完「设计展」，必须跳到底部再从下往上倒爬，动线直接撞车。",
      },
      {
        id: "B",
        label: "样张 B",
        kind: "cw",
        reason: "正确。西文与年份统一顺时针转 +90° 且对齐中文中轴，从顶到底一路顺流，兼顾英文词形识别与纵列秩序。",
      },
      {
        id: "C",
        label: "样张 C",
        kind: "stack",
        reason: "把英文整句拆成逐字直立柱，单词外形完全碎裂，视觉高度暴涨，扫读极费力。",
      },
      {
        id: "D",
        label: "样张 D",
        kind: "horiz",
        reason: "把多字母英文原样横插进竖列里，瞬间撑破列宽撞向左右邻列，破坏了直排最核心的纵行边界。",
      },
    ],
  },
  r2: {
    prompt: "同一句直排书摘「读懂（直排）节奏。」，四份样张只差「标点字形与定位」这一个变量。哪一份合乎直排规矩？",
    correct: "C",
    options: [
      {
        id: "A",
        label: "样张 A",
        kind: "p_raw",
        reason: "括号直接沿用横排左右开合形态，句号留在左下角，整列垂直中轴被扯歪。",
      },
      {
        id: "B",
        label: "样张 B",
        kind: "p_flip",
        reason: "括号转成了逆时针 -90° 朝外反扣，开口背离被包裹的「直排」二字，语义归属完全颠倒。",
      },
      {
        id: "C",
        label: "样张 C",
        kind: "p_ok",
        reason: "正确。圆括号启用竖排形态上下抱住「直排」，句号规整落于全身方框中轴，与中文纵列浑然一体。",
      },
      {
        id: "D",
        label: "样张 D",
        kind: "p_crush",
        reason: "标点被硬挤进字缝且未留全身方框呼吸位，句子停顿节奏塌陷，读写粘连。",
      },
    ],
  },
};

function renderQuizSvg(kind, revealed, isCorrect) {
  const accent = !revealed ? "#0D0C0B" : isCorrect ? "#166844" : "#B82914";
  if (kind === "cw" || kind === "ccw" || kind === "stack" || kind === "horiz") {
    let mid = "";
    let flow = "";
    if (kind === "cw") {
      mid = `<text x="72" y="138" text-anchor="middle" dominant-baseline="central" font-family="Sora, sans-serif" font-weight="600" font-size="13.5" fill="${accent}" transform="rotate(90 72 138)">Design 2025</text>`;
      if (revealed) flow = `<line x1="104" y1="24" x2="104" y2="210" stroke="#166844" stroke-width="2"/><polyline points="99,202 104,212 109,202" fill="none" stroke="#166844" stroke-width="2"/>`;
    } else if (kind === "ccw") {
      mid = `<text x="72" y="138" text-anchor="middle" dominant-baseline="central" font-family="Sora, sans-serif" font-weight="600" font-size="13.5" fill="${accent}" transform="rotate(-90 72 138)">Design 2025</text>`;
      if (revealed) flow = `<line x1="104" y1="186" x2="104" y2="92" stroke="#B82914" stroke-width="2" stroke-dasharray="3 3"/><polyline points="99,100 104,90 109,100" fill="none" stroke="#B82914" stroke-width="2"/>`;
    } else if (kind === "stack") {
      const chs = ["D", "e", "s", "i", "g", "n", "2", "5"];
      mid = chs
        .map(
          (c, i) =>
            `<text x="72" y="${94 + i * 12.6}" text-anchor="middle" dominant-baseline="central" font-family="Sora, sans-serif" font-weight="600" font-size="11.5" fill="${accent}">${c}</text>`
        )
        .join("");
      if (revealed) flow = `<line x1="104" y1="90" x2="104" y2="188" stroke="#B82914" stroke-width="2" stroke-dasharray="2 7"/>`;
    } else {
      mid = `<text x="72" y="136" text-anchor="middle" dominant-baseline="central" font-family="Sora, sans-serif" font-weight="600" font-size="13" fill="${accent}">Design 2025</text>`;
      if (revealed) flow = `<rect x="26" y="122" width="92" height="28" fill="rgba(184,41,20,0.14)" stroke="#B82914" stroke-dasharray="3 2"/>`;
    }
    return `
      <svg class="quiz-svg" viewBox="0 0 144 228" aria-hidden="true">
        <rect x="0" y="0" width="144" height="228" fill="#FBF6EC" />
        <line x1="48" y1="14" x2="48" y2="214" stroke="#CCC4B8" stroke-dasharray="3 3" />
        <line x1="96" y1="14" x2="96" y2="214" stroke="#CCC4B8" stroke-dasharray="3 3" />
        <g fill="#0D0C0B" font-family="Noto Serif SC, serif" font-weight="700" font-size="18" text-anchor="middle">
          <text x="72" y="34">设</text>
          <text x="72" y="58">计</text>
          <text x="72" y="80">展</text>
          <text x="72" y="210">京</text>
        </g>
        ${mid}
        ${flow}
      </svg>`;
  }

  // Round 2: 标点
  const pCol = revealed ? (isCorrect ? "#166844" : "#B82914") : "#EB4E1B";
  let pMarkup = "";
  if (kind === "p_raw") {
    pMarkup = `
      <text x="72" y="76" text-anchor="middle" dominant-baseline="central" font-size="17" fill="${pCol}">(</text>
      <text x="72" y="150" text-anchor="middle" dominant-baseline="central" font-size="17" fill="${pCol}">)</text>
      <circle cx="62" cy="206" r="3.6" fill="none" stroke="${pCol}" stroke-width="2" />`;
  } else if (kind === "p_flip") {
    pMarkup = `
      <text x="72" y="76" text-anchor="middle" dominant-baseline="central" font-size="18" fill="${pCol}" transform="rotate(-90 72 76)">(</text>
      <text x="72" y="150" text-anchor="middle" dominant-baseline="central" font-size="18" fill="${pCol}" transform="rotate(-90 72 150)">)</text>
      <circle cx="72" cy="202" r="3.6" fill="none" stroke="${pCol}" stroke-width="2" />`;
  } else if (kind === "p_ok") {
    pMarkup = `
      <text x="72" y="76" text-anchor="middle" dominant-baseline="central" font-size="18" fill="${pCol}" transform="rotate(90 72 76)">(</text>
      <text x="72" y="150" text-anchor="middle" dominant-baseline="central" font-size="18" fill="${pCol}" transform="rotate(90 72 150)">)</text>
      <circle cx="72" cy="202" r="3.6" fill="none" stroke="${pCol}" stroke-width="2" />`;
  } else {
    pMarkup = `
      <text x="72" y="88" text-anchor="middle" dominant-baseline="central" font-size="12" fill="${pCol}" transform="rotate(90 72 88)">(</text>
      <text x="72" y="138" text-anchor="middle" dominant-baseline="central" font-size="12" fill="${pCol}" transform="rotate(90 72 138)">)</text>
      <circle cx="72" cy="189" r="2.6" fill="none" stroke="${pCol}" stroke-width="1.6" />`;
  }

  return `
    <svg class="quiz-svg" viewBox="0 0 144 228" aria-hidden="true">
      <rect x="0" y="0" width="144" height="228" fill="#FBF6EC" />
      <line x1="48" y1="14" x2="48" y2="214" stroke="#CCC4B8" stroke-dasharray="3 3" />
      <line x1="96" y1="14" x2="96" y2="214" stroke="#CCC4B8" stroke-dasharray="3 3" />
      <g fill="#0D0C0B" font-family="Noto Serif SC, serif" font-weight="700" font-size="17.5" text-anchor="middle">
        <text x="72" y="34">读</text>
        <text x="72" y="56">懂</text>
        <text x="72" y="102">直</text>
        <text x="72" y="126">排</text>
        <text x="72" y="176">节</text>
      </g>
      ${pMarkup}
    </svg>`;
}

export function initSection06() {
  const roundBtns = [...document.querySelectorAll("[data-quiz-round]")];
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");
  if (!grid || !promptEl || !fb) return;

  let curRound = "r1";
  const picked = { r1: null, r2: null };

  function render() {
    const q = QUIZ_ROUNDS[curRound];
    const ans = picked[curRound];
    const revealed = ans !== null;

    roundBtns.forEach((b) => {
      const on = b.dataset.quizRound === curRound;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    promptEl.textContent = q.prompt;
    grid.innerHTML = q.options
      .map((op) => {
        const isPicked = ans === op.id;
        const isCorrect = op.id === q.correct;
        const cls = [
          "quiz-card",
          revealed && isCorrect ? "is-right" : "",
          revealed && isPicked && !isCorrect ? "is-wrong" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `
          <button type="button" class="${cls}" data-quiz-pick="${op.id}" aria-pressed="${isPicked}">
            <div class="quiz-card-top">
              <span class="quiz-label">${op.label}</span>
              ${revealed ? `<span class="quiz-mark">${isCorrect ? "✓ 正确" : isPicked ? "× 已选" : ""}</span>` : ""}
            </div>
            ${renderQuizSvg(op.kind, revealed, isCorrect)}
            ${revealed ? `<p class="quiz-reason">${op.reason}</p>` : ""}
          </button>`;
      })
      .join("");

    if (!revealed) {
      fb.innerHTML = `<p class="quiz-hint">四张样张仅差一个排版变量，点选你认为最顺眼、最合乎规矩的一份。</p>`;
    } else {
      const hit = ans === q.correct;
      const chosen = q.options.find((o) => o.id === ans);
      const right = q.options.find((o) => o.id === q.correct);
      fb.innerHTML = `
        <div class="quiz-verdict ${hit ? "is-ok" : "is-err"}">
          <strong>${hit ? `判断准确：${right.label}成立。` : `你选了 ${chosen.label}，正确答案是 ${right.label}。`}</strong>
          <p>${hit ? right.reason : `${chosen.reason} ${right.reason}`}</p>
          <button type="button" class="btn-ghost-dark" id="quiz-retry">重做本题</button>
        </div>
      `;
      const retry = document.getElementById("quiz-retry");
      if (retry) {
        retry.addEventListener("click", () => {
          picked[curRound] = null;
          render();
        });
      }
    }
  }

  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-quiz-pick]");
    if (!b) return;
    picked[curRound] = b.dataset.quizPick;
    render();
  });

  roundBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curRound = b.dataset.quizRound;
      render();
    })
  );

  render();
}

// ---------- 07 原海报灯箱（点击放大、拖动、滚轮、Esc 关闭） ----------
export function initPosterLightbox() {
  const img = document.getElementById("poster");
  const openBtn = document.getElementById("poster-zoom-btn");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbClose = document.getElementById("lightbox-close");
  const lbIn = document.getElementById("lb-zoom-in");
  const lbOut = document.getElementById("lb-zoom-out");
  const lbReset = document.getElementById("lb-zoom-reset");
  const stage = document.getElementById("lightbox-stage");
  if (!img || !lb || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = img.currentSrc || img.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    lb.hidden = false;
    lbClose?.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn?.focus();
  }

  img.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  lbClose?.addEventListener("click", close);
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });

  lbIn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    apply();
  });
  lbOut?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });
  lbReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
  stage.addEventListener(
    "wheel",
    (e) => {
      if (lb.hidden) return;
      e.preventDefault();
      scale = Math.min(3.5, Math.max(0.8, +(scale + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)));
      apply();
    },
    { passive: false }
  );
}
