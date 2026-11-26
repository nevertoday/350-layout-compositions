// 215 直排左起 · 正文 01–07 节专属互动模块（相邻节控件各异）

const COMPASS_DATA = {
  "212": {
    title: "212 横排左起",
    axis: "行内：左 → 右 · 换行：上 → 下",
    spine: "左装订（向左翻页）",
    desc: "现代屏幕与简体中文长文的主力格式：起点在左上角，横向扫读、逐行下移，与绝大多数桌面与手机界面一致。",
    link: "https://layout.xiaoxiaodong.ai/212/play/",
    draw: () => `
      <rect x="20" y="18" width="320" height="184" fill="#FFFDF5" stroke="#141512" stroke-width="2"/>
      <rect x="20" y="18" width="12" height="184" fill="#141512"/>
      <circle cx="52" cy="46" r="8" fill="#D81511"/>
      <text x="52" y="50" text-anchor="middle" fill="#FFF" font-size="10" font-family="DM Mono, monospace" font-weight="700">起</text>
      <path d="M68 46 H312 M304 40 l8 6 -8 6" fill="none" stroke="#141512" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52 88 H312 M304 82 l8 6 -8 6" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>
      <path d="M52 130 H312 M304 124 l8 6 -8 6" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.52"/>
      <path d="M52 172 H240" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" opacity="0.4"/>
      <path d="M322 52 V170 M316 162 l6 8 6-8" fill="none" stroke="#D81511" stroke-width="1.8" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="48" y="192" fill="#464332" font-size="11" font-family="Noto Sans SC, sans-serif">左装订书脊 · 起点左上 · 逐行下移</text>
    `,
  },
  "213": {
    title: "213 横排右起",
    axis: "行内：右 → 左（或右锚重心） · 换行：上 → 下",
    spine: "右起焦点 / 阿拉伯语与希伯来语右装订",
    desc: "起点锚在右上角，目光由右向左推进。在阿拉伯文、希伯来文中是标准行款，在东亚广告横幅里常用来建立右侧焦点牵引。",
    link: "https://layout.xiaoxiaodong.ai/213/play/",
    draw: () => `
      <rect x="20" y="18" width="320" height="184" fill="#FFFDF5" stroke="#141512" stroke-width="2"/>
      <rect x="328" y="18" width="12" height="184" fill="#141512"/>
      <circle cx="308" cy="46" r="8" fill="#D81511"/>
      <text x="308" y="50" text-anchor="middle" fill="#FFF" font-size="10" font-family="DM Mono, monospace" font-weight="700">起</text>
      <path d="M292 46 H48 M56 40 l-8 6 8 6" fill="none" stroke="#141512" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M308 88 H48 M56 82 l-8 6 8 6" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>
      <path d="M308 130 H48 M56 124 l-8 6 8 6" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.52"/>
      <path d="M308 172 H120" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" opacity="0.4"/>
      <path d="M36 52 V170 M30 162 l6 8 6-8" fill="none" stroke="#D81511" stroke-width="1.8" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="50" y="192" fill="#464332" font-size="11" font-family="Noto Sans SC, sans-serif">起点右上 · 横向由右向左 · 逐行下移</text>
    `,
  },
  "214": {
    title: "214 直排右起",
    axis: "列内：上 → 下 · 换列：右 → 左",
    spine: "右装订（向右翻页）",
    desc: "传统中日韩竖排书刊的正统行款：从右上角第一列起笔，自上而下读完一列后向左跳入下一列，最契合中文读者的古籍与诗词阅读惯性。",
    link: "https://layout.xiaoxiaodong.ai/214/play/",
    draw: () => `
      <rect x="20" y="18" width="320" height="184" fill="#FFFDF5" stroke="#141512" stroke-width="2"/>
      <rect x="328" y="18" width="12" height="184" fill="#141512"/>
      <circle cx="298" cy="42" r="8" fill="#D81511"/>
      <text x="298" y="46" text-anchor="middle" fill="#FFF" font-size="10" font-family="DM Mono, monospace" font-weight="700">1</text>
      <path d="M298 56 V164 M292 156 l6 8 6-8" fill="none" stroke="#141512" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M236 42 V164 M230 156 l6 8 6-8" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.78"/>
      <path d="M174 42 V164 M168 156 l6 8 6-8" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.58"/>
      <path d="M112 42 V164 M106 156 l6 8 6-8" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.42"/>
      <path d="M286 184 H74 M82 178 l-8 6 8 6" fill="none" stroke="#D81511" stroke-width="2" stroke-dasharray="5 3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="48" y="190" fill="#9E0E0B" font-size="11" font-family="Noto Sans SC, sans-serif" font-weight="700">← 换列右起</text>
    `,
  },
  "215": {
    title: "215 直排左起（本页）",
    axis: "列内：上 → 下 · 换列：左 → 右",
    spine: "左装订（向左翻页）",
    desc: "传统蒙古文与满文的标准行款，也用于现代左翻画册、展墙年表与海报：起点钉死左上角，单列纵向落读、列与列稳步向右推进。",
    link: null,
    draw: () => `
      <rect x="20" y="18" width="320" height="184" fill="#FDD602" stroke="#141512" stroke-width="2"/>
      <rect x="20" y="18" width="12" height="184" fill="#141512"/>
      <circle cx="62" cy="42" r="8.5" fill="#D81511"/>
      <text x="62" y="46" text-anchor="middle" fill="#FFF" font-size="10" font-family="DM Mono, monospace" font-weight="700">1</text>
      <path d="M62 56 V162 M56 154 l6 8 6-8" fill="none" stroke="#141512" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M124 42 V162 M118 154 l6 8 6-8" fill="none" stroke="#141512" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.82"/>
      <path d="M186 42 V162 M180 154 l6 8 6-8" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>
      <path d="M248 42 V162 M242 154 l6 8 6-8" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
      <path d="M306 42 V162 M300 154 l6 8 6-8" fill="none" stroke="#141512" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.38"/>
      <path d="M62 184 H302 M294 178 l8 6 -8 6" fill="none" stroke="#D81511" stroke-width="2.2" stroke-dasharray="5 3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="64" y="177" fill="#9E0E0B" font-size="11" font-family="Noto Sans SC, sans-serif" font-weight="700">起点左上 · 列序自左向右推进 →</text>
    `,
  },
};

export function initCompass() {
  const app = document.getElementById("compassApp");
  const svg = document.getElementById("compassSvg");
  const out = document.getElementById("compassReadout");
  if (!app || !svg || !out) return;

  function select(id) {
    const item = COMPASS_DATA[id];
    if (!item) return;
    app.querySelectorAll(".q-btn").forEach((b) => {
      const on = b.dataset.dir === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    svg.innerHTML = item.draw();
    const linkHtml = item.link
      ? ` <a href="${item.link}" target="_blank" rel="noopener">前往 ${item.title} 专页 →</a>`
      : "";
    out.innerHTML = `<strong>${item.axis}</strong>（${item.spine}）。${item.desc}${linkHtml}`;
  }

  app.querySelectorAll(".q-btn").forEach((b) => {
    b.addEventListener("click", () => select(b.dataset.dir));
  });
  select("215");
}

// ==================== 02 · 90° 逆时针旋转几何实验 ====================
export function initRotator() {
  const svg = document.getElementById("rotatorSvg");
  const range = document.getElementById("rotRange");
  const label = document.getElementById("rotDegLabel");
  const note = document.getElementById("rotNote");
  const btns = [...document.querySelectorAll(".rot-step-btn")];
  if (!svg || !range || !label || !note) return;

  function render(deg) {
    range.value = String(deg);
    const stageText =
      deg <= 8
        ? `${deg}°（右起横排原貌）`
        : deg >= 82
          ? `${deg}°（直排左起定型）`
          : `${deg}°（逆时针旋转中）`;
    label.textContent = stageText;

    btns.forEach((b) => b.classList.toggle("is-active", Math.abs(+b.dataset.deg - deg) <= 4));

    if (deg <= 12) {
      note.textContent = "旋转前：早期粟特/古回鹘文像阿拉伯文一样「自右向左横写」，写完第 1 行（红线）后向下换行写第 2、3 行。";
    } else if (deg < 78) {
      note.textContent = "逆时针旋转途中：留意原本居上的「第 1 行（红线）」正顺势转往页面左侧，行内流向也从「向左」转为「向下」。";
    } else {
      note.textContent = "逆时针转满 90° 后：第 1 行稳稳落在了最左列、由上而下书写，原本向下的第 2、3 行自然排向右侧——这就是传统蒙古文与满文成为直排左起的几何原因。";
    }

    // SVG 围绕中心 (180, 120) 逆时针旋转 (-deg)
    svg.innerHTML = `
      <defs>
        <marker id="rotArrR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9" fill="none" stroke="#D81511" stroke-width="2"/>
        </marker>
        <marker id="rotArrK" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9" fill="none" stroke="#141512" stroke-width="2"/>
        </marker>
      </defs>
      <circle cx="180" cy="120" r="88" fill="none" stroke="rgba(20,21,18,0.16)" stroke-dasharray="4 4"/>
      <g transform="translate(180 120) rotate(${-deg})">
        <rect x="-76" y="-62" width="152" height="124" rx="3" fill="#FFFDF5" stroke="#141512" stroke-width="2"/>
        <!-- 第 1 行（红色起点行：原右起横排第 1 行，旋 90° 后变成最左第 1 列） -->
        <circle cx="52" cy="-34" r="7" fill="#D81511"/>
        <line x1="42" y1="-34" x2="-52" y2="-34" stroke="#D81511" stroke-width="3.2" marker-end="url(#rotArrR)"/>
        <text x="58" y="-44" text-anchor="end" fill="#9E0E0B" font-size="11" font-family="DM Mono, monospace" font-weight="700">L1 起点</text>
        <!-- 第 2 行 -->
        <line x1="52" y1="0" x2="-52" y2="0" stroke="#141512" stroke-width="2.4" marker-end="url(#rotArrK)"/>
        <text x="58" y="-10" text-anchor="end" fill="#464332" font-size="10.5" font-family="DM Mono, monospace">L2</text>
        <!-- 第 3 行 -->
        <line x1="52" y1="34" x2="-52" y2="34" stroke="#141512" stroke-width="2.4" opacity="0.68" marker-end="url(#rotArrK)"/>
        <text x="58" y="24" text-anchor="end" fill="#464332" font-size="10.5" font-family="DM Mono, monospace">L3</text>
        <!-- 换行 / 换列向量 -->
        <line x1="-64" y1="-36" x2="-64" y2="38" stroke="#D81511" stroke-width="1.8" stroke-dasharray="3 3" marker-end="url(#rotArrR)"/>
      </g>
      <text x="16" y="226" fill="#464332" font-size="11" font-family="Noto Sans SC, sans-serif">
        ${deg >= 82 ? "现在：L1 在最左，列内 ↓ 书写，换列 L1→L2→L3 向右展开" : "提示：拖滑杆把纸张逆时针转满 90°，观察红线 L1 落到哪一侧"}
      </text>
    `;
  }

  range.addEventListener("input", () => render(+range.value));
  btns.forEach((b) => b.addEventListener("click", () => render(+b.dataset.deg)));
  render(90);
}

// ==================== 03 · 原生真 CSS 暗室灯箱 ====================
export function initCssLab() {
  const lab = document.getElementById("cssLab");
  const box = document.getElementById("cssLiveBox");
  const code = document.getElementById("cssLabCode");
  const verdict = document.getElementById("cssLabVerdict");
  const ind = document.getElementById("cssOriginInd");
  const indText = document.getElementById("cssOriginText");
  if (!lab || !box || !code || !verdict) return;

  const st = { wm: "vertical-lr", lh: "1.95", ls: "0.10em", to: "mixed" };

  function sync() {
    box.style.writingMode = st.wm;
    box.style.lineHeight = st.lh;
    box.style.letterSpacing = st.ls;
    box.style.textOrientation = st.to;

    code.textContent = `writing-mode: ${st.wm}; line-height: ${st.lh}; letter-spacing: ${st.ls}; text-orientation: ${st.to};`;

    const isRtl = st.wm === "vertical-rl";
    ind.classList.toggle("is-rtl", isRtl);
    indText.textContent = isRtl
      ? "对照：vertical-rl 起点跳到了最右侧，列向左生长"
      : "起点在左 · 拖选下方文字可直测真实阅读序";

    const lhNum = parseFloat(st.lh);
    const lsNum = parseFloat(st.ls);
    const colGap = lhNum - 1;
    const ratio = colGap / Math.max(0.08, lsNum);
    if (ratio < 1.2) {
      verdict.textContent = "横串警告 · 列缝窄于字缝";
      verdict.classList.add("is-warn");
    } else if (lhNum >= 2.6) {
      verdict.textContent = "列距偏散 · 换列跨度大";
      verdict.classList.add("is-warn");
    } else if (isRtl) {
      verdict.textContent = "已切为直排右起对照";
      verdict.classList.remove("is-warn");
    } else {
      verdict.textContent = "纵列凝聚 · 自左向右顺流";
      verdict.classList.remove("is-warn");
    }
  }

  lab.querySelectorAll("[data-wm]").forEach((b) =>
    b.addEventListener("click", () => {
      st.wm = b.dataset.wm;
      lab.querySelectorAll("[data-wm]").forEach((x) => x.classList.toggle("is-active", x === b));
      sync();
    })
  );
  lab.querySelectorAll("[data-lh]").forEach((b) =>
    b.addEventListener("click", () => {
      st.lh = b.dataset.lh;
      lab.querySelectorAll("[data-lh]").forEach((x) => x.classList.toggle("is-active", x === b));
      sync();
    })
  );
  lab.querySelectorAll("[data-ls]").forEach((b) =>
    b.addEventListener("click", () => {
      st.ls = b.dataset.ls;
      lab.querySelectorAll("[data-ls]").forEach((x) => x.classList.toggle("is-active", x === b));
      sync();
    })
  );
  lab.querySelectorAll("[data-to]").forEach((b) =>
    b.addEventListener("click", () => {
      st.to = b.dataset.to;
      lab.querySelectorAll("[data-to]").forEach((x) => x.classList.toggle("is-active", x === b));
      sync();
    })
  );

  sync();
}

// ==================== 04 · 四类真实落地载体切换 ====================
const SCENARIOS = {
  wall: {
    title: "美术馆左→右步行展墙",
    body: "当展厅动线设定为从左侧入口沿墙向右行进时，用直排左起做单元导言与年表，观众边走边读，视线方向与脚步完全同向，不必先走到尽头再倒回看开头。",
    rule: "要点：在每段导言左上角放单元序号或红圆锚点，单列控制在 12–18 字，方便站立平视一眼扫完。",
    svg: `
      <svg viewBox="0 0 380 210" aria-label="美术馆展墙示意图">
        <rect width="380" height="210" fill="#F7F1D8"/>
        <rect x="18" y="20" width="344" height="128" fill="#FFFFFF" stroke="#141512" stroke-width="2"/>
        <circle cx="42" cy="40" r="7" fill="#D81511"/>
        <line x1="42" y1="54" x2="42" y2="128" stroke="#141512" stroke-width="5"/>
        <line x1="68" y1="40" x2="68" y2="122" stroke="#141512" stroke-width="2.5"/>
        <line x1="92" y1="40" x2="92" y2="116" stroke="#141512" stroke-width="2.5"/>
        <rect x="128" y="38" width="90" height="90" fill="#FDD602" stroke="#141512" stroke-width="1.5"/>
        <text x="173" y="88" text-anchor="middle" fill="#141512" font-size="12" font-family="Noto Sans SC, sans-serif" font-weight="700">展品 A</text>
        <circle cx="246" cy="40" r="6" fill="#D81511"/>
        <line x1="246" y1="54" x2="246" y2="126" stroke="#141512" stroke-width="4.5"/>
        <line x1="272" y1="40" x2="272" y2="118" stroke="#141512" stroke-width="2.5"/>
        <rect x="298" y="44" width="48" height="80" fill="#141512"/>
        <path d="M36 178 H332 M324 172 l8 6 -8 6" fill="none" stroke="#D81511" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="36" y="196" fill="#9E0E0B" font-size="11.5" font-family="Noto Sans SC, sans-serif" font-weight="700">观众步行方向：自左向右推进 → 导览文字同步直排左起</text>
      </svg>`,
  },
  book: {
    title: "左装订双语画册开篇页",
    body: "现代中英双语画册与年报几乎都采用左装订、向左翻页。如果篇章扉页想用竖排增添东亚气韵，直排左起可让第一列自然靠在左页外侧或左切口，与西文副标及页码的左→右次序严丝合缝。",
    rule: "要点：只用于 3–6 列的短序或章节扉页，进入大段双语正文后切回横排左起。",
    svg: `
      <svg viewBox="0 0 380 210" aria-label="左装订画册跨页示意图">
        <rect width="380" height="210" fill="#F7F1D8"/>
        <rect x="24" y="22" width="166" height="162" fill="#FFFFFF" stroke="#141512" stroke-width="2"/>
        <rect x="190" y="22" width="166" height="162" fill="#FDD602" stroke="#141512" stroke-width="2"/>
        <line x1="190" y1="22" x2="190" y2="184" stroke="#141512" stroke-width="3"/>
        <circle cx="52" cy="44" r="6.5" fill="#D81511"/>
        <line x1="52" y1="58" x2="52" y2="148" stroke="#141512" stroke-width="4.5"/>
        <line x1="80" y1="44" x2="80" y2="144" stroke="#141512" stroke-width="2.4"/>
        <line x1="108" y1="44" x2="108" y2="132" stroke="#141512" stroke-width="2.4"/>
        <line x1="136" y1="44" x2="136" y2="120" stroke="#141512" stroke-width="2.4"/>
        <path d="M50 164 H146 M140 160 l6 4 -6 4" fill="none" stroke="#D81511" stroke-width="1.8"/>
        <rect x="214" y="42" width="118" height="90" fill="#141512"/>
        <text x="273" y="92" text-anchor="middle" fill="#FDD602" font-size="12" font-family="Space Grotesk, sans-serif" font-weight="700">PHOTO PLATE</text>
        <text x="214" y="156" fill="#141512" font-size="11" font-family="Space Grotesk, sans-serif" font-weight="700">CHAPTER 01 →</text>
        <text x="190" y="200" text-anchor="middle" fill="#464332" font-size="11" font-family="Noto Sans SC, sans-serif">左翻跨页：左页短序直排左起，视线顺势跨过中缝看右页大图</text>
      </svg>`,
  },
  mongol: {
    title: "传统蒙古文 / 满文原生书页",
    body: "传统蒙古文与满文是直排左起最纯正的母语载体：它们本就由左向右换列、向左翻页，哪怕整本书数百页长文，读者也能行云流水般阅读，无需额外编号提示方向。",
    rule: "要点：网页端需设 lang=\"mn-Mong\" 与 writing-mode: vertical-lr，并遵循 W3C MLREQ 断行与连写变形规范。",
    svg: `
      <svg viewBox="0 0 380 210" aria-label="蒙汉双语左起版面示意图">
        <rect width="380" height="210" fill="#F7F1D8"/>
        <rect x="24" y="20" width="332" height="162" fill="#FFFDF5" stroke="#141512" stroke-width="2"/>
        <rect x="24" y="20" width="10" height="162" fill="#D81511"/>
        <!-- 模拟传统蒙古文竖向连写主轴（纯几何笔意，不造假文字） -->
        <g stroke="#141512" stroke-width="2.2" fill="none" stroke-linecap="round">
          <path d="M62 42 v108 m0 -94 l8 6 m-8 14 l-7 5 m7 18 l9 6 m-9 22 l8 5"/>
          <path d="M98 42 v108 m0 -86 l8 5 m-8 20 l-7 6 m7 16 l8 6 m-8 24 l-7 5"/>
          <path d="M134 42 v100 m0 -78 l8 5 m-8 22 l-7 5 m7 20 l8 5"/>
          <path d="M170 42 v90 m0 -66 l8 5 m-8 24 l-7 5"/>
        </g>
        <line x1="204" y1="34" x2="204" y2="168" stroke="#141512" stroke-dasharray="4 4"/>
        <text x="224" y="64" fill="#141512" font-size="13" font-family="Noto Sans SC, sans-serif" font-weight="700">原生 vertical-lr</text>
        <text x="224" y="88" fill="#464332" font-size="11.5" font-family="Noto Sans SC, sans-serif">连笔竖轴自上而下</text>
        <text x="224" y="108" fill="#464332" font-size="11.5" font-family="Noto Sans SC, sans-serif">列序自然自左向右</text>
        <text x="224" y="128" fill="#9E0E0B" font-size="11.5" font-family="DM Mono, monospace">U+1800–U+18AF</text>
        <path d="M56 168 H178 M172 164 l6 4 -6 4" fill="none" stroke="#D81511" stroke-width="2"/>
        <text x="190" y="200" text-anchor="middle" fill="#464332" font-size="11" font-family="Noto Sans SC, sans-serif">传统蒙古文与满文无需编号即可稳定直排左起读完长文</text>
      </svg>`,
  },
  sidebar: {
    title: "网页左缘竖向导脊与书签栏",
    body: "桌面网页与编辑杂志站常用左侧窄边做章节索引或竖排标牌。此时把文字设为 writing-mode: vertical-lr，外侧列靠屏缘、内侧列紧贴主内容区，符合屏幕从左边缘向主画布展开的层级流。",
    rule: "要点：仅放 2–8 字短标签或章节号，并确保触屏与小屏自动回落成横排顶栏。",
    svg: `
      <svg viewBox="0 0 380 210" aria-label="网页左缘竖向导航示意图">
        <rect width="380" height="210" fill="#F7F1D8"/>
        <rect x="24" y="18" width="332" height="168" rx="3" fill="#141512"/>
        <rect x="26" y="38" width="54" height="146" fill="#FDD602"/>
        <rect x="82" y="38" width="272" height="146" fill="#FCF9EE"/>
        <circle cx="44" cy="54" r="5" fill="#D81511"/>
        <line x1="44" y1="68" x2="44" y2="122" stroke="#141512" stroke-width="4"/>
        <line x1="64" y1="54" x2="64" y2="112" stroke="#141512" stroke-width="2" opacity="0.65"/>
        <rect x="102" y="56" width="160" height="16" fill="#141512"/>
        <rect x="102" y="84" width="226" height="8" fill="#D6CEAE"/>
        <rect x="102" y="100" width="210" height="8" fill="#D6CEAE"/>
        <rect x="102" y="116" width="190" height="8" fill="#D6CEAE"/>
        <path d="M54 152 H112 M106 148 l6 4 -6 4" fill="none" stroke="#D81511" stroke-width="2"/>
        <text x="190" y="201" text-anchor="middle" fill="#464332" font-size="11" font-family="Noto Sans SC, sans-serif">左缘竖脊先导、向右进入横排正文：短标签高辨识，不抢正文阅读</text>
      </svg>`,
  },
};

export function initScenarios() {
  const app = document.getElementById("scenarioApp");
  const vis = document.getElementById("scenarioVisual");
  const copy = document.getElementById("scenarioCopy");
  if (!app || !vis || !copy) return;

  function show(key) {
    const sc = SCENARIOS[key];
    if (!sc) return;
    app.querySelectorAll(".sc-tab").forEach((t) => {
      const on = t.dataset.sc === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    vis.innerHTML = sc.svg;
    copy.innerHTML = `<h3>${sc.title}</h3><p>${sc.body}</p><div class="sc-rule">${sc.rule}</div>`;
  }

  app.querySelectorAll(".sc-tab").forEach((t) => {
    t.addEventListener("click", () => show(t.dataset.sc));
  });
  show("wall");
}

// ==================== 05 · 四张踩坑/改用翻检卡 ====================
const TRAPS = [
  {
    badText: "中文读者面对十余列纯汉字竖排时，几乎都会本能从右上角读起。没有编号与起点红点，读者读完半页才发现句子全倒了。",
    goodText: "超过 6 列的中文长篇小说或专访，若要竖排请用 214 直排右起；现代电子屏长文则优先 212 横排左起。",
    badSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#FFFDF5"/><g stroke="#141512" stroke-width="2" opacity="0.72"><line x1="28" y1="16" x2="28" y2="76"/><line x1="56" y1="16" x2="56" y2="76"/><line x1="84" y1="16" x2="84" y2="76"/><line x1="112" y1="16" x2="112" y2="76"/><line x1="140" y1="16" x2="140" y2="76"/><line x1="168" y1="16" x2="168" y2="76"/><line x1="196" y1="16" x2="196" y2="76"/><line x1="224" y1="16" x2="224" y2="76"/><line x1="252" y1="16" x2="252" y2="76"/></g><circle cx="252" cy="18" r="6" fill="#D81511"/><path d="M242 20 H188 M194 15 l-6 5 6 5" fill="none" stroke="#D81511" stroke-width="2"/><text x="140" y="88" text-anchor="middle" fill="#9E0E0B" font-size="10.5" font-family="Noto Sans SC, sans-serif">× 无标多列中文：读者误从右上角倒读</text></svg>`,
    goodSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#F4FBF7"/><g stroke="#0B5E40" stroke-width="2.2"><line x1="28" y1="24" x2="248" y2="24"/><line x1="28" y1="44" x2="248" y2="44"/><line x1="28" y1="64" x2="196" y2="64"/></g><circle cx="28" cy="24" r="5" fill="#0B5E40"/><text x="140" y="86" text-anchor="middle" fill="#0B5E40" font-size="10.5" font-family="Noto Sans SC, sans-serif">✓ 改用 212 横排左起 或 214 直排右起</text></svg>`,
  },
  {
    badText: "书脊装订在右侧的古籍或漫画，读者右手翻页、目光自然先落外切口右侧。若内文硬做直排左起，第一列反被压进中缝阴影里。",
    goodText: "装订边决定行进方向：右翻书配 214 直排右起，左翻书再考虑 215 直排左起或横排。",
    badSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#FFFDF5"/><rect x="26" y="12" width="114" height="68" fill="#FFFFFF" stroke="#141512"/><rect x="140" y="12" width="114" height="68" fill="#FFFFFF" stroke="#141512"/><line x1="140" y1="12" x2="140" y2="80" stroke="#141512" stroke-width="3"/><circle cx="154" cy="24" r="5.5" fill="#D81511"/><path d="M164 46 H236 M228 41 l8 5 -8 5" fill="none" stroke="#D81511" stroke-width="2"/><text x="140" y="90" text-anchor="middle" fill="#9E0E0B" font-size="10.5" font-family="Noto Sans SC, sans-serif">× 右翻书却左起：第一列卡死在书脊中缝</text></svg>`,
    goodSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#F4FBF7"/><rect x="26" y="12" width="114" height="68" fill="#FFFFFF" stroke="#0B5E40"/><rect x="140" y="12" width="114" height="68" fill="#FFFFFF" stroke="#0B5E40"/><line x1="140" y1="12" x2="140" y2="80" stroke="#0B5E40" stroke-width="3"/><circle cx="240" cy="24" r="5.5" fill="#0B5E40"/><path d="M230 46 H156 M164 41 l-8 5 8 5" fill="none" stroke="#0B5E40" stroke-width="2"/><text x="140" y="90" text-anchor="middle" fill="#0B5E40" font-size="10.5" font-family="Noto Sans SC, sans-serif">✓ 右装订配直排右起，从外缘顺畅向中缝读</text></svg>`,
  },
  {
    badText: "价格表、参数对照表和代码行强依赖「同一横排对齐比较」与「小数点竖齐」。改成直排左起后，多位数字要么侧躺要么拆散，核对效率暴跌。",
    goodText: "数值矩阵与代码一律保持横排左起，用等宽数字与清晰表头列对齐；直排只保留给大类标题装饰。",
    badSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#FFFDF5"/><g font-family="DM Mono, monospace" font-size="11" fill="#141512"><text x="48" y="26">¥</text><text x="48" y="42">1</text><text x="48" y="58">2</text><text x="48" y="74">8</text><text x="96" y="26">¥</text><text x="96" y="42">9</text><text x="96" y="58">6</text><text x="96" y="74">0</text><text x="144" y="26">%</text><text x="144" y="42">4</text><text x="144" y="58">2</text></g><path d="M34 48 H168" stroke="#D81511" stroke-width="1.6" stroke-dasharray="4 3"/><text x="140" y="90" text-anchor="middle" fill="#9E0E0B" font-size="10.5" font-family="Noto Sans SC, sans-serif">× 数字被竖向拆散，无法横向比大小</text></svg>`,
    goodSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#F4FBF7"/><g font-family="DM Mono, monospace" font-size="12" fill="#0B5E40"><text x="36" y="34">ITEM A   ¥128.00</text><text x="36" y="56">ITEM B   ¥960.00</text></g><line x1="28" y1="40" x2="252" y2="40" stroke="#0B5E40" opacity="0.35"/><text x="140" y="86" text-anchor="middle" fill="#0B5E40" font-size="10.5" font-family="Noto Sans SC, sans-serif">✓ 数值对比保持横排，小数点与位数一眼齐</text></svg>`,
  },
  {
    badText: "手机竖屏宽度仅 360–414px，硬塞 8–10 列直排左起就会逼出横向滚动条。拇指习惯上下刷屏，反复横拖找下一列很快让人关闭页面。",
    goodText: "窄屏上直排左起最多留 3–5 列短句或标题；超过一屏宽度时通过媒体查询自动回落为横排纵向流。",
    badSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#FFFDF5"/><rect x="88" y="10" width="104" height="68" rx="6" fill="#FFFFFF" stroke="#141512" stroke-width="2"/><g stroke="#141512" stroke-width="2"><line x1="104" y1="22" x2="104" y2="66"/><line x1="122" y1="22" x2="122" y2="66"/><line x1="140" y1="22" x2="140" y2="66"/><line x1="158" y1="22" x2="158" y2="66"/><line x1="176" y1="22" x2="176" y2="66"/><line x1="202" y1="22" x2="202" y2="66" stroke="#D81511" stroke-dasharray="3 2"/><line x1="220" y1="22" x2="220" y2="66" stroke="#D81511" stroke-dasharray="3 2"/></g><text x="140" y="90" text-anchor="middle" fill="#9E0E0B" font-size="10.5" font-family="Noto Sans SC, sans-serif">× 超出手机屏宽，被迫左右横拖找后续列</text></svg>`,
    goodSvg: `<svg viewBox="0 0 280 94"><rect width="280" height="94" fill="#F4FBF7"/><rect x="88" y="10" width="104" height="68" rx="6" fill="#FFFFFF" stroke="#0B5E40" stroke-width="2"/><g stroke="#0B5E40" stroke-width="2.2"><line x1="102" y1="26" x2="178" y2="26"/><line x1="102" y1="42" x2="178" y2="42"/><line x1="102" y1="58" x2="156" y2="58"/></g><text x="140" y="90" text-anchor="middle" fill="#0B5E40" font-size="10.5" font-family="Noto Sans SC, sans-serif">✓ 窄屏自动切回横排单栏，单手上下顺畅滑读</text></svg>`,
  },
];

export function initTraps() {
  const cards = [...document.querySelectorAll(".trap-card")];
  cards.forEach((card) => {
    const idx = +card.dataset.trap;
    const item = TRAPS[idx];
    const btn = card.querySelector(".trap-toggle");
    const diag = card.querySelector('[data-role="diagram"]');
    const txt = card.querySelector('[data-role="text"]');
    let fixed = false;

    function sync() {
      card.classList.toggle("is-fixed", fixed);
      btn.setAttribute("aria-pressed", String(fixed));
      btn.textContent = fixed ? "回看踩坑现场" : "看改用方案";
      diag.innerHTML = fixed ? item.goodSvg : item.badSvg;
      txt.textContent = fixed ? item.goodText : item.badText;
    }

    btn.addEventListener("click", () => {
      fixed = !fixed;
      sync();
    });
    sync();
  });
}

// ==================== 06 · 四选一实战诊题（单变量：列距 / 字距比） ====================
const QUIZ_COLS = ["左起首列顺势读", "次列承接见层次", "三列节奏留气口", "末列收束成闭环"];
const QUIZ_OPTS = {
  A: {
    colStep: 19,
    rowStep: 23,
    startX: 90,
    ok: false,
    reason: "方案 A 把列距压得比字距还窄（列缝明显小于字缝）。按格式塔临近性法则，眼睛会自动把横向更近的「左、次、三、末」联成横排，发生严重横串错读。",
  },
  B: {
    colStep: 23,
    rowStep: 21,
    startX: 84,
    ok: false,
    reason: "方案 B 的列距与字距几乎相等，四列字退化成等距棋盘方阵。虽然不像方案 A 那样强行横串，但上下与左右引力势均力敌，扫读时视线犹豫、容易串行。",
  },
  C: {
    colStep: 36,
    rowStep: 16,
    startX: 66,
    ok: true,
    reason: "判断正确！方案 C 的字距紧凑、列距约为字距的两倍以上：同一列内的字稳稳抱团成柱，列间又留出干净气口，配合左上红点与 1→4 编号，视线自左向右毫不费力地逐列推进。",
  },
  D: {
    colStep: 62,
    rowStep: 15,
    startX: 27,
    ok: false,
    reason: "方案 D 走向了另一个极端：列距拉得过宽，四列被撕裂成四条互不相连的孤柱。读完一列底端后视线要长距离横跨空白才能找到下一列天头，整体句意被切断。",
  },
};

export function initQuiz() {
  const grid = document.getElementById("quizGrid");
  const fb = document.getElementById("quizFeedback");
  if (!grid || !fb) return;

  // 渲染 4 张中性的微缩直排左起样张（文案、红点、编号 1→4 全同，只差纵横间距比）
  for (const [key, cfg] of Object.entries(QUIZ_OPTS)) {
    const svg = grid.querySelector(`[data-opt-svg="${key}"]`);
    if (!svg) continue;
    let markup = `<rect width="240" height="185" fill="#FDD602"/>`;
    // 左上起点红点
    markup += `<circle cx="${cfg.startX}" cy="16" r="5" fill="#D81511"/>`;
    QUIZ_COLS.forEach((str, ci) => {
      const cx = cfg.startX + ci * cfg.colStep;
      // 编号圆
      markup += `<circle cx="${cx}" cy="33" r="6.5" fill="${ci === 0 ? "#D81511" : "#141512"}"/>`;
      markup += `<text x="${cx}" y="36.5" text-anchor="middle" fill="${ci === 0 ? "#FFF" : "#FDD602"}" font-size="8.5" font-family="DM Mono, monospace" font-weight="700">${ci + 1}</text>`;
      // 竖排汉字
      [...str].forEach((ch, ri) => {
        const y = 55 + ri * cfg.rowStep;
        if (y > 168) return;
        markup += `<text x="${cx}" y="${y}" text-anchor="middle" fill="#141512" font-size="11.5" font-family="Noto Sans SC, sans-serif" font-weight="${ri < 2 ? 900 : 400}">${ch}</text>`;
      });
    });
    // 底部红虚线右向箭
    const xEnd = cfg.startX + 3 * cfg.colStep;
    markup += `<line x1="${cfg.startX - 4}" y1="176" x2="${xEnd + 6}" y2="176" stroke="#D81511" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    markup += `<path d="M${xEnd + 2} 173 l5 3 -5 3" fill="none" stroke="#D81511" stroke-width="1.4"/>`;
    svg.innerHTML = markup;
  }

  grid.querySelectorAll(".quiz-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.opt;
      const cfg = QUIZ_OPTS[key];
      grid.querySelectorAll(".quiz-opt").forEach((b) => {
        const k = b.dataset.opt;
        const isMe = k === key;
        b.setAttribute("aria-checked", String(isMe));
        b.classList.toggle("is-picked", isMe && !cfg.ok);
        b.classList.toggle("is-right", k === "C");
        const mark = b.querySelector(".quiz-mark");
        if (mark) {
          mark.textContent = k === "C" ? "✓ 正解" : isMe ? "× 再看比例" : "";
        }
      });
      fb.classList.toggle("is-ok", cfg.ok);
      fb.classList.toggle("is-wrong", !cfg.ok);
      fb.innerHTML = `<p><strong>你选了方案 ${key}：</strong>${cfg.reason}</p>`;
    });
  });
}

// ==================== 07 · 原海报放大与拖拽灯箱 ====================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("posterOpenBtn");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lbStage");
  const lbImg = document.getElementById("lbImg");
  const btnIn = document.getElementById("lbZoomIn");
  const btnOut = document.getElementById("lbZoomOut");
  const btnReset = document.getElementById("lbZoomReset");
  const btnClose = document.getElementById("lbClose");
  if (!poster || !openBtn || !lb || !lbStage || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (btnReset) btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    lb.hidden = false;
    btnClose?.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose?.addEventListener("click", close);
  btnIn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    apply();
  });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  });
  btnReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    apply();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1) {
      close();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("is-dragging");
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  const endDrag = () => {
    dragging = false;
    lbStage.classList.remove("is-dragging");
  };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });
}
