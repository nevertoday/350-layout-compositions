// 056 四象限构图 — 正文 01–07 节专属交互模块（每节控件互不重复）

// ============================================================
// 01 · 十字轴的百年演进：四纪元建筑蓝图切换器
// ============================================================
const EPOCHS = [
  {
    id: "1637",
    year: "1637",
    title: "笛卡尔《几何学》与正值单轴",
    en: "LA GÉOMÉTRIE · DESCARTES",
    fact: "勒内·笛卡尔在《谈谈方法》附录《几何学》中首次将代数与几何连通，但书里多只沿一条基线在正值区作斜角量度，并没有画出今天的四象限十字格。",
    twist: "完整四象限直角坐标系是 1649 年范·斯霍滕（Frans van Schooten）拉丁文评注本与牛顿、莱布尼茨等后世学者陆续补全的。",
    source: "核实：Encyclopædia Britannica · La Géométrie (1637)",
    svg: `<svg viewBox="0 0 360 250" role="img" aria-label="1637 笛卡尔单基线与后世四象限演进示意图">
      <rect width="360" height="250" fill="#FAF5EC"/>
      <line x1="36" y1="196" x2="324" y2="196" stroke="#1B5136" stroke-width="2"/>
      <line x1="90" y1="196" x2="152" y2="54" stroke="#D25A2E" stroke-width="1.8" stroke-dasharray="5 4"/>
      <line x1="180" y1="28" x2="180" y2="202" stroke="#1B5136" stroke-width="1" stroke-dasharray="3 4" opacity="0.45"/>
      <line x1="36" y1="125" x2="324" y2="125" stroke="#1B5136" stroke-width="1" stroke-dasharray="3 4" opacity="0.45"/>
      <path d="M90 196 Q175 110 290 66" fill="none" stroke="#1B5136" stroke-width="2.4"/>
      <circle cx="212" cy="111" r="6" fill="#D25A2E"/>
      <line x1="212" y1="111" x2="180" y2="196" stroke="#D25A2E" stroke-width="1.3"/>
      <text x="44" y="218" font-size="11" fill="#14402A" font-family="JetBrains Mono, Noto Sans SC, monospace">1637 单基线正值区 (x, y &gt; 0)</text>
      <text x="192" y="44" font-size="11" fill="#48564E" font-family="JetBrains Mono, Noto Sans SC, monospace">后世补全四象限虚线轴</text>
      <text x="224" y="106" font-size="11" fill="#9F3A14" font-family="JetBrains Mono, Noto Sans SC, monospace">P(x, y)</text>
    </svg>`,
  },
  {
    id: "1930",
    year: "1917–1930",
    title: "风格派与蒙德里安动态十字",
    en: "DE STIJL · MONDRIAN",
    fact: "1917 年《风格》杂志在荷兰创刊。1930 年皮特·蒙德里安完成《红、蓝、黄构图二号》（现藏苏黎世美术馆），用横竖正交黑线划分画布，却以不对称的巨幅红块对抗左下小蓝块与右下小黄块。",
    twist: "它给现代平面设计留下一条铁律：十字轴切分不等于死板对称，只要体量与色彩能跨象限配平，偏移交点反而更有生命力。",
    source: "核实：Britannica / Kunsthaus Zürich · 1930",
    svg: `<svg viewBox="0 0 360 250" role="img" aria-label="1930 蒙德里安非对称正交分割示意图">
      <rect width="360" height="250" fill="#FAF5EC"/>
      <rect x="65" y="20" width="230" height="210" fill="#FAF5EC" stroke="#0A0A0A" stroke-width="2"/>
      <rect x="135" y="20" width="160" height="145" fill="#D25A2E"/>
      <rect x="65" y="165" width="70" height="65" fill="#1B5136"/>
      <rect x="255" y="196" width="40" height="34" fill="#E3C498"/>
      <line x1="135" y1="20" x2="135" y2="230" stroke="#0A0A0A" stroke-width="6"/>
      <line x1="65" y1="165" x2="295" y2="165" stroke="#0A0A0A" stroke-width="6"/>
      <line x1="65" y1="95" x2="135" y2="95" stroke="#0A0A0A" stroke-width="8"/>
      <line x1="255" y1="165" x2="255" y2="230" stroke="#0A0A0A" stroke-width="5"/>
      <line x1="255" y1="196" x2="295" y2="196" stroke="#0A0A0A" stroke-width="5"/>
      <text x="16" y="34" font-size="11" fill="#14402A" font-family="JetBrains Mono, Noto Sans SC, monospace">非对称</text>
      <text x="304" y="226" font-size="11" fill="#9F3A14" font-family="JetBrains Mono, Noto Sans SC, monospace">配重</text>
    </svg>`,
  },
  {
    id: "1970",
    year: "1970",
    title: "BCG 增长—份额四象限矩阵",
    en: "THE PRODUCT PORTFOLIO · HENDERSON",
    fact: "波士顿咨询创始人布鲁斯·亨德森在 1970 年短文《The Product Portfolio》中，以市场增速为纵轴、相对份额为横轴，将产品组合切分为明星、现金牛、问题与瘦狗四个象限。",
    twist: "从此四象限走出纯艺术，成为商业演示、产品策略与信息设计里效率最高的二维分类视觉容器。",
    source: "核实：Boston Consulting Group · 1970",
    svg: `<svg viewBox="0 0 360 250" role="img" aria-label="1970 BCG 增长份额四象限矩阵示意图">
      <rect width="360" height="250" fill="#FAF5EC"/>
      <rect x="58" y="26" width="244" height="190" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.4"/>
      <line x1="180" y1="26" x2="180" y2="216" stroke="#1B5136" stroke-width="1.6"/>
      <line x1="58" y1="121" x2="302" y2="121" stroke="#1B5136" stroke-width="1.6"/>
      <circle cx="119" cy="73" r="24" fill="#1B5136"/>
      <text x="119" y="77" text-anchor="middle" font-size="11" fill="#FAF5EC" font-weight="600">明星</text>
      <circle cx="241" cy="73" r="19" fill="#D25A2E"/>
      <text x="241" y="77" text-anchor="middle" font-size="11" fill="#FAF5EC" font-weight="600">问题</text>
      <circle cx="119" cy="168" r="22" fill="#E3C498"/>
      <text x="119" y="172" text-anchor="middle" font-size="11" fill="#1C231F" font-weight="600">现金牛</text>
      <circle cx="241" cy="168" r="15" fill="#9FB3A7"/>
      <text x="241" y="172" text-anchor="middle" font-size="11" fill="#1C231F" font-weight="600">瘦狗</text>
      <text x="180" y="18" text-anchor="middle" font-size="11" fill="#14402A" font-family="JetBrains Mono, Noto Sans SC, monospace">高增速 ↑</text>
      <text x="180" y="236" text-anchor="middle" font-size="11" fill="#48564E" font-family="JetBrains Mono, Noto Sans SC, monospace">← 相对市场份额 →</text>
    </svg>`,
  },
  {
    id: "1982",
    year: "1981–1982",
    title: "瑞士网格与阿恩海姆中心力场",
    en: "GRID SYSTEMS & POWER OF THE CENTER",
    fact: "1981 年约瑟夫·米勒-布罗克曼出版《平面设计中的网格系统》（Niggli），确立按整数网格单元组织图文的方法；次年鲁道夫·阿恩海姆在《中心的力量》（UC Press）中提出「中心系统」与「笛卡尔横竖坐标」两股知觉力场。",
    twist: "四象限正好卡在两套系统的交汇处：中心圆核往里吸聚，横竖双轴往外分格，两种力量相互制衡才诞生张力。",
    source: "核实：Niggli Verlag (1981) / UC Press (1982)",
    svg: `<svg viewBox="0 0 360 250" role="img" aria-label="1982 阿恩海姆中心力场与笛卡尔正交轴叠加图">
      <rect width="360" height="250" fill="#FAF5EC"/>
      <rect x="64" y="24" width="232" height="202" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/>
      <circle cx="180" cy="125" r="82" fill="none" stroke="#1B5136" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.6"/>
      <circle cx="180" cy="125" r="48" fill="none" stroke="#D25A2E" stroke-width="1.4" opacity="0.8"/>
      <line x1="64" y1="125" x2="296" y2="125" stroke="#1B5136" stroke-width="1.6"/>
      <line x1="180" y1="24" x2="180" y2="226" stroke="#1B5136" stroke-width="1.6"/>
      <line x1="106" y1="62" x2="254" y2="188" stroke="#D25A2E" stroke-width="1.2" stroke-dasharray="5 4"/>
      <line x1="254" y1="62" x2="106" y2="188" stroke="#D25A2E" stroke-width="1.2" stroke-dasharray="5 4"/>
      <circle cx="180" cy="125" r="14" fill="#FAF5EC" stroke="#1B5136" stroke-width="1.8"/>
      <circle cx="180" cy="125" r="6" fill="#1B5136"/>
      <text x="180" y="242" text-anchor="middle" font-size="11" fill="#14402A" font-family="JetBrains Mono, Noto Sans SC, monospace">中心凝聚力 ◎ × 笛卡尔正交轴 ＋</text>
    </svg>`,
  },
];

export function initOriginTimeline() {
  const tabs = document.querySelectorAll("[data-epoch]");
  const visualEl = document.getElementById("epoch-visual");
  const yearEl = document.getElementById("epoch-year");
  const titleEl = document.getElementById("epoch-title");
  const enEl = document.getElementById("epoch-en");
  const factEl = document.getElementById("epoch-fact");
  const twistEl = document.getElementById("epoch-twist");
  const srcEl = document.getElementById("epoch-source");
  if (!tabs.length || !visualEl) return;

  function select(id) {
    const ep = EPOCHS.find((e) => e.id === id) || EPOCHS[0];
    tabs.forEach((btn) => {
      const on = btn.dataset.epoch === ep.id;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    visualEl.innerHTML = ep.svg;
    yearEl.textContent = ep.year;
    titleEl.textContent = ep.title;
    enEl.textContent = ep.en;
    factEl.textContent = ep.fact;
    twistEl.textContent = ep.twist;
    srcEl.textContent = ep.source;
  }

  tabs.forEach((btn) => btn.addEventListener("click", () => select(btn.dataset.epoch)));
  select("1637");
}

// ============================================================
// 02 · 视觉重心：双轴（X/Y）杠杆跷跷板实验台
// ============================================================
const WEIGHT_LEVELS = [
  { id: "pine",  label: "深松绿重块", val: 96, fill: "#1B5136", ink: "#FAF5EC", size: 54 },
  { id: "terra", label: "陶土赤焦块", val: 84, fill: "#D25A2E", ink: "#FAF5EC", size: 46 },
  { id: "sand",  label: "暖燕麦中块", val: 48, fill: "#E3C498", ink: "#1C231F", size: 38 },
  { id: "void",  label: "留白呼吸区", val: 14, fill: "#EFE6D8", ink: "#48564E", size: 26 },
];

const SEESAW_PRESETS = {
  dead:     [2, 2, 2, 2], // 四个一模一样：镜像死平衡
  diagonal: [0, 2, 2, 1], // 左上深松绿 + 右下陶土赤，辅以右上/左下暖燕麦：对角动态稳
  leftTip:  [0, 3, 1, 3], // 左侧双压：向左翻车
  topHeavy: [0, 1, 3, 3], // 上重下空：头重脚轻
};

export function initBalanceSeesaw() {
  const padBtns = [...document.querySelectorAll("[data-quad-pad]")];
  const presetBtns = [...document.querySelectorAll("[data-seesaw-preset]")];
  const beamX = document.getElementById("seesaw-beam-x");
  const beamY = document.getElementById("seesaw-beam-y");
  const cogDot = document.getElementById("seesaw-cog-dot");
  const svgRects = [0, 1, 2, 3].map((i) => document.getElementById(`seesaw-q${i}`));
  const readoutTitle = document.getElementById("seesaw-title");
  const readoutBody = document.getElementById("seesaw-body");
  const readoutNum = document.getElementById("seesaw-num");
  if (!padBtns.length || !beamX) return;

  // 开场给一个「左倾翻车」状态，让用户点几下感受对角配平
  const levels = [0, 3, 1, 3];

  function render() {
    const ws = levels.map((li, qi) => {
      const m = WEIGHT_LEVELS[li];
      // 上两象限按阿恩海姆上重效应加权 1.12×（示意）
      const topBoost = qi < 2 ? 1.12 : 1.0;
      return m.val * topBoost;
    });
    const total = ws.reduce((a, b) => a + b, 0);
    const leftW = ws[0] + ws[2];
    const rightW = ws[1] + ws[3];
    const topW = ws[0] + ws[1];
    const botW = ws[2] + ws[3];

    const torqueX = (rightW - leftW) / total; // -1..+1
    const torqueY = (botW - topW) / total;   // -1..+1
    const degX = Math.max(-18, Math.min(18, torqueX * 34));
    const degY = Math.max(-18, Math.min(18, torqueY * 34));

    beamX.setAttribute("transform", `rotate(${degX.toFixed(1)} 110 44)`);
    beamY.setAttribute("transform", `rotate(${degY.toFixed(1)} 110 44)`);

    const cx = 130 + torqueX * 68;
    const cy = 110 + torqueY * 58;
    cogDot.setAttribute("cx", cx.toFixed(1));
    cogDot.setAttribute("cy", cy.toFixed(1));

    const centres = [
      [75, 62], [185, 62],
      [75, 158], [185, 158],
    ];
    levels.forEach((li, qi) => {
      const m = WEIGHT_LEVELS[li];
      const btn = padBtns[qi];
      btn.querySelector(".pad-val").textContent = m.label;
      btn.style.setProperty("--pad-chip", m.fill);
      btn.style.setProperty("--pad-ink", m.ink);

      const el = svgRects[qi];
      if (el) {
        const half = m.size / 2;
        el.setAttribute("x", (centres[qi][0] - half).toFixed(1));
        el.setAttribute("y", (centres[qi][1] - half).toFixed(1));
        el.setAttribute("width", String(m.size));
        el.setAttribute("height", String(m.size));
        el.setAttribute("fill", m.fill);
        el.setAttribute("stroke", m.id === "void" ? "#1B5136" : "none");
        el.setAttribute("stroke-dasharray", m.id === "void" ? "4 3" : "none");
      }
    });

    const uniqueCount = new Set(levels).size;
    const absX = Math.abs(torqueX);
    const absY = Math.abs(torqueY);
    const xTxt = absX < 0.09 ? "左右稳" : (torqueX < 0 ? `左沉 ${Math.round(absX * 100)}%` : `右沉 ${Math.round(absX * 100)}%`);
    const yTxt = absY < 0.09 ? "上下稳" : (torqueY < 0 ? `上重 ${Math.round(absY * 100)}%` : `下沉 ${Math.round(absY * 100)}%`);
    readoutNum.textContent = `${xTxt} · ${yTxt}（示意）`;

    if (uniqueCount === 1) {
      readoutTitle.textContent = "镜像死平衡：重心不动，画面却僵成表格";
      readoutBody.textContent = "四格体量完全一致时，横竖杠杆确实零偏转，但因为没有轻重主次，眼睛找不到起点——这就是稳与僵的分界。试着把一对角换成重块+陶土点缀。";
    } else if (absX < 0.14 && absY < 0.14) {
      readoutTitle.textContent = "动态平衡成立：造型不一，力矩却稳咬中心";
      readoutBody.textContent = "不需要四格一模一样。只要左上与右下、右上与左下形成对角重量牵制，横竖两根标尺就会同时归平，既稳重又有呼吸节奏。";
    } else if (absX >= absY) {
      readoutTitle.textContent = torqueX < 0 ? "左侧超重：水平天平明显左倾" : "右侧超重：水平天平明显右倾";
      readoutBody.textContent = "重色体块集中在同一侧，视觉杠杆把整张版面往下拽。去点对角象限把体量拉起来（或把轻区换成陶土焦块），立刻就能把天平压回水平。";
    } else {
      readoutTitle.textContent = torqueY < 0 ? "头重脚轻：上方色块压得画面发飘" : "底座过沉：重心沉到底部拉不开张力";
      readoutBody.textContent = torqueY < 0
        ? "鲁道夫·阿恩海姆指出，同样面积的色块放在上半部会比下半部显得更重。顶部双压时，底部必须放一块足够的重量承托。"
        : "下方放了过多实心重块，上方偏空。可以给上方对角放一枚高对比的陶土焦块或深松绿块，把视线重新托回中轴。";
    }
  }

  padBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const qi = Number(btn.dataset.quadPad);
      levels[qi] = (levels[qi] + 1) % WEIGHT_LEVELS.length;
      render();
    });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const arr = SEESAW_PRESETS[btn.dataset.seesawPreset];
      if (!arr) return;
      arr.forEach((v, i) => { levels[i] = v; });
      render();
    });
  });

  render();
}

// ============================================================
// 03 · 四格不散：深松绿暗室三层黏合开关
// ============================================================
export function initBindingLab() {
  const checks = {
    color: document.getElementById("bind-color"),
    bridge: document.getElementById("bind-bridge"),
    scale: document.getElementById("bind-scale"),
  };
  const stage = document.getElementById("bind-svg");
  const statusEl = document.getElementById("bind-status");
  const descEl = document.getElementById("bind-desc");
  if (!stage || !checks.color) return;

  function render() {
    const c = checks.color.checked;
    const b = checks.bridge.checked;
    const s = checks.scale.checked;
    const n = (c ? 1 : 0) + (b ? 1 : 0) + (s ? 1 : 0);

    // 四个块随三开关实时变换颜色、尺寸与跨轴呼应线
    const q1Fill = c ? "#2D7040" : "#5F786B";
    const q2Fill = c ? "#F28B66" : "#6D8377";
    const q3Fill = c ? "#EED3A7" : "#778C80";
    const q4Fill = c ? "#2D7040" : "#5B7266";

    const r1 = s ? 46 : 36;
    const r2 = s ? 30 : 36;
    const r3 = s ? 32 : 36;
    const r4 = s ? 40 : 36;

    const bridgeMarkup = b
      ? `
        <line x1="126" y1="88" x2="294" y2="212" stroke="#F28B66" stroke-width="1.6" stroke-dasharray="5 5"/>
        <line x1="294" y1="88" x2="126" y2="212" stroke="#EED3A7" stroke-width="1.4" stroke-dasharray="5 5"/>
        <circle cx="210" cy="150" r="22" fill="#10291D" stroke="#FAF5EC" stroke-width="1.8"/>
        <circle cx="210" cy="150" r="8" fill="#F28B66"/>
      `
      : `
        <line x1="210" y1="18" x2="210" y2="282" stroke="#0A1A12" stroke-width="7"/>
        <line x1="20" y1="150" x2="400" y2="150" stroke="#0A1A12" stroke-width="7"/>
      `;

    const echoDots = c
      ? `<circle cx="145" cy="108" r="7" fill="#F28B66"/><circle cx="275" cy="192" r="7" fill="#F28B66"/>`
      : "";

    const scanPath = n === 3
      ? `<path d="M115 84 Q210 70 305 84 Q326 150 305 216 Q210 232 115 216" fill="none" stroke="#FAF5EC" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.85"/>`
      : n === 0
        ? `<rect x="104" y="136" width="212" height="28" fill="#10291D" stroke="#F28B66" stroke-width="1.2"/><text x="210" y="154" text-anchor="middle" font-size="12" fill="#F28B66" font-weight="600">四格彻底隔断 · 视线跳不出单格</text>`
        : "";

    stage.innerHTML = `<svg viewBox="0 0 420 300" role="img" aria-label="四象限三层黏合效果演示">
      <rect width="420" height="300" fill="#163828"/>
      <line x1="210" y1="18" x2="210" y2="282" stroke="rgba(250,245,236,0.34)" stroke-width="1.4"/>
      <line x1="20" y1="150" x2="400" y2="150" stroke="rgba(250,245,236,0.34)" stroke-width="1.4"/>
      ${bridgeMarkup}
      <rect x="${115 - r1}" y="${84 - r1 * 0.78}" width="${r1 * 2}" height="${r1 * 1.56}" fill="${q1Fill}"/>
      <circle cx="305" cy="84" r="${r2}" fill="${q2Fill}"/>
      <rect x="${115 - r3}" y="${216 - r3 * 0.78}" width="${r3 * 2}" height="${r3 * 1.56}" fill="${q3Fill}"/>
      <g>
        ${s
          ? [0,1,2,3,4,5].map((k) => `<rect x="${305 - r4 + k * (r4 * 2 / 6)}" y="${216 - r4 * 0.75}" width="${r4 * 0.18}" height="${r4 * 1.5}" fill="${q4Fill}"/>`).join("")
          : `<rect x="${305 - r4}" y="${216 - r4 * 0.78}" width="${r4 * 2}" height="${r4 * 1.56}" fill="${q4Fill}"/>`
        }
      </g>
      ${echoDots}
      ${scanPath}
      <text x="32" y="34" font-size="11" fill="#D6E3DA" font-family="JetBrains Mono, Noto Sans SC, monospace">Q1 主场</text>
      <text x="388" y="34" text-anchor="end" font-size="11" fill="#D6E3DA" font-family="JetBrains Mono, Noto Sans SC, monospace">Q2 焦点</text>
      <text x="32" y="282" font-size="11" fill="#D6E3DA" font-family="JetBrains Mono, Noto Sans SC, monospace">Q3 承接</text>
      <text x="388" y="282" text-anchor="end" font-size="11" fill="#D6E3DA" font-family="JetBrains Mono, Noto Sans SC, monospace">Q4 回声</text>
    </svg>`;

    if (n === 0) {
      statusEl.textContent = "0/3 层启用 · 散架成四张孤岛卡片";
      descEl.textContent = "粗硬十字沟把画布砍成四块，体量雷同又没有色彩呼应。观者每看一格都要重新找起点，整页毫无整体感。";
    } else if (n === 3) {
      statusEl.textContent = "3/3 层齐备 · 四象限缝成一张整体";
      descEl.textContent = "体量与竖纹拉开 1→2→3→4 阅读顺序，对角深松绿与陶土微点遥相呼应，中心圆核与细虚线把十字轴从「切割刀」变成「缝合线」。";
    } else {
      const missing = [!c && "色彩对角回声", !b && "跨轴连接桥", !s && "体量纹理梯次"].filter(Boolean);
      statusEl.textContent = `${n}/3 层启用 · 还缺「${missing.join("、")}」`;
      descEl.textContent = `已有部分联动，但尚未合拢：补上「${missing[0]}」就能看到四格真正咬合在一起的变化。`;
    }
  }

  Object.values(checks).forEach((el) => el.addEventListener("change", render));
  render();
}

// ============================================================
// 04 · 什么时候用：三大真实场景 + 显性/隐性十字线 X 光透视
// ============================================================
const SCENES = {
  ppt: {
    title: "PPT 策略与竞品象限页",
    en: "STRATEGIC 2×2 SLIDE",
    note: "当两个互相独立的维度（如「影响 × 投入」「增速 × 份额」）天然把议题劈成四类时，四象限是效率最高的一页纸结论。",
    render(explicit) {
      const axis = explicit
        ? `<line x1="210" y1="26" x2="210" y2="234" stroke="#1B5136" stroke-width="1.8"/><line x1="26" y1="130" x2="394" y2="130" stroke="#1B5136" stroke-width="1.8"/>`
        : `<rect x="205" y="26" width="10" height="208" fill="#FAF5EC"/><rect x="26" y="125" width="368" height="10" fill="#FAF5EC"/><line x1="210" y1="26" x2="210" y2="234" stroke="#1B5136" stroke-width="1" stroke-dasharray="3 5" opacity="0.35"/><line x1="26" y1="130" x2="394" y2="130" stroke="#1B5136" stroke-width="1" stroke-dasharray="3 5" opacity="0.35"/>`;
      return `<svg viewBox="0 0 420 260" role="img" aria-label="PPT 2×2 策略矩阵版面示例">
        <rect width="420" height="260" fill="#FAF5EC"/>
        <rect x="26" y="26" width="176" height="96" fill="#EFE6D8"/>
        <rect x="218" y="26" width="176" height="96" fill="#1B5136"/>
        <rect x="26" y="138" width="176" height="96" fill="#F5EEE3"/>
        <rect x="218" y="138" width="176" height="96" fill="#EFE6D8"/>
        ${axis}
        <text x="40" y="50" font-size="11" fill="#48564E" font-family="JetBrains Mono, Noto Sans SC, monospace">高价值 · 高投入</text>
        <text x="40" y="74" font-size="14" fill="#0A0A0A" font-weight="700">长期战略项目</text>
        <text x="232" y="50" font-size="11" fill="#E3C498" font-family="JetBrains Mono, Noto Sans SC, monospace">高价值 · 低投入 ★</text>
        <text x="232" y="74" font-size="14" fill="#FAF5EC" font-weight="700">立即落地快赢项</text>
        <circle cx="364" cy="96" r="14" fill="#D25A2E"/>
        <text x="40" y="162" font-size="11" fill="#48564E" font-family="JetBrains Mono, Noto Sans SC, monospace">低价值 · 高投入</text>
        <text x="40" y="186" font-size="14" fill="#48564E" font-weight="700">果断砍除陷阱</text>
        <text x="232" y="162" font-size="11" fill="#48564E" font-family="JetBrains Mono, Noto Sans SC, monospace">低价值 · 低投入</text>
        <text x="232" y="186" font-size="14" fill="#1C231F" font-weight="700">顺手补齐清单</text>
      </svg>`;
    },
  },
  poster: {
    title: "文化展览与出版物海报",
    en: "EDITORIAL EXHIBITION POSTER",
    note: "用一格放大主视觉、一格放展览大标、一格放几何图解、一格留给场馆信息与留白，四区各守边界又能对角呼应。",
    render(explicit) {
      const axis = explicit
        ? `<line x1="228" y1="18" x2="228" y2="242" stroke="#1B5136" stroke-width="1.8"/><line x1="20" y1="138" x2="400" y2="138" stroke="#1B5136" stroke-width="1.8"/><circle cx="228" cy="138" r="10" fill="#FAF5EC" stroke="#1B5136" stroke-width="1.6"/><circle cx="228" cy="138" r="4" fill="#1B5136"/>`
        : `<line x1="228" y1="18" x2="228" y2="242" stroke="#1B5136" stroke-width="1" stroke-dasharray="3 5" opacity="0.3"/><line x1="20" y1="138" x2="400" y2="138" stroke="#1B5136" stroke-width="1" stroke-dasharray="3 5" opacity="0.3"/>`;
      return `<svg viewBox="0 0 420 260" role="img" aria-label="展览海报四象限排版示例">
        <rect width="420" height="260" fill="#F5EEE3"/>
        <text x="34" y="64" font-size="26" fill="#0A0A0A" font-weight="900">秩序与呼吸</text>
        <rect x="34" y="78" width="44" height="4" fill="#D25A2E"/>
        <text x="34" y="102" font-size="11" fill="#14402A" font-family="JetBrains Mono, Noto Sans SC, monospace">AUTUMN ARCHITECTURE</text>
        <path d="M248 122 L248 34 A88 88 0 0 1 336 122 Z" fill="#1B5136"/>
        <circle cx="356" cy="64" r="18" fill="#D25A2E"/>
        <rect x="34" y="156" width="84" height="72" fill="#E3C498"/>
        ${[0,1,2,3,4,5].map((i) => `<rect x="${132 + i * 12}" y="156" width="5" height="72" fill="#1B5136"/>`).join("")}
        <text x="248" y="172" font-size="13" fill="#1C231F" font-weight="700">2026.10.12 — 11.30</text>
        <text x="248" y="194" font-size="11" fill="#48564E">西岸美术馆 · B 展厅</text>
        <text x="248" y="218" font-size="11" fill="#9F3A14" font-family="JetBrains Mono, Noto Sans SC, monospace">FOUR-QUADRANT PLATE</text>
        ${axis}
      </svg>`;
    },
  },
  bento: {
    title: "产品亮点四宫格介绍页",
    en: "PRODUCT SPEC QUADRANT",
    note: "展示四个并列核心卖点时，用一块深松绿或陶土赤拉出第一落点，其余三格用浅米纸承托，避免四格平权乏味。",
    render(explicit) {
      const axis = explicit
        ? `<line x1="210" y1="20" x2="210" y2="240" stroke="#1B5136" stroke-width="1.6"/><line x1="24" y1="130" x2="396" y2="130" stroke="#1B5136" stroke-width="1.6"/>`
        : ``;
      return `<svg viewBox="0 0 420 260" role="img" aria-label="产品亮点四宫格版面示例">
        <rect width="420" height="260" fill="#FAF5EC"/>
        <rect x="24" y="20" width="178" height="102" fill="#1B5136"/>
        <text x="40" y="54" font-size="24" fill="#FAF5EC" font-family="JetBrains Mono, Noto Sans SC, monospace" font-weight="600">18h</text>
        <text x="40" y="80" font-size="13" fill="#FAF5EC" font-weight="700">全天续航核心亮点</text>
        <text x="40" y="102" font-size="11" fill="#E3C498">第一视觉锚点</text>

        <rect x="218" y="20" width="178" height="102" fill="#F5EEE3" stroke="#D25A2E" stroke-width="1.5"/>
        <circle cx="364" cy="48" r="12" fill="#D25A2E"/>
        <text x="234" y="68" font-size="14" fill="#0A0A0A" font-weight="700">128g 轻盈机身</text>
        <text x="234" y="92" font-size="11" fill="#48564E">陶土色小焦点呼应</text>

        <rect x="24" y="138" width="178" height="102" fill="#EFE6D8"/>
        <text x="40" y="182" font-size="14" fill="#0A0A0A" font-weight="700">零延迟光学快门</text>
        <text x="40" y="206" font-size="11" fill="#48564E">暖燕麦浅底缓冲节奏</text>

        <rect x="218" y="138" width="178" height="102" fill="#F5EEE3" stroke="rgba(27,81,54,0.3)" stroke-width="1"/>
        <rect x="234" y="156" width="28" height="6" fill="#1B5136"/>
        <text x="234" y="188" font-size="14" fill="#0A0A0A" font-weight="700">离线直出 RAW</text>
        <text x="234" y="210" font-size="11" fill="#14402A">深松绿短杠对角回声</text>
        ${axis}
      </svg>`;
    },
  },
};

export function initUsecasePreview() {
  const tabs = [...document.querySelectorAll("[data-scene-tab]")];
  const toggleBtn = document.getElementById("scene-axis-toggle");
  const visualEl = document.getElementById("scene-visual");
  const titleEl = document.getElementById("scene-title");
  const enEl = document.getElementById("scene-en");
  const noteEl = document.getElementById("scene-note");
  if (!tabs.length || !visualEl) return;

  let cur = "ppt";
  let explicit = true;

  function render() {
    const sc = SCENES[cur] || SCENES.ppt;
    tabs.forEach((btn) => {
      const on = btn.dataset.sceneTab === cur;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    toggleBtn.setAttribute("aria-pressed", String(!explicit));
    toggleBtn.textContent = explicit ? "当前：显性十字线（点击切为隐性留白十字）" : "当前：隐性留白十字（点击切回显性十字线）";
    visualEl.innerHTML = sc.render(explicit);
    titleEl.textContent = sc.title;
    enEl.textContent = sc.en;
    noteEl.textContent = explicit
      ? sc.note
      : `${sc.note} 撤掉实线后，靠统一的中轴留白沟槽依然能读出清晰的四象限秩序，版面更透气。`;
  }

  tabs.forEach((btn) => btn.addEventListener("click", () => { cur = btn.dataset.sceneTab; render(); }));
  toggleBtn.addEventListener("click", () => { explicit = !explicit; render(); });
  render();
}

// ============================================================
// 05 · 什么时候别用：翻车现场 vs 救场方案对比板
// ============================================================
const ANTIPATTERNS = [
  {
    id: "portrait",
    label: "单主角强聚焦",
    badTitle: "翻车：十字中轴直接拦腰劈开主角",
    badDesc: "单人侧影或单件主产品需要完整轮廓；硬套四象限，两条正交线正中切过头部与肩线，视觉焦点被生生撕成四瓣。",
    goodTitle: "救场：让四周势能向单一主角汇聚",
    goodDesc: "放弃四分格子，改用向心式或放射式构图把整个画幅让给单一核心。",
    links: [
      { id: "053", name: "053 向心式构图" },
      { id: "052", name: "052 放射式构图" },
    ],
    badSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="反例：十字线劈开单主角剪影">
      <rect width="260" height="190" fill="#F5EEE3"/>
      <circle cx="130" cy="70" r="23" fill="#1C231F"/>
      <path d="M84 176 C84 122 176 122 176 176 Z" fill="#1C231F"/>
      <line x1="130" y1="34" x2="130" y2="180" stroke="#B83227" stroke-width="2.6"/>
      <line x1="16" y1="100" x2="244" y2="100" stroke="#B83227" stroke-width="2.6"/>
      <rect x="74" y="9" width="112" height="22" fill="#FDECE9" stroke="#B83227" stroke-width="1"/>
      <text x="130" y="24" text-anchor="middle" font-size="11" fill="#A6261C" font-weight="700">× 中轴劈裂主体</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="救场：向心聚焦完整单主角">
      <rect width="260" height="190" fill="#FAF5EC"/>
      <circle cx="130" cy="95" r="64" fill="none" stroke="#1B5136" stroke-width="1.3" stroke-dasharray="4 4"/>
      <line x1="26" y1="22" x2="86" y2="62" stroke="#D25A2E" stroke-width="1.8"/>
      <line x1="234" y1="22" x2="174" y2="62" stroke="#D25A2E" stroke-width="1.8"/>
      <line x1="26" y1="168" x2="86" y2="128" stroke="#1B5136" stroke-width="1.8"/>
      <line x1="234" y1="168" x2="174" y2="128" stroke="#1B5136" stroke-width="1.8"/>
      <circle cx="130" cy="70" r="21" fill="#1B5136"/>
      <path d="M92 152 C92 106 168 106 168 152 Z" fill="#1B5136"/>
      <text x="130" y="178" text-anchor="middle" font-size="11" fill="#14402A" font-weight="700">✓ 完整主体 · 向心凝聚</text>
    </svg>`,
  },
  {
    id: "three",
    label: "只有三项要点",
    badTitle: "翻车：三缺一硬凑出尴尬废话格",
    badDesc: "汇报明明只有三个核心论点，硬塞进四象限，右下角要么空出难看的黑洞，要么被迫塞进毫无信息量的装饰大字。",
    goodTitle: "救场：三项内容天然属于三角或金字塔",
    goodDesc: "内容数量决定几何骨架，三点并列或一顶二底直接走三角 / 金字塔结构，不凑数。",
    links: [
      { id: "041", name: "041 三角构图" },
      { id: "042", name: "042 金字塔构图" },
    ],
    badSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="反例：三项内容硬塞四象限留下尴尬空格">
      <rect width="260" height="190" fill="#F5EEE3"/>
      <line x1="130" y1="16" x2="130" y2="174" stroke="#1B5136" stroke-width="1.4"/>
      <line x1="16" y1="95" x2="244" y2="95" stroke="#1B5136" stroke-width="1.4"/>
      <rect x="28" y="28" width="88" height="54" fill="#1B5136"/>
      <rect x="144" y="28" width="88" height="54" fill="#D25A2E"/>
      <rect x="28" y="108" width="88" height="54" fill="#E3C498"/>
      <rect x="144" y="108" width="88" height="54" fill="none" stroke="#B83227" stroke-width="1.8" stroke-dasharray="5 4"/>
      <text x="188" y="139" text-anchor="middle" font-size="11" fill="#A6261C" font-weight="700">? 凑数空格</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="救场：三项内容采用稳定三角构图">
      <rect width="260" height="190" fill="#FAF5EC"/>
      <polygon points="130,30 46,154 214,154" fill="none" stroke="#1B5136" stroke-width="1.6" stroke-dasharray="4 4"/>
      <rect x="92" y="26" width="76" height="42" fill="#1B5136"/>
      <rect x="30" y="118" width="76" height="42" fill="#D25A2E"/>
      <rect x="154" y="118" width="76" height="42" fill="#E3C498"/>
      <text x="130" y="178" text-anchor="middle" font-size="11" fill="#14402A" font-weight="700">✓ 三角稳定 · 零冗余</text>
    </svg>`,
  },
  {
    id: "flow",
    label: "连续单线叙事",
    badTitle: "翻车：一句话和一条时间线被切碎成四截",
    badDesc: "时间演进或长文故事需要不间断的动势引导；拆进四个独立象限后，读者在十字交叉口迷茫该先往右还是先往下。",
    goodTitle: "救场：沿弧线或螺旋一气呵成读到底",
    goodDesc: "需要明确起止与连贯流向时，用弧形或螺旋把视线沿着单一路线带进画面深处。",
    links: [
      { id: "049", name: "049 弧形构图" },
      { id: "051", name: "051 螺旋构图" },
    ],
    badSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="反例：连续叙事被四象限切碎">
      <rect width="260" height="190" fill="#F5EEE3"/>
      <line x1="130" y1="16" x2="130" y2="174" stroke="#B83227" stroke-width="2"/>
      <line x1="16" y1="95" x2="244" y2="95" stroke="#B83227" stroke-width="2"/>
      <text x="72" y="60" text-anchor="middle" font-size="12" fill="#1C231F">1. 起点</text>
      <text x="188" y="60" text-anchor="middle" font-size="12" fill="#A6261C">2? 往右?</text>
      <text x="72" y="140" text-anchor="middle" font-size="12" fill="#A6261C">2? 往下?</text>
      <text x="188" y="140" text-anchor="middle" font-size="12" fill="#1C231F">4. 终点</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="救场：弧形连续视线路径">
      <rect width="260" height="190" fill="#FAF5EC"/>
      <path d="M32 146 Q128 24 228 118" fill="none" stroke="#1B5136" stroke-width="2.6"/>
      <circle cx="46" cy="128" r="9" fill="#1B5136"/>
      <circle cx="104" cy="76" r="9" fill="#2D7040"/>
      <circle cx="168" cy="76" r="9" fill="#E3C498"/>
      <circle cx="218" cy="110" r="11" fill="#D25A2E"/>
      <text x="130" y="176" text-anchor="middle" font-size="11" fill="#14402A" font-weight="700">✓ 连续弧线 · 单向顺读</text>
    </svg>`,
  },
  {
    id: "enclose",
    label: "层层包裹闭环",
    badTitle: "翻车：外紧内聚的层叠感被十字切漏气",
    badDesc: "需要用边框把注意力严密圈在中心或做由外向内的层层嵌套时，通到画边的十字线会把包裹感一刀切漏。",
    goodTitle: "救场：改用环形、同心或规整方框包裹",
    goodDesc: "需要整体围合与层层递进时，方形、矩形、环形与同心式构图天然自带封闭场。",
    links: [
      { id: "050", name: "050 环形构图" },
      { id: "055", name: "055 同心式构图" },
      { id: "045", name: "045 方形构图" },
    ],
    badSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="反例：十字轴切断同心包裹感">
      <rect width="260" height="190" fill="#F5EEE3"/>
      <circle cx="130" cy="102" r="60" fill="none" stroke="#1B5136" stroke-width="2"/>
      <circle cx="130" cy="102" r="34" fill="none" stroke="#D25A2E" stroke-width="2"/>
      <line x1="130" y1="34" x2="130" y2="182" stroke="#B83227" stroke-width="2.8"/>
      <line x1="16" y1="102" x2="244" y2="102" stroke="#B83227" stroke-width="2.8"/>
      <rect x="78" y="9" width="104" height="22" fill="#FDECE9" stroke="#B83227" stroke-width="1"/>
      <text x="130" y="24" text-anchor="middle" font-size="11" fill="#A6261C" font-weight="700">× 围合被切散</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 260 190" role="img" aria-label="救场：完整同心圆层层向内聚焦">
      <rect width="260" height="190" fill="#FAF5EC"/>
      <circle cx="130" cy="92" r="66" fill="#EFE6D8" stroke="#1B5136" stroke-width="1.6"/>
      <circle cx="130" cy="92" r="44" fill="#E3C498" stroke="#1B5136" stroke-width="1.4"/>
      <circle cx="130" cy="92" r="22" fill="#D25A2E"/>
      <text x="130" y="178" text-anchor="middle" font-size="11" fill="#14402A" font-weight="700">✓ 完整嵌套 · 层层向心</text>
    </svg>`,
  },
];

export function initAntiPatterns() {
  const tabs = [...document.querySelectorAll("[data-anti-tab]")];
  const badSvg = document.getElementById("anti-bad-svg");
  const goodSvg = document.getElementById("anti-good-svg");
  const badTitle = document.getElementById("anti-bad-title");
  const badDesc = document.getElementById("anti-bad-desc");
  const goodTitle = document.getElementById("anti-good-title");
  const goodDesc = document.getElementById("anti-good-desc");
  const linksEl = document.getElementById("anti-links");
  if (!tabs.length || !badSvg) return;

  function select(id) {
    const item = ANTIPATTERNS.find((a) => a.id === id) || ANTIPATTERNS[0];
    tabs.forEach((btn) => {
      const on = btn.dataset.antiTab === item.id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    badSvg.innerHTML = item.badSvg;
    goodSvg.innerHTML = item.goodSvg;
    badTitle.textContent = item.badTitle;
    badDesc.textContent = item.badDesc;
    goodTitle.textContent = item.goodTitle;
    goodDesc.textContent = item.goodDesc;
    linksEl.innerHTML = item.links
      .map((l) => `<a class="sibling-link" href="https://layout.xiaoxiaodong.ai/${l.id}/play/" target="_blank" rel="noopener">去看 ${l.name} ↗</a>`)
      .join("");
  }

  tabs.forEach((btn) => btn.addEventListener("click", () => select(btn.dataset.antiTab)));
  select("portrait");
}

// ============================================================
// 06 · 眼力小练习：3 题单变量中性标签可视化练习
// ============================================================
const QUIZ_DATA = [
  {
    q: "第 1 题 · 唯一变量：体量与色彩对比",
    prompt: "下面四版四象限构图的十字轴都在正中、重心也未倾覆，唯独四格之间的体量与色阶梯次不同。哪一版既稳重又最有阅读层次？",
    correct: 2,
    explain: "方案 C 成立：左上深松绿主块确立第一入口，右上陶土赤圆形成焦点点缀，左下暖燕麦块与右下松绿竖纹形成对角轻重梯次。A 四格均等僵成表格；B 单块吞掉绝大部分面积；D 仅一格有内容，其余三格空悬。",
    options: [
      {
        label: "方案 A",
        why: "四格面积与暖燕麦色完全相同，重心虽稳，但毫无主次，沦为僵硬表格。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="29" y="21" width="32" height="32" fill="#E3C498"/><rect x="119" y="21" width="32" height="32" fill="#E3C498"/><rect x="29" y="82" width="32" height="32" fill="#E3C498"/><rect x="119" y="82" width="32" height="32" fill="#E3C498"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 B",
        why: "左上深松绿巨块几乎塞满整个象限并碾压其余三格极小灰点，对比失控。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="14" y="11" width="70" height="52" fill="#1B5136"/><rect x="128" y="34" width="12" height="12" fill="#9FB3A7"/><rect x="44" y="92" width="12" height="12" fill="#9FB3A7"/><rect x="128" y="92" width="12" height="12" fill="#9FB3A7"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 C",
        why: "成立：深松绿大方 + 陶土赤焦点圆 + 暖燕麦方块 + 松绿竖纹对角呼应，主次分明且稳。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="24" y="16" width="42" height="40" fill="#1B5136"/><circle cx="133" cy="36" r="15" fill="#D25A2E"/><rect x="30" y="84" width="30" height="28" fill="#E3C498"/><g fill="#1B5136"><rect x="114" y="80" width="4" height="36"/><rect x="122" y="80" width="4" height="36"/><rect x="130" y="80" width="4" height="36"/><rect x="138" y="80" width="4" height="36"/><rect x="146" y="80" width="4" height="36"/></g><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 D",
        why: "三格只剩微弱空心小点，画面不成四象限对位关系。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="26" y="18" width="38" height="36" fill="#1B5136"/><circle cx="135" cy="36" r="4" fill="none" stroke="#9FB3A7" stroke-width="1.4"/><circle cx="45" cy="98" r="4" fill="none" stroke="#9FB3A7" stroke-width="1.4"/><circle cx="135" cy="98" r="4" fill="none" stroke="#9FB3A7" stroke-width="1.4"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
    ],
  },
  {
    q: "第 2 题 · 唯一变量：跨象限边界与呼应",
    prompt: "四版的体量梯次相近，唯一区别在于四个象限的边界纪律与彼此呼应方式。哪一版既分区清朗又连成整体？",
    correct: 1,
    explain: "方案 B 成立：四格稳守各自象限，同时用对角深松绿/陶土呼应与指向中心的细虚线把视线聚拢。A 四格各逃一角毫无关联；C 图形压穿十字线并堵死交点；D 四种割裂艳色互相冲撞。",
    options: [
      {
        label: "方案 A",
        why: "四块元素被推到最远的四个画角，中间空出冷漠宽沟，像四张无关贴纸。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="10" y="10" width="22" height="20" fill="#1B5136"/><circle cx="160" cy="20" r="10" fill="#D25A2E"/><rect x="10" y="106" width="22" height="18" fill="#E3C498"/><rect x="148" y="105" width="22" height="20" fill="#1B5136"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 B",
        why: "成立：四格守住中轴边界，对角以细虚线与中心陶土圆核形成清晰回声。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><line x1="56" y1="44" x2="124" y2="92" stroke="#1B5136" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="124" y1="44" x2="56" y2="92" stroke="#1B5136" stroke-width="1.2" stroke-dasharray="3 3"/><rect x="28" y="20" width="32" height="30" fill="#1B5136"/><circle cx="134" cy="34" r="13" fill="#D25A2E"/><rect x="30" y="84" width="28" height="26" fill="#E3C498"/><rect x="120" y="82" width="32" height="30" fill="#1B5136"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#D25A2E"/></svg>`,
      },
      {
        label: "方案 C",
        why: "两个大块直接压穿竖轴与横轴，还盖住中心交点，四象限分区纪律彻底失效。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="64" y="22" width="46" height="34" fill="#1B5136"/><circle cx="94" cy="70" r="18" fill="#D25A2E"/><rect x="30" y="86" width="28" height="24" fill="#E3C498"/><rect x="128" y="86" width="28" height="24" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 D",
        why: "四象限使用四种毫无色彩亲缘的高饱和色块，且连线彼此背向画外逃逸。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="28" y="20" width="32" height="30" fill="#1D68C4"/><circle cx="134" cy="35" r="15" fill="#D9388A"/><rect x="28" y="84" width="32" height="28" fill="#E0A800"/><rect x="120" y="84" width="32" height="28" fill="#7D3AC1"/><line x1="28" y1="20" x2="12" y2="10" stroke="#48564E" stroke-width="1.4"/><line x1="152" y1="112" x2="168" y2="124" stroke="#48564E" stroke-width="1.4"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
    ],
  },
  {
    q: "第 3 题 · 唯一变量：视觉重心与轴心落位",
    prompt: "四版都用了相同的深松绿、陶土赤与暖燕麦元素，唯一变化的是它们的摆放落位与轴心位置。哪一版实现了稳健的动态平衡？",
    correct: 1,
    explain: "方案 B 成立：左上深松绿重块与右下陶土赤大圆，辅以右上与左下暖燕麦块形成对角配重，中心交点落在稳健的中央区间，画面稳而不僵。A 全堆左侧倾覆；C 顶部双压头重脚轻；D 竖轴被推到右缘 82%，右两格被挤扁。",
    options: [
      {
        label: "方案 A",
        why: "深松绿和陶土赤两个重块全压在左半幅，右侧偏空，整张构图向左翻倒。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="22" y="16" width="44" height="40" fill="#1B5136"/><circle cx="44" cy="98" r="20" fill="#D25A2E"/><rect x="124" y="30" width="18" height="16" fill="#E3C498"/><rect x="124" y="92" width="18" height="16" fill="#E3C498"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 B",
        why: "成立：左上重块与右下陶土焦块对角平衡，轴心稳守中央，重心稳咬圆核。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="86" y1="8" x2="86" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="70" x2="172" y2="70" stroke="#1B5136" stroke-width="1.2"/><rect x="22" y="18" width="42" height="38" fill="#1B5136"/><rect x="116" y="26" width="28" height="24" fill="#E3C498"/><rect x="28" y="86" width="28" height="24" fill="#E3C498"/><circle cx="128" cy="99" r="19" fill="#D25A2E"/><circle cx="86" cy="70" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="86" cy="70" r="3.2" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 C",
        why: "两个高权重实色块同时压在顶部两象限，下方承托虚弱，产生明显的头重脚轻。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="90" y1="8" x2="90" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="22" y="16" width="44" height="40" fill="#1B5136"/><circle cx="134" cy="36" r="20" fill="#D25A2E"/><rect x="36" y="92" width="18" height="16" fill="#E3C498"/><rect x="126" y="92" width="18" height="16" fill="#E3C498"/><circle cx="90" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="90" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
      {
        label: "方案 D",
        why: "竖向分割轴被推到右缘 82%，右两格被压成狭缝，失去四象限均势。",
        svg: `<svg viewBox="0 0 180 135"><rect width="180" height="135" fill="#F5EEE3"/><line x1="146" y1="8" x2="146" y2="127" stroke="#1B5136" stroke-width="1.2"/><line x1="8" y1="67.5" x2="172" y2="67.5" stroke="#1B5136" stroke-width="1.2"/><rect x="34" y="18" width="46" height="38" fill="#1B5136"/><rect x="153" y="24" width="12" height="24" fill="#E3C498"/><rect x="44" y="84" width="32" height="26" fill="#E3C498"/><circle cx="159" cy="98" r="7" fill="#D25A2E"/><circle cx="146" cy="67.5" r="7.5" fill="#F5EEE3" stroke="#1B5136" stroke-width="1.2"/><circle cx="146" cy="67.5" r="3.2" fill="#1B5136"/></svg>`,
      },
    ],
  },
];

export function initQuiz() {
  const stepBtns = [...document.querySelectorAll("[data-quiz-step]")];
  const titleEl = document.getElementById("quiz-q-title");
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const feedbackEl = document.getElementById("quiz-feedback");
  const scoreEl = document.getElementById("quiz-score");
  const nextBtn = document.getElementById("quiz-next");
  const resetBtn = document.getElementById("quiz-reset");
  if (!gridEl) return;

  let cur = 0;
  const answers = [null, null, null];

  function render() {
    const item = QUIZ_DATA[cur];
    const picked = answers[cur];
    const rightCount = answers.filter((a, i) => a === QUIZ_DATA[i].correct).length;
    const doneCount = answers.filter((a) => a !== null).length;

    scoreEl.textContent = `已答 ${doneCount}/3 · 答对 ${rightCount} 题`;
    titleEl.textContent = item.q;
    promptEl.textContent = item.prompt;

    stepBtns.forEach((btn, idx) => {
      const active = idx === cur;
      const a = answers[idx];
      btn.classList.toggle("is-active", active);
      btn.classList.toggle("is-right", a !== null && a === QUIZ_DATA[idx].correct);
      btn.classList.toggle("is-wrong", a !== null && a !== QUIZ_DATA[idx].correct);
      btn.setAttribute("aria-pressed", String(active));
    });

    gridEl.innerHTML = item.options.map((opt, idx) => {
      let cls = "quiz-opt";
      let mark = "";
      if (picked !== null) {
        if (idx === item.correct) { cls += " is-correct"; mark = "✓ 正解"; }
        else if (idx === picked) { cls += " is-wrong"; mark = "× 偏差"; }
      }
      return `<button type="button" class="${cls}" data-opt="${idx}" aria-pressed="${picked === idx}">
        <span class="quiz-opt-head"><strong>${opt.label}</strong>${mark ? `<span class="quiz-mark">${mark}</span>` : ""}</span>
        <span class="quiz-plate">${opt.svg}</span>
        ${picked !== null ? `<span class="quiz-opt-why">${opt.why}</span>` : ""}
      </button>`;
    }).join("");

    gridEl.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[cur] = Number(btn.dataset.opt);
        render();
      });
    });

    if (picked !== null) {
      const ok = picked === item.correct;
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-warn"}`;
      feedbackEl.innerHTML = `<strong>${ok ? "判断准确！" : "再看一眼变量差异："}</strong>${item.explain}`;
      feedbackEl.hidden = false;
    } else {
      feedbackEl.hidden = true;
      feedbackEl.textContent = "";
    }

    nextBtn.disabled = cur >= QUIZ_DATA.length - 1;
  }

  stepBtns.forEach((btn) => btn.addEventListener("click", () => {
    cur = Number(btn.dataset.quizStep);
    render();
  }));
  nextBtn.addEventListener("click", () => {
    if (cur < QUIZ_DATA.length - 1) { cur++; render(); }
  });
  resetBtn.addEventListener("click", () => {
    answers.fill(null);
    cur = 0;
    render();
  });
  render();
}

// ============================================================
// 07 · 原海报高清缩放拖拽灯箱（只复用 #poster.src，不重复内联图片）
// ============================================================
export function initPosterLightbox() {
  const posterThumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const stage = document.getElementById("poster-modal-stage");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  if (!posterThumb || !openBtn || !modal) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = null;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    modalImg.src = posterThumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target === stage) close(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

  zoomInBtn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn.addEventListener("click", () => { scale = Math.max(0.7, +(scale - 0.35).toFixed(2)); applyTransform(); });
  zoomResetBtn.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.7, Math.min(3, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  modalImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
    try { modalImg.setPointerCapture(e.pointerId); } catch {}
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = dragging.ox + (e.clientX - dragging.sx);
    ty = dragging.oy + (e.clientY - dragging.sy);
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => { dragging = null; });
  modalImg.addEventListener("pointercancel", () => { dragging = null; });
}
