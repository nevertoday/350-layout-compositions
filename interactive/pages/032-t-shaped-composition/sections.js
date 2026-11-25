// 032 T形构图 · 正文 01–07 节专属交互模块
// 严格遵循相邻两节不用同一种控件：
// 01 SVG 受力剖面切换 + 头重脚轻对比 | 02 盲测等长标尺 + T 交接遮挡切换
// 03 深海蓝四变体蓝图矩阵 + 同族对照 | 04 五节点编年时间轴
// 05 四场景禁用翻牌对照 | 06 四选一单一变量视觉判别题 | 07 原海报缩放拖移灯箱

// ---------- 01 海报里的三道机关 ----------
function initSection01() {
  const parts = {
    beam: {
      title: "① 顶部横梁：先用宽度稳住第一眼",
      quote: "原海报：「上方为宽横带，承载主要内容，形成视觉重量。」",
      body: "横梁越完整，越像建筑的过梁先兜住视线。它负责交代主标题、主题基调或全局指标，让人不用四处搜寻就知道「这页在讲什么」。",
      metric: "经验展宽带：72%–94% · 厚重比：14%–28%",
    },
    stem: {
      title: "② 垂直轴线：把横扫收束成单向深潜",
      quote: "原海报：「中轴向下延伸，形成稳定的垂直支撑。垂直轴线引导视线下移，强化信息层级。」",
      body: "水平看宽、垂直看深。中央垂轴把宽横带攒下的注意力折向下方，按顺序交代展开细节，让视线不用在左右之间反复犹豫。",
      metric: "经验偏轴容限：34%–66% · 严禁中段大断层",
    },
    anchor: {
      title: "③ 底部落点：给下冲惯性一个硬着陆",
      quote: "原海报：「终点聚焦于核心内容，形成清晰的阅读路径。在视觉落点聚焦核心内容，增强记忆与传达效果。」",
      body: "如果垂轴一路向下却没有高对比焦点兜底，视线会直接滑出画框底边。放一枚紧凑的金星胶囊或行动按钮，正好接住全部惯性。",
      metric: "落点宽度建议 ≤ 顶梁 55%，避免反客为主",
    },
    wings: {
      title: "④ 双翼负形：留白是垂轴的隐形护栏",
      quote: "原海报结构特征：「横与竖的结合，兼具张力与秩序感。」",
      body: "横梁左右下方的两片深蓝空区绝不是浪费——它们把中央垂轴衬托成唯一通道。次要注释可以轻放于双翼，但绝不能越界遮挡垂轴。",
      metric: "双翼对比度需低于主 T 骨架 2 档以上",
    },
  };

  let activePart = "beam";
  let topHeavyMode = false;

  const partBtns = document.querySelectorAll("[data-anat-part]");
  const modeBtns = document.querySelectorAll("[data-anat-mode]");
  const svg = document.getElementById("anatSvg");
  const titleEl = document.getElementById("anatTitle");
  const quoteEl = document.getElementById("anatQuote");
  const bodyEl = document.getElementById("anatBody");
  const metricEl = document.getElementById("anatMetric");
  const modeNoteEl = document.getElementById("anatModeNote");

  function update() {
    const info = parts[activePart];
    if (titleEl) titleEl.textContent = info.title;
    if (quoteEl) quoteEl.textContent = info.quote;
    if (bodyEl) bodyEl.textContent = info.body;
    if (metricEl) metricEl.textContent = info.metric;
    if (modeNoteEl) {
      modeNoteEl.textContent = topHeavyMode
        ? "当前演示「头重脚轻」：顶梁压到 40% 厚，垂轴缩成短桩，视觉重心上漂，反而不稳。"
        : "当前演示「理想配重」：顶梁宽 86% × 厚 20%，中轴舒展下导，重心稳落下方焦块。";
      modeNoteEl.dataset.warn = topHeavyMode ? "1" : "0";
    }
    partBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.anatPart === activePart)));
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.anatMode === "heavy") === topHeavyMode)));

    if (!svg) return;
    svg.dataset.part = activePart;
    svg.dataset.mode = topHeavyMode ? "heavy" : "balanced";
    const barRect = svg.querySelector("#anatBarRect");
    const stemGroup = svg.querySelector("#anatStemGroup");
    const cogDot = svg.querySelector("#anatCog");
    const cogText = svg.querySelector("#anatCogText");
    if (barRect) {
      barRect.setAttribute("height", topHeavyMode ? "118" : "58");
      barRect.setAttribute("fill", topHeavyMode ? "#C44536" : "#F3B329");
    }
    if (stemGroup) {
      stemGroup.setAttribute("transform", topHeavyMode ? "translate(0, 60) scale(1, 0.56)" : "translate(0, 0) scale(1, 1)");
      stemGroup.setAttribute("transform-origin", "200 84");
    }
    if (cogDot) {
      cogDot.setAttribute("cy", topHeavyMode ? "96" : "152");
      cogDot.setAttribute("fill", topHeavyMode ? "#FF7B6B" : "#6CE5B1");
    }
    if (cogText) {
      cogText.setAttribute("y", topHeavyMode ? "99" : "155");
      cogText.textContent = topHeavyMode ? "重心上漂（头重）" : "重心稳落中下";
    }
  }

  partBtns.forEach((b) =>
    b.addEventListener("click", () => {
      activePart = b.dataset.anatPart;
      update();
    })
  );
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      topHeavyMode = b.dataset.anatMode === "heavy";
      update();
    })
  );
  update();
}

// ---------- 02 横竖错觉与 T 交接（Fick 1851 / Künnapas 1955 盲测实验） ----------
function initSection02() {
  const slider = document.getElementById("illusionSlider");
  const valLabel = document.getElementById("illusionSliderVal");
  const revealBtn = document.getElementById("illusionRevealBtn");
  const resetBtn = document.getElementById("illusionResetBtn");
  const readout = document.getElementById("illusionReadout");
  const stemLine = document.getElementById("illusionStem");
  const stemFoot = document.getElementById("illusionStemFoot");
  const rulerGroup = document.getElementById("illusionRuler");
  const truePctEl = document.getElementById("illusionTruePct");
  const juncBtns = document.querySelectorAll("[data-junc-mode]");
  const juncStem = document.getElementById("juncStem");
  const juncExplain = document.getElementById("juncExplain");

  if (!slider) return;
  const BAR_LEN = 176; // 固定横梁像素长度（与 360×286 视口高度齐平）
  let revealed = false;
  let juncMode = "flush";

  function renderIllusion() {
    const pct = Number(slider.value); // 55..130 (%)
    const stemPx = Math.round((BAR_LEN * pct) / 100);
    if (stemLine) stemLine.setAttribute("y2", String(49 + stemPx));
    if (stemFoot) stemFoot.setAttribute("y1", String(49 + stemPx));
    if (stemFoot) stemFoot.setAttribute("y2", String(49 + stemPx));
    if (valLabel) valLabel.textContent = revealed ? `实际为横梁的 ${pct}%` : "盲测中（先凭眼力调）";
    if (rulerGroup) rulerGroup.style.opacity = revealed ? "1" : "0";
    if (truePctEl) truePctEl.textContent = `竖轴 ${stemPx}px ÷ 横梁 ${BAR_LEN}px = ${pct}%`;

    if (readout) {
      if (!revealed) {
        readout.textContent = "先别看刻度：拖动滑杆，让下方绿柱「看起来」与上方金黄横梁一样长，再点「揭晓真尺」。";
        readout.dataset.state = "idle";
      } else {
        const diff = pct - 100;
        if (diff <= -5) {
          readout.textContent = `你把竖轴拉短了 ${Math.abs(diff)}%（仅横梁的 ${pct}%），却觉得两者等长——这正是 Fick（1851）与 Künnapas（1955）证实的水平-垂直二等分错觉：T 形竖轴会被人眼自动拉长！`;
          readout.dataset.state = "classic";
        } else if (Math.abs(diff) < 5) {
          readout.textContent = `你的眼力极准（偏差仅 ${diff >= 0 ? "+" : ""}${diff}%）！但在普通观者眼中，真正等长的 T 形竖轴往往会显得比横梁长出约一成，所以排版时竖向空间常显修长有力。`;
          readout.dataset.state = "exact";
        } else {
          readout.textContent = `这次竖轴其实比横梁长了 +${diff}%（${pct}%）。把滑杆拉回 100% 看看：真实等长的 T 形，是不是反而感觉竖条更修长？`;
          readout.dataset.state = "long";
        }
      }
    }
    if (revealBtn) revealBtn.textContent = revealed ? "收起真尺继续盲测" : "揭晓真尺";
  }

  slider.addEventListener("input", renderIllusion);
  revealBtn?.addEventListener("click", () => {
    revealed = !revealed;
    renderIllusion();
  });
  resetBtn?.addEventListener("click", () => {
    revealed = false;
    slider.value = "72";
    renderIllusion();
  });

  function renderJunc() {
    juncBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.juncMode === juncMode)));
    if (juncStem) {
      if (juncMode === "flush") {
        juncStem.setAttribute("y", "66");
        juncStem.setAttribute("height", "96");
      } else if (juncMode === "gap") {
        juncStem.setAttribute("y", "88");
        juncStem.setAttribute("height", "74");
      } else {
        juncStem.setAttribute("y", "34");
        juncStem.setAttribute("height", "128");
      }
    }
    if (juncExplain) {
      if (juncMode === "flush") {
        juncExplain.textContent = "紧贴 T 形交接：垂轴边缘在连续横梁下沿戛然而止，大脑凭遮挡线索立刻判定「金横梁在前景统领，绿垂轴从其后方顺势延伸」，主次秩序一秒成形。";
      } else if (juncMode === "gap") {
        juncExplain.textContent = "拉开 22px 断隙：T 形交接消失，大脑把它读成互不相干的上下两块浮条，横梁积累的视线能量无法自然转入垂轴。";
      } else {
        juncExplain.textContent = "竖轴顶穿横梁：T 形变成十字交叉（030），横梁被拦腰斩断成左右两节，不再有「顶部通栏承载」的统一气势。";
      }
    }
  }

  juncBtns.forEach((b) =>
    b.addEventListener("click", () => {
      juncMode = b.dataset.juncMode;
      renderJunc();
    })
  );

  renderIllusion();
  renderJunc();
}

// ---------- 03 一页多变：T 形的四副骨架（深海蓝暗室） ----------
function initSection03() {
  const variants = {
    classic: {
      name: "经典居中正 T",
      en: "SYMMETRIC T · POSTER 032",
      summary: "032 原海报骨架：全宽顶梁居中挂轴，双翼留白完全对称，仪式感与权威感最强。",
      fit: "适合：品牌主视觉、发布会首屏、教学原理海报、数据大屏主屏。",
      ratio: "左右负形比 1 : 1 · 视觉落点正中",
      svg: `
        <rect x="24" y="24" width="272" height="48" fill="#F3B329"/>
        <circle cx="160" cy="48" r="16" fill="#031B38"/>
        <path d="M138 72 H182 V166 H192 L160 198 L128 166 H138 Z" fill="#8EBFA7"/>
        <rect x="104" y="206" width="112" height="30" rx="8" fill="#F3B329"/>
        <rect x="24" y="88" width="90" height="92" rx="8" fill="none" stroke="rgba(152,189,180,0.45)" stroke-dasharray="4 4"/>
        <rect x="206" y="88" width="90" height="92" rx="8" fill="none" stroke="rgba(152,189,180,0.45)" stroke-dasharray="4 4"/>
        <text x="160" y="256" text-anchor="middle" fill="#A5D6BE" font-size="11" font-family="JetBrains Mono">CENTER 50% · SYMMETRIC</text>
      `,
    },
    offset: {
      name: "偏轴三分张力 T",
      en: "ASYMMETRIC T · SWISS EDITORIAL",
      summary: "保持通栏大顶梁，将垂直导流轴微移至约 36%–38% 处，右侧腾出大片留白容纳长注解或大特写。",
      fit: "适合：建筑展讯、瑞士风格画册跨页、专题网页首屏（既稳重又不刻板）。",
      ratio: "左右负形比 1 : 2.1 · 保持双翼悬臂",
      svg: `
        <rect x="20" y="24" width="280" height="44" fill="#F3B329"/>
        <circle cx="118" cy="46" r="14" fill="#031B38"/>
        <path d="M98 68 H138 V168 H148 L118 198 L88 168 H98 Z" fill="#8EBFA7"/>
        <rect x="64" y="206" width="108" height="28" rx="8" fill="#F3B329"/>
        <rect x="20" y="84" width="60" height="96" rx="8" fill="none" stroke="rgba(152,189,180,0.35)" stroke-dasharray="4 4"/>
        <rect x="160" y="84" width="140" height="104" rx="8" fill="rgba(142,191,167,0.12)" stroke="rgba(152,189,180,0.55)"/>
        <line x1="176" y1="110" x2="278" y2="110" stroke="#EEE1C7" stroke-width="2.5"/>
        <line x1="176" y1="128" x2="256" y2="128" stroke="#A5D6BE" stroke-width="2"/>
        <line x1="176" y1="146" x2="268" y2="146" stroke="#A5D6BE" stroke-width="2"/>
        <text x="160" y="256" text-anchor="middle" fill="#A5D6BE" font-size="11" font-family="JetBrains Mono">OFFSET 37% · DYNAMIC BALANCE</text>
      `,
    },
    inverted: {
      name: "倒 T 底座式（⊥）",
      en: "INVERTED T · MONUMENTAL BASE",
      summary: "把宽横梁挪到底部当稳固地基，中央垂轴拔地而起托举单品或雕塑，重心彻底下沉，纹丝不动。",
      fit: "适合：高耸建筑摄影、香水/瓶装静物海报、地平线与独树构图。",
      ratio: "底部承载 88% · 视线自下而上仰望",
      svg: `
        <rect x="108" y="24" width="104" height="28" rx="8" fill="#F3B329"/>
        <path d="M138 184 H182 V88 H192 L160 58 L128 88 H138 Z" fill="#8EBFA7"/>
        <rect x="24" y="184" width="272" height="48" fill="#F3B329"/>
        <circle cx="160" cy="208" r="15" fill="#031B38"/>
        <rect x="24" y="64" width="88" height="104" rx="8" fill="none" stroke="rgba(152,189,180,0.35)" stroke-dasharray="4 4"/>
        <rect x="208" y="64" width="88" height="104" rx="8" fill="none" stroke="rgba(152,189,180,0.35)" stroke-dasharray="4 4"/>
        <text x="160" y="256" text-anchor="middle" fill="#A5D6BE" font-size="11" font-family="JetBrains Mono">INVERTED ⊥ · GROUNDED BASE</text>
      `,
    },
    twin: {
      name: "宽顶双柱变体",
      en: "PORTAL T · DUAL-CHANNEL",
      summary: "顶部仍以整条金横梁统领，下方将单柱细分为紧密并行的双子列（中间留细缝），既保整体 T 轮廓又承接对照信息。",
      fit: "适合：数据看板对比页、演讲目录页、双语对照展板。",
      ratio: "双柱合宽 ≤ 顶梁 48% · 仍留宽翼负形",
      svg: `
        <rect x="22" y="24" width="276" height="46" fill="#F3B329"/>
        <circle cx="160" cy="47" r="14" fill="#031B38"/>
        <rect x="106" y="70" width="48" height="114" fill="#8EBFA7"/>
        <rect x="166" y="70" width="48" height="114" fill="#8EBFA7" opacity="0.82"/>
        <path d="M106 184 H214 L160 206 Z" fill="#8EBFA7"/>
        <rect x="102" y="210" width="116" height="26" rx="7" fill="#F3B329"/>
        <text x="160" y="256" text-anchor="middle" fill="#A5D6BE" font-size="11" font-family="JetBrains Mono">DUAL COLUMN · UNIFIED LANDING</text>
      `,
    },
  };

  const btns = document.querySelectorAll("[data-variant-btn]");
  const svg = document.getElementById("variantSvg");
  const nameEl = document.getElementById("variantName");
  const enEl = document.getElementById("variantEn");
  const sumEl = document.getElementById("variantSummary");
  const fitEl = document.getElementById("variantFit");
  const ratioEl = document.getElementById("variantRatio");

  function setVariant(key) {
    const v = variants[key];
    if (!v) return;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.variantBtn === key)));
    if (svg) svg.innerHTML = v.svg;
    if (nameEl) nameEl.textContent = v.name;
    if (enEl) enEl.textContent = v.en;
    if (sumEl) sumEl.textContent = v.summary;
    if (fitEl) fitEl.textContent = v.fit;
    if (ratioEl) ratioEl.textContent = v.ratio;
  }

  btns.forEach((b) => b.addEventListener("click", () => setVariant(b.dataset.variantBtn)));
  setVariant("classic");
}

// ---------- 04 从祭坛柱梁到网页首屏（编年轴切换） ----------
function initSection04() {
  const eras = {
    "1457": {
      year: "1457–1459",
      title: "文艺复兴祭坛画的高横轴与中央垂线",
      work: "Andrea Mantegna《受难图》（La Crucifixion），巴黎卢浮宫馆藏（INV 368）",
      desc: "曼特尼亚在维罗纳圣泽诺祭坛画底座中央绘出高悬的横木与直贯画心的十字立柱，借横竖正交骨架在人物群像之上建立庄严、不可动摇的视觉纵轴。建筑与古典绘画里的「柱梁结构」，正是 T 形构图最早的秩序原型。",
      svg: `
        <rect x="14" y="14" width="172" height="122" rx="4" fill="#031B38"/>
        <rect x="28" y="34" width="144" height="14" fill="#F3B329"/>
        <rect x="94" y="34" width="12" height="86" fill="#8EBFA7"/>
        <line x1="20" y1="106" x2="180" y2="106" stroke="rgba(238,225,199,0.45)" stroke-dasharray="3 3"/>
        <circle cx="100" cy="41" r="6" fill="#031B38"/>
      `,
    },
    "1851": {
      year: "1851 / 1955",
      title: "水平-垂直错觉与 T 形二等分效应",
      work: "Adolf Fick（1851 博士论文）与 Teodor M. Künnapas（1955，《实验心理学杂志》）",
      desc: "德国生理学家菲克最早记录了人眼高估竖线长度的错觉；一百年后，心理学家库纳帕斯通过对比倒 T 与 L 形实验拆出两个独立因子：一是竖向天然显长，二是 T 形交点把横线一分为二、进一步放大了竖轴的延伸感。",
      svg: `
        <rect x="14" y="14" width="172" height="122" rx="4" fill="#031B38"/>
        <line x1="40" y1="42" x2="160" y2="42" stroke="#F3B329" stroke-width="6"/>
        <line x1="100" y1="42" x2="100" y2="122" stroke="#8EBFA7" stroke-width="6"/>
        <circle cx="100" cy="42" r="5" fill="#EEE1C7"/>
        <text x="100" y="32" text-anchor="middle" fill="#F3B329" font-size="10" font-family="JetBrains Mono">L = 100%</text>
        <text x="136" y="88" text-anchor="middle" fill="#A5D6BE" font-size="10" font-family="JetBrains Mono">感知更长</text>
      `,
    },
    "1954": {
      year: "1954 / 1973",
      title: "视知觉的「水平-垂直骨架」与重力法则",
      work: "Rudolf Arnheim《艺术与视知觉》（1954/1974，加州大学出版社）· Donis A. Dondis《视觉素养入门》（1973，MIT Press）",
      desc: "阿恩海姆与唐迪斯从格式塔心理学出发指出：人眼进入任何矩形画面，都会自动寻找隐藏的水平基准与垂直重力轴。贴合这两条主轴的 T 形结构，无需解释就能瞬间传达稳定与秩序，但也需留心上方体量带来的视觉重力。",
      svg: `
        <rect x="14" y="14" width="172" height="122" rx="4" fill="#031B38"/>
        <line x1="100" y1="20" x2="100" y2="130" stroke="rgba(142,191,167,0.4)" stroke-dasharray="3 3"/>
        <line x1="20" y1="75" x2="180" y2="75" stroke="rgba(142,191,167,0.4)" stroke-dasharray="3 3"/>
        <rect x="36" y="30" width="128" height="24" fill="#F3B329"/>
        <rect x="88" y="54" width="24" height="58" fill="#8EBFA7"/>
        <path d="M100 116 L94 106 H106 Z" fill="#EEE1C7"/>
      `,
    },
    "1981": {
      year: "1981",
      title: "瑞士网格系统把通栏页眉与中轴标准工业化",
      work: "Josef Müller-Brockmann《平面设计中的网格系统》（Niggli Verlag，1981）",
      desc: "瑞士国际主义排版把海报、年鉴和展览墙拆解成精确的通栏横带与纵向栏格。上方满幅标题栏先定调，下方沿网格纵轴展开图文层级，使 T 形结构从绘画经验变成可复用的现代出版与展示骨架。",
      svg: `
        <rect x="14" y="14" width="172" height="122" rx="4" fill="#031B38"/>
        <g stroke="rgba(142,191,167,0.22)" stroke-width="1">
          <line x1="57" y1="14" x2="57" y2="136"/><line x1="100" y1="14" x2="100" y2="136"/><line x1="143" y1="14" x2="143" y2="136"/>
          <line x1="14" y1="54" x2="186" y2="54"/><line x1="14" y1="95" x2="186" y2="95"/>
        </g>
        <rect x="24" y="22" width="152" height="26" fill="#F3B329"/>
        <rect x="64" y="58" width="72" height="66" fill="#8EBFA7" opacity="0.85"/>
      `,
    },
    "2006": {
      year: "2006 / 2019",
      title: "数字屏幕眼动研究印证「顶横扫 + 纵速览」",
      work: "Jakob Nielsen（2006）与 Kara Pernice（2019），Nielsen Norman Group 眼动研究",
      desc: "网页与演示文稿的眼动实验表明，读者习惯先横向扫视顶部大标题与导航带，再沿纵向主轴快速下移寻找关键结论或操作按钮。T 形构图因此成为落地页首屏、演讲封面与核心数据看板的高频骨架。",
      svg: `
        <rect x="14" y="14" width="172" height="122" rx="4" fill="#031B38"/>
        <rect x="24" y="24" width="152" height="22" rx="3" fill="#F3B329"/>
        <rect x="62" y="54" width="76" height="46" rx="3" fill="#8EBFA7"/>
        <rect x="70" y="108" width="60" height="18" rx="9" fill="#F3B329"/>
        <circle cx="44" cy="35" r="4" fill="#031B38"/>
        <circle cx="100" cy="35" r="4" fill="#031B38"/>
        <circle cx="100" cy="76" r="4" fill="#031B38"/>
      `,
    },
  };

  const btns = document.querySelectorAll("[data-era-btn]");
  const yearEl = document.getElementById("eraYear");
  const titleEl = document.getElementById("eraTitle");
  const workEl = document.getElementById("eraWork");
  const descEl = document.getElementById("eraDesc");
  const svgEl = document.getElementById("eraSvg");

  function selectEra(key) {
    const e = eras[key];
    if (!e) return;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.eraBtn === key)));
    if (yearEl) yearEl.textContent = e.year;
    if (titleEl) titleEl.textContent = e.title;
    if (workEl) workEl.textContent = e.work;
    if (descEl) descEl.textContent = e.desc;
    if (svgEl) svgEl.innerHTML = e.svg;
  }

  btns.forEach((b) => b.addEventListener("click", () => selectEra(b.dataset.eraBtn)));
  selectEra("1457");
}

// ---------- 05 什么时候别用 T 形（场景翻牌对照） ----------
function initSection05() {
  const cases = {
    pricing: {
      label: "多档方案横评",
      badTitle: "硬套 T 形：强迫三选一变成单纵队",
      badDesc: "把基础版、专业版、企业版强塞进 T 形的单条中轴，或者把两档挤在狭小双翼里，读者无法横向逐行对比价格与权益。",
      goodTitle: "改用等宽三栏网格：平等并列一目了然",
      goodDesc: "取消中央单垂轴，三张卡片等宽等高排开，只在推荐档加一枚细顶条或高对比按钮，横向扫描无障碍。",
      badSvg: `
        <rect x="20" y="16" width="200" height="30" fill="#C44536"/>
        <rect x="92" y="48" width="56" height="96" fill="#9BB5AA"/>
        <rect x="22" y="64" width="60" height="58" fill="#D5CEC0" stroke="#C44536" stroke-dasharray="3 3"/>
        <rect x="158" y="64" width="60" height="58" fill="#D5CEC0" stroke="#C44536" stroke-dasharray="3 3"/>
        <text x="120" y="162" text-anchor="middle" fill="#AD2820" font-size="11" font-family="Noto Sans SC">三档体量失衡，难横比</text>
      `,
      goodSvg: `
        <rect x="20" y="24" width="60" height="116" rx="5" fill="#E6EFEA" stroke="#215945"/>
        <rect x="90" y="18" width="60" height="122" rx="5" fill="#031B38"/>
        <rect x="90" y="18" width="60" height="10" rx="2" fill="#F3B329"/>
        <rect x="160" y="24" width="60" height="116" rx="5" fill="#E6EFEA" stroke="#215945"/>
        <text x="120" y="162" text-anchor="middle" fill="#1B6B4D" font-size="11" font-family="Noto Sans SC">三栏等高平权，逐行可比</text>
      `,
    },
    sport: {
      label: "极限冲刺海报",
      badTitle: "硬套 T 形：90° 横竖把速度锁死了",
      badDesc: "田径冲刺、电音节、极限滑板需要打破重力的倾斜势能。正交 T 形太像正式公文或建筑蓝图，冲刺感瞬间哑火。",
      goodTitle: "改用斜向交叉（031 X 形或对角线）",
      goodDesc: "撤销平直横梁，用 45°–60° 斜切对角轴制造强烈动势与碰撞张力，把画面的能量彻底释放出来。",
      badSvg: `
        <rect x="20" y="20" width="200" height="34" fill="#C44536"/>
        <rect x="98" y="54" width="44" height="84" fill="#9BB5AA"/>
        <text x="120" y="162" text-anchor="middle" fill="#AD2820" font-size="11" font-family="Noto Sans SC">端庄静止，缺少冲刺势能</text>
      `,
      goodSvg: `
        <polygon points="20,24 108,82 20,140" fill="#F3B329"/>
        <polygon points="220,24 132,82 220,140" fill="#F3B329"/>
        <line x1="24" y1="24" x2="216" y2="140" stroke="#031B38" stroke-width="2.5" stroke-dasharray="5 4"/>
        <line x1="216" y1="24" x2="24" y2="140" stroke="#031B38" stroke-width="2.5" stroke-dasharray="5 4"/>
        <circle cx="120" cy="82" r="14" fill="#031B38"/>
        <text x="120" y="162" text-anchor="middle" fill="#1B6B4D" font-size="11" font-family="Noto Sans SC">斜轴交锋，张力扑面而来</text>
      `,
    },
    narrow: {
      label: "窄屏长文连读",
      badTitle: "硬套 T 形：双翼一留白，正文挤成细面条",
      badDesc: "在 390px 宽的手机屏上硬保宽顶梁配窄中轴，正文每行只能塞下七八个汉字，读者每秒都在折行，阅读疲劳飙升。",
      goodTitle: "改用满宽单列流：把宽度全还给文字",
      goodDesc: "在极窄视口中保留顶部视觉带，但下方正文放开至 90%–92% 栏宽，保证每行 16–22 字的舒适阅读节奏。",
      badSvg: `
        <rect x="64" y="14" width="112" height="134" rx="10" fill="#FAF7F0" stroke="#031B38" stroke-width="2"/>
        <rect x="72" y="24" width="96" height="24" fill="#C44536"/>
        <rect x="104" y="54" width="32" height="84" fill="#9BB5AA"/>
        <text x="120" y="164" text-anchor="middle" fill="#AD2820" font-size="11" font-family="Noto Sans SC">正文柱太窄，频繁折行</text>
      `,
      goodSvg: `
        <rect x="64" y="14" width="112" height="134" rx="10" fill="#FAF7F0" stroke="#031B38" stroke-width="2"/>
        <rect x="72" y="24" width="96" height="24" fill="#F3B329"/>
        <rect x="74" y="56" width="92" height="10" rx="2" fill="#215945"/>
        <rect x="74" y="74" width="92" height="10" rx="2" fill="#8EBFA7"/>
        <rect x="74" y="92" width="92" height="10" rx="2" fill="#8EBFA7"/>
        <rect x="74" y="110" width="70" height="10" rx="2" fill="#8EBFA7"/>
        <text x="120" y="164" text-anchor="middle" fill="#1B6B4D" font-size="11" font-family="Noto Sans SC">满栏单列流，字距舒展</text>
      `,
    },
    duel: {
      label: "双主角对等叙事",
      badTitle: "硬套 T 形：一条中轴装不下两位平等主角",
      badDesc: "双人辩论海报或新旧产品同台 PK，若把一位放顶梁、一位放底落点，观者会本能读出上下级隶属关系。",
      goodTitle: "改用左右对分屏：旗鼓相当、正面交锋",
      goodDesc: "用中线左右分庭抗礼，两侧面积、字号与色量对等，视觉上立刻读出「双方平起平坐」。",
      badSvg: `
        <rect x="24" y="18" width="192" height="36" fill="#C44536"/>
        <rect x="98" y="54" width="44" height="58" fill="#9BB5AA"/>
        <rect x="74" y="114" width="92" height="26" rx="6" fill="#D5CEC0" stroke="#C44536"/>
        <text x="120" y="162" text-anchor="middle" fill="#AD2820" font-size="11" font-family="Noto Sans SC">被误读成主从上下级</text>
      `,
      goodSvg: `
        <rect x="20" y="20" width="96" height="122" rx="4" fill="#031B38"/>
        <rect x="124" y="20" width="96" height="122" rx="4" fill="#F3B329"/>
        <circle cx="68" cy="80" r="22" fill="#8EBFA7"/>
        <circle cx="172" cy="80" r="22" fill="#031B38"/>
        <text x="120" y="162" text-anchor="middle" fill="#1B6B4D" font-size="11" font-family="Noto Sans SC">左右平权分庭，清晰对决</text>
      `,
    },
  };

  let curCase = "pricing";
  let showGood = false;

  const caseBtns = document.querySelectorAll("[data-anti-case]");
  const flipBtns = document.querySelectorAll("[data-anti-flip]");
  const titleEl = document.getElementById("antiTitle");
  const descEl = document.getElementById("antiDesc");
  const svgEl = document.getElementById("antiSvg");
  const cardEl = document.getElementById("antiCard");

  function render() {
    const c = cases[curCase];
    caseBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.antiCase === curCase)));
    flipBtns.forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.antiFlip === "good") === showGood)));
    if (cardEl) cardEl.dataset.mode = showGood ? "good" : "bad";
    if (titleEl) titleEl.textContent = showGood ? c.goodTitle : c.badTitle;
    if (descEl) descEl.textContent = showGood ? c.goodDesc : c.badDesc;
    if (svgEl) svgEl.innerHTML = showGood ? c.goodSvg : c.badSvg;
  }

  caseBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curCase = b.dataset.antiCase;
      showGood = false;
      render();
    })
  );
  flipBtns.forEach((b) =>
    b.addEventListener("click", () => {
      showGood = b.dataset.antiFlip === "good";
      render();
    })
  );
  render();
}

// ---------- 06 小练习（四选一单一变量视觉判别题） ----------
function initSection06() {
  const answers = {
    A: {
      ok: false,
      verdict: "方案 A 未站住：垂直轴线贯通了，但底部「预约入场」偏到右下角。",
      detail: "视线沿中央绿轴一路直坠到底，正下方却是空白，读者必须折返去角落找主按钮，T 形的「轴线引导 → 稳定聚焦」在最后一厘米脱靶了。",
    },
    B: {
      ok: true,
      verdict: "答对了！方案 B 才是完整立住的 T 形构图。",
      detail: "顶部 86% 宽金梁稳稳兜住年展大标，中央垂轴无断层承载三段展期信息，轴尖直指居中金黄「预约入场」胶囊，横扫—下沉—落点一气呵成。",
    },
    C: {
      ok: false,
      verdict: "方案 C 未站住：垂轴滑贴最左边缘 14%，已经退化成 L 形构图。",
      detail: "顶部横梁右翼悬挑过长、左侧毫无悬臂，视觉重心整体倾倒在左边。如果需要贴边围合出大块开放角区，那是 033 L 形构图的专长。",
    },
    D: {
      ok: false,
      verdict: "方案 D 未站住：中段被赞助商横条拦腰截断 26%，视觉流提前熄火。",
      detail: "原本顺滑的垂直导流轴在半途被横向干扰带切断，眼睛被横向扯走，很难一口气把注意力送达底部的「预约入场」主按钮。",
    },
  };

  const cards = document.querySelectorAll("[data-quiz-opt]");
  const feedback = document.getElementById("quizFeedback");
  const verdictEl = document.getElementById("quizVerdict");
  const detailEl = document.getElementById("quizDetail");
  const resetBtn = document.getElementById("quizReset");

  function choose(opt) {
    const a = answers[opt];
    if (!a) return;
    cards.forEach((c) => {
      const k = c.dataset.quizOpt;
      c.setAttribute("aria-pressed", String(k === opt));
      c.dataset.result = k === "B" ? "correct" : k === opt ? "wrong" : "dim";
    });
    if (feedback) {
      feedback.hidden = false;
      feedback.dataset.ok = a.ok ? "1" : "0";
    }
    if (verdictEl) verdictEl.textContent = a.verdict;
    if (detailEl) detailEl.textContent = a.detail;
  }

  cards.forEach((c) => c.addEventListener("click", () => choose(c.dataset.quizOpt)));
  resetBtn?.addEventListener("click", () => {
    cards.forEach((c) => {
      c.setAttribute("aria-pressed", "false");
      delete c.dataset.result;
    });
    if (feedback) feedback.hidden = true;
  });
}

// ---------- 07 原海报灯箱（放大、拖拽、Esc 关闭） ----------
function initPosterLightbox() {
  const trigger = document.getElementById("posterOpenBtn");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("posterModal");
  const modalImg = document.getElementById("posterModalImg");
  const closeBtn = document.getElementById("posterCloseBtn");
  const zoomOutBtn = document.getElementById("posterZoomOut");
  const zoomResetBtn = document.getElementById("posterZoomReset");
  const zoomInBtn = document.getElementById("posterZoomIn");
  const stage = document.getElementById("posterModalStage");

  if (!trigger || !modal || !modalImg || !posterImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let bx = 0;
  let by = 0;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    // 复用页面已内联的 poster.webp，不重复打包图片
    if (!modalImg.src) modalImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal || ev.target === stage) closeModal();
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.hidden) {
      ev.preventDefault();
      closeModal();
    }
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(2.6, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (ev) => {
      if (modal.hidden) return;
      ev.preventDefault();
      const delta = ev.deltaY < 0 ? 0.16 : -0.16;
      scale = Math.max(0.8, Math.min(2.6, +(scale + delta).toFixed(2)));
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  modalImg.addEventListener("pointerdown", (ev) => {
    dragging = true;
    sx = ev.clientX;
    sy = ev.clientY;
    bx = tx;
    by = ty;
    try {
      modalImg.setPointerCapture(ev.pointerId);
    } catch {}
  });
  modalImg.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    tx = bx + (ev.clientX - sx);
    ty = by + (ev.clientY - sy);
    applyTransform();
  });
  const endDrag = () => {
    dragging = false;
  };
  modalImg.addEventListener("pointerup", endDrag);
  modalImg.addEventListener("pointercancel", endDrag);
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initPosterLightbox();
}
