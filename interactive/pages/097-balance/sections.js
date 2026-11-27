// 097 平衡 BALANCE · 正文 7 节各具特色的独立交互模块 + 原海报全屏拖拽灯箱
// 严格遵循：相邻两节不用同一种控件做同一件事；所有读数有「为什么」解释；画人不画五官。

export function initSections() {
  initSection01Compare();
  initSection02WeightPan();
  initSection03OpticalCenter();
  initSection04Timeline();
  initSection05WhenToBreak();
  initSection06Quiz();
  initSection07Lightbox();
}

// =========================================================
// 01 平衡不是左右一样：三态结构切牌 + 骨架叠加开关
// =========================================================
function initSection01Compare() {
  const modes = {
    symmetry: {
      title: "轴对称平衡",
      en: "SYMMETRICAL BALANCE",
      verdict: "左右严格镜像对应，中轴像一根定海神针",
      body: "左右元素的大小、形状与距轴距离完全一致，大脑几乎不费力就能确认「稳了」。因此它常被用在纪念碑、官方公文、奢品包装与古典书封——代价是视线容易停在正中，动态变化少。",
      when: "需要传递权威、静穆、礼仪感，或信息本身呈天然对仗时使用。",
      svg: `
        <svg viewBox="0 0 360 250" class="s01-svg" aria-label="轴对称平衡示意图">
          <rect x="8" y="8" width="344" height="234" fill="#FAF0DE" stroke="#D6C9B3" stroke-width="1.5"/>
          <g class="s01-skeleton">
            <line x1="180" y1="8" x2="180" y2="242" stroke="#CE4A22" stroke-width="1.5" stroke-dasharray="5 4"/>
            <line x1="76" y1="125" x2="180" y2="125" stroke="#524B42" stroke-width="1.2" stroke-dasharray="3 3"/>
            <line x1="180" y1="125" x2="284" y2="125" stroke="#524B42" stroke-width="1.2" stroke-dasharray="3 3"/>
            <text x="128" y="116" text-anchor="middle" font-size="11" fill="#A33311" font-family="JetBrains Mono, monospace">r = 1.0</text>
            <text x="232" y="116" text-anchor="middle" font-size="11" fill="#A33311" font-family="JetBrains Mono, monospace">r = 1.0</text>
          </g>
          <rect x="52" y="80" width="54" height="90" fill="#1C1C1C"/>
          <rect x="254" y="80" width="54" height="90" fill="#1C1C1C"/>
          <circle cx="180" cy="116" r="34" fill="#CE4A22"/>
          <rect x="132" y="176" width="96" height="8" fill="#1C1C1C"/>
          <rect x="150" y="192" width="60" height="5" fill="#524B42"/>
        </svg>`,
    },
    asymmetry: {
      title: "非对称动态均衡",
      en: "ASYMMETRICAL EQUILIBRIUM",
      verdict: "形状大小各不相同，却靠「重量 × 力臂」暗暗扯平",
      body: "这正是 097 原海报所画的结构：左侧用偏小但靠外的双元素拉长力臂，右侧用体量更大但靠近中轴的单一深块压秤，中间由朱砂圆承接视线。观者眼球在左右差异中不断流转，稳重而不呆板。",
      when: "绝大多数现代海报、杂志跨页、网页首屏与信息排版的首选平衡方式。",
      svg: `
        <svg viewBox="0 0 360 250" class="s01-svg" aria-label="非对称动态均衡示意图">
          <rect x="8" y="8" width="344" height="234" fill="#FAF0DE" stroke="#D6C9B3" stroke-width="1.5"/>
          <g class="s01-skeleton">
            <line x1="180" y1="8" x2="180" y2="242" stroke="#CE4A22" stroke-width="1.5" stroke-dasharray="5 4"/>
            <line x1="62" y1="168" x2="180" y2="168" stroke="#524B42" stroke-width="1.3"/>
            <line x1="180" y1="168" x2="264" y2="168" stroke="#524B42" stroke-width="1.3"/>
            <circle cx="180" cy="168" r="4" fill="#CE4A22"/>
            <text x="115" y="187" text-anchor="middle" font-size="11" fill="#A33311" font-family="JetBrains Mono, monospace">轻 × 长臂</text>
            <text x="226" y="187" text-anchor="middle" font-size="11" fill="#A33311" font-family="JetBrains Mono, monospace">重 × 短臂</text>
          </g>
          <rect x="44" y="108" width="38" height="44" fill="#1C1C1C"/>
          <circle cx="104" cy="136" r="14" fill="#1C1C1C"/>
          <circle cx="180" cy="112" r="42" fill="#CE4A22"/>
          <rect x="234" y="92" width="66" height="60" fill="#1C1C1C"/>
          <rect x="40" y="152" width="280" height="7" fill="#1C1C1C"/>
        </svg>`,
    },
    radial: {
      title: "放射中心平衡",
      en: "RADIAL BALANCE",
      verdict: "所有方向朝同一个圆心收拢，视线一进画就被吸住",
      body: "元素围绕中心点呈同心或放射状均匀展开，上下左右四面力矩同时归零。它既有极强的聚焦力，又自带向心旋转的节奏，常见于徽章、钟表表盘、展馆导视盘与主题主视觉。",
      when: "只有一个不容分心的核心主角、需要强烈仪式感或聚焦凝视时采用。",
      svg: `
        <svg viewBox="0 0 360 250" class="s01-svg" aria-label="放射中心平衡示意图">
          <rect x="8" y="8" width="344" height="234" fill="#FAF0DE" stroke="#D6C9B3" stroke-width="1.5"/>
          <g class="s01-skeleton">
            <line x1="180" y1="16" x2="180" y2="234" stroke="#B8AB96" stroke-width="1.2" stroke-dasharray="4 4"/>
            <line x1="68" y1="125" x2="292" y2="125" stroke="#B8AB96" stroke-width="1.2" stroke-dasharray="4 4"/>
            <line x1="102" y1="47" x2="258" y2="203" stroke="#B8AB96" stroke-width="1" stroke-dasharray="3 4"/>
            <line x1="258" y1="47" x2="102" y2="203" stroke="#B8AB96" stroke-width="1" stroke-dasharray="3 4"/>
          </g>
          <circle cx="180" cy="125" r="88" fill="none" stroke="#1C1C1C" stroke-width="1.5" stroke-dasharray="5 5"/>
          <circle cx="180" cy="125" r="60" fill="none" stroke="#1C1C1C" stroke-width="1.5"/>
          <circle cx="180" cy="125" r="28" fill="#CE4A22"/>
          <circle cx="180" cy="37" r="7" fill="#1C1C1C"/>
          <circle cx="180" cy="213" r="7" fill="#1C1C1C"/>
          <circle cx="92" cy="125" r="7" fill="#1C1C1C"/>
          <circle cx="268" cy="125" r="7" fill="#1C1C1C"/>
        </svg>`,
    },
  };

  let cur = "asymmetry";
  let showSkeleton = true;
  const stage = document.getElementById("s01-stage");
  const titleEl = document.getElementById("s01-title");
  const enEl = document.getElementById("s01-en");
  const verdictEl = document.getElementById("s01-verdict");
  const bodyEl = document.getElementById("s01-body");
  const whenEl = document.getElementById("s01-when");
  const btns = [...document.querySelectorAll("[data-s01-mode]")];
  const toggleBtn = document.getElementById("s01-skeleton-btn");
  if (!stage) return;

  function render() {
    const m = modes[cur];
    stage.innerHTML = m.svg;
    stage.classList.toggle("hide-skeleton", !showSkeleton);
    titleEl.textContent = m.title;
    enEl.textContent = m.en;
    verdictEl.textContent = m.verdict;
    bodyEl.textContent = m.body;
    whenEl.textContent = m.when;
    btns.forEach((b) => {
      const active = b.dataset.s01Mode === cur;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    toggleBtn.textContent = showSkeleton ? "力学骨架：开" : "力学骨架：关";
    toggleBtn.setAttribute("aria-pressed", String(showSkeleton));
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      cur = b.dataset.s01Mode;
      render();
    })
  );
  toggleBtn.addEventListener("click", () => {
    showSkeleton = !showSkeleton;
    render();
  });
  render();
}

// =========================================================
// 02 视觉重量从哪来：双皿天平视觉筹码配对实验
// =========================================================
function initSection02WeightPan() {
  const chips = {
    darkSmall: {
      name: "小号纯黑方",
      factor: "明度反差",
      areaRatio: "面积仅为左块 52%",
      tilt: 0.4,
      result: "基本配平（示意）",
      why: "虽然面积几乎只有左侧大浅灰块的一半，但墨黑与暖宣纸之间形成极强明度反差，直接补齐了面积差——在版面里，一小块深色标题就能压住大段浅灰正文。",
      drawRight: `<rect x="242" y="96" width="46" height="46" fill="#1C1C1C"/>`,
    },
    redMini: {
      name: "迷你朱砂圆",
      factor: "色相与饱和度",
      areaRatio: "面积仅为左块 38%",
      tilt: 1.0,
      result: "稳稳抵住（示意）",
      why: "Paul Locher 等人（2005）对蒙德里安色块的研究显示，红等高饱和暖色在相同面积下比中性灰更具视觉重量。一颗迷你朱砂圆就能牢牢钩住视线，和左盘大灰块分庭抗礼。",
      drawRight: `<circle cx="265" cy="118" r="22" fill="#CE4A22"/>`,
    },
    hollowBig: {
      name: "等大细线空框",
      factor: "实心 vs 空心",
      areaRatio: "外框与左块 100% 等大",
      tilt: -11.5,
      result: "右盘翘起 · 压不住（示意）",
      why: "哪怕外轮廓和左侧一般大，但内部完全透出纸底色，视觉质量瞬间塌空。这提醒排版者：空心线框按钮或细线卡片永远比实心填充块轻得多，不能按外框宽高直接估算平衡。",
      drawRight: `<rect x="232" y="76" width="66" height="66" fill="none" stroke="#1C1C1C" stroke-width="2"/>`,
    },
    isolatedDot: {
      name: "孤立远端小黑点",
      factor: "孤立度 + 长力臂",
      areaRatio: "面积仅为左块 18%",
      tilt: -2.0,
      result: "接近配平（示意）",
      why: "阿恩海姆（1954）指出，孤零零待在大片留白里、又被推到远离支点外缘的小物件，会获得「孤立加权」与「力臂放大」双重收益——留白越多，孤点越有分量。",
      drawRight: `<circle cx="294" cy="126" r="14" fill="#1C1C1C"/>`,
    },
  };

  let cur = "hollowBig";
  const beamG = document.getElementById("s02-beam");
  const rightSlot = document.getElementById("s02-right-slot");
  const needle = document.getElementById("s02-needle");
  const badge = document.getElementById("s02-badge");
  const areaEl = document.getElementById("s02-area");
  const whyEl = document.getElementById("s02-why");
  const btns = [...document.querySelectorAll("[data-s02-chip]")];
  if (!beamG) return;

  function render() {
    const c = chips[cur];
    beamG.setAttribute("transform", `rotate(${c.tilt} 180 146)`);
    rightSlot.innerHTML = c.drawRight;
    needle.setAttribute("transform", `rotate(${c.tilt * 1.4} 180 146)`);
    badge.textContent = c.result;
    badge.classList.toggle("is-warn", Math.abs(c.tilt) > 3);
    areaEl.textContent = `${c.factor} · ${c.areaRatio}`;
    whyEl.textContent = c.why;
    btns.forEach((b) => {
      const active = b.dataset.s02Chip === cur;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      cur = b.dataset.s02Chip;
      render();
    })
  );
  render();
}

// =========================================================
// 03 重心略高于几何中点：纵向光学中心滑轨 + 阿恩海姆结构骨架
// =========================================================
function initSection03OpticalCenter() {
  const slider = document.getElementById("s03-slider");
  const orb = document.getElementById("s03-orb");
  const orbLine = document.getElementById("s03-orb-line");
  const pctEl = document.getElementById("s03-pct");
  const diffEl = document.getElementById("s03-diff");
  const titleEl = document.getElementById("s03-verdict");
  const bodyEl = document.getElementById("s03-body");
  const fieldEl = document.getElementById("s03-field");
  const skelBtn = document.getElementById("s03-skel-btn");
  const presets = [...document.querySelectorAll("[data-s03-y]")];
  if (!slider || !orb) return;

  let showField = true;

  function update(yPct) {
    const y = Math.max(18, Math.min(82, Number(yPct)));
    slider.value = String(y);
    // SVG viewBox 高度 320，顶部 20，底部 300 => 有效画框高 280
    const cy = 20 + (y / 100) * 280;
    orb.setAttribute("cy", cy.toFixed(1));
    orbLine.setAttribute("y1", cy.toFixed(1));
    orbLine.setAttribute("y2", cy.toFixed(1));

    const delta = 50 - y;
    pctEl.textContent = `距顶 ${y}%`;
    diffEl.textContent =
      delta === 0
        ? "正落几何中点 50%"
        : delta > 0
          ? `高于几何中点 +${delta}%`
          : `低于几何中点 ${delta}%`;

    let verdict = "";
    let body = "";
    if (y >= 44 && y <= 47) {
      verdict = "落在经验光学中心：看着最像「正中间」";
      body =
        "平面排版里常说的视觉中心（经验值约距顶 45%–47%）略高于几何 50%。上方稍紧、下方多留一点托底空间，正好抵消大脑对重力的默认预期，看起来端正而不下坠。";
    } else if (y > 47 && y <= 53) {
      verdict = "几何正中 50%：实际观感反而微微发沉";
      body =
        "用尺子量它一分不差，但人眼习惯了现实世界里物体往下坠的重力感，把单块重心死放在 50% 时，下半截往往显薄、圆点像在悄悄往下滑。";
    } else if (y < 44 && y >= 32) {
      verdict = "偏高上提：画面轻盈，有呼吸与上升感";
      body =
        "重心提至画幅上三分之一附近时，下方腾出充裕留白承托主体，适合海报主图加底部多行说明文字的经典「上主下辅」版式。";
    } else if (y < 32) {
      verdict = "顶重悬坠：重心顶死上缘，显得头重脚轻";
      body =
        "主体挤近顶边，上方边界产生强烈挤压感，底部大片深空失去呼应，观者会隐隐担心这块重量随时要砸下来。";
    } else {
      verdict = "重心压底：沉稳厚重，或易显得滞重";
      body =
        "把重物压在下半幅能制造如建筑地基般的厚重感；但如果上方没有任何标题或图形呼应，上半幅就会空洞塌陷。";
    }
    titleEl.textContent = verdict;
    bodyEl.textContent = body;

    presets.forEach((b) => {
      const active = Math.abs(Number(b.dataset.s03Y) - y) <= 1;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  slider.addEventListener("input", () => update(slider.value));
  presets.forEach((b) => b.addEventListener("click", () => update(b.dataset.s03Y)));
  skelBtn.addEventListener("click", () => {
    showField = !showField;
    fieldEl.style.opacity = showField ? "1" : "0.08";
    skelBtn.textContent = showField ? "结构骨架引力线：开" : "结构骨架引力线：关";
    skelBtn.setAttribute("aria-pressed", String(showField));
  });

  // 也支持在暗室竖幅 SVG 上直接上下拖圆！
  const svg = document.getElementById("s03-svg");
  let dragging = false;
  const setFromClientY = (clientY) => {
    const r = svg.getBoundingClientRect();
    const rel = (clientY - r.top) / r.height;
    // 画框在 viewBox 里占 [20/320, 300/320]
    const pct = Math.round(((rel - 20 / 320) / (280 / 320)) * 100);
    update(pct);
  };
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    setFromClientY(e.clientY);
  });
  svg.addEventListener("pointermove", (e) => {
    if (dragging) setFromClientY(e.clientY);
  });
  svg.addEventListener("pointerup", () => { dragging = false; });
  svg.addEventListener("pointercancel", () => { dragging = false; });

  update(50); // 开场故意先停在几何 50%，让用户亲手往上提 3–4% 感受变化！
}

// =========================================================
// 04 这套理论从哪来：年代轴文献卡片翻阅
// =========================================================
function initSection04Timeline() {
  const eras = [
    {
      year: "1907",
      who: "Denman Waldo Ross",
      work: "《A Theory of Pure Design》",
      place: "波士顿 · Houghton, Mifflin & Co.",
      headline: "首次把「平衡」立为纯粹设计三大支柱之一",
      text: "哈佛大学讲师罗斯在这部奠基著作里，将视觉秩序拆成和谐、平衡与节奏三根柱子，并明确区分了左右镜像的「对称平衡」与不依赖镜像、靠视觉吸引力相互抵消的「隐性平衡（occult balance）」。",
      diagram: `
        <svg viewBox="0 0 220 130" aria-hidden="true">
          <rect x="10" y="10" width="200" height="110" fill="#FAF0DE" stroke="#D6C9B3"/>
          <line x1="110" y1="16" x2="110" y2="114" stroke="#B8AB96" stroke-dasharray="4 3"/>
          <circle cx="54" cy="65" r="18" fill="#1C1C1C"/>
          <circle cx="152" cy="54" r="10" fill="#CE4A22"/>
          <circle cx="176" cy="78" r="10" fill="#1C1C1C"/>
        </svg>`,
    },
    {
      year: "1928",
      who: "Jan Tschichold",
      work: "《Die neue Typographie》",
      place: "柏林 · Bildungsverband der Deutschen Buchdrucker",
      headline: "用非对称动态平衡打破百年居中排版惯性",
      text: "契肖尔德把包豪斯与构成主义带入日常印刷，提出排版不应为了机械对称把文字硬塞进居中盒子，而要按内容主次配置字号、黑度与留白，让「光学重量」而非尺子居中决定平衡。",
      diagram: `
        <svg viewBox="0 0 220 130" aria-hidden="true">
          <rect x="10" y="10" width="200" height="110" fill="#FAF0DE" stroke="#D6C9B3"/>
          <rect x="24" y="24" width="120" height="16" fill="#1C1C1C"/>
          <rect x="24" y="48" width="84" height="6" fill="#CE4A22"/>
          <rect x="128" y="68" width="68" height="36" fill="#1C1C1C"/>
          <rect x="24" y="92" width="86" height="4" fill="#524B42"/>
          <rect x="24" y="100" width="64" height="4" fill="#524B42"/>
        </svg>`,
    },
    {
      year: "1937–42",
      who: "Piet Mondrian",
      work: "《Composition in Red, Blue, and Yellow》",
      place: "MoMA 纽约现代艺术博物馆藏（638.1967）",
      headline: "以黑线与三原色块实践「动态平衡」",
      text: "蒙德里安反对呆板的静态对称，在成熟期网格画作中仅用水平垂直黑线与不等大小的三原色块反复推敲张力——让小块饱和红与大片留白白格达成充满生命力的动态平衡。",
      diagram: `
        <svg viewBox="0 0 220 130" aria-hidden="true">
          <rect x="10" y="10" width="200" height="110" fill="#FDF7EC" stroke="#1C1C1C" stroke-width="2"/>
          <rect x="136" y="10" width="74" height="66" fill="#CE4A22"/>
          <rect x="10" y="76" width="52" height="44" fill="#1C1C1C"/>
          <line x1="136" y1="10" x2="136" y2="120" stroke="#1C1C1C" stroke-width="4"/>
          <line x1="62" y1="76" x2="62" y2="120" stroke="#1C1C1C" stroke-width="4"/>
          <line x1="10" y1="76" x2="210" y2="76" stroke="#1C1C1C" stroke-width="4"/>
        </svg>`,
    },
    {
      year: "1954 / 1974",
      who: "Rudolf Arnheim",
      work: "《Art and Visual Perception》第 1 章",
      place: "加州大学出版社（UC Press）",
      headline: "用格式塔心理学写透画框的「结构骨架」",
      text: "阿恩海姆把「平衡」放在全书第一章，用白方框里的一颗黑圆实验说明：画框绝不是无生命的容器，它的中心、轴线、对角线与四边都在对元素施加看不见的拉扯力；面积、位置、色差、孤立度与主题含义共同决定视觉重量。",
      diagram: `
        <svg viewBox="0 0 220 130" aria-hidden="true">
          <rect x="52" y="12" width="116" height="106" fill="#FAF0DE" stroke="#1C1C1C" stroke-width="1.5"/>
          <line x1="52" y1="12" x2="168" y2="118" stroke="#B8AB96" stroke-dasharray="3 3"/>
          <line x1="168" y1="12" x2="52" y2="118" stroke="#B8AB96" stroke-dasharray="3 3"/>
          <line x1="110" y1="12" x2="110" y2="118" stroke="#B8AB96" stroke-dasharray="3 3"/>
          <line x1="52" y1="65" x2="168" y2="65" stroke="#B8AB96" stroke-dasharray="3 3"/>
          <circle cx="122" cy="56" r="13" fill="#CE4A22"/>
        </svg>`,
    },
    {
      year: "1985–2011",
      who: "I. C. McManus & P. Locher 等",
      work: "《British Journal of Psychology》/《Perception》/《i-Perception》",
      place: "实证美学校准 · PMC3485801",
      headline: "温和校准：杠杆公式是好起点，但不是死定律",
      text: "McManus 等人（1985）让受试者在画作下移动物理支点找平衡；Locher 等人（2005）证实红黄蓝色块重量不等；而 McManus 团队（2011）的大样本实验也诚实指出：纯物理质心并不能机械预测每张杰作的好坏——目光方向、叙事重点与创作意图同样在拨动天平。",
      diagram: `
        <svg viewBox="0 0 220 130" aria-hidden="true">
          <rect x="10" y="10" width="200" height="110" fill="#FAF0DE" stroke="#D6C9B3"/>
          <line x1="28" y1="84" x2="192" y2="84" stroke="#1C1C1C" stroke-width="4"/>
          <polygon points="110,86 98,108 122,108" fill="#1C1C1C"/>
          <circle cx="110" cy="54" r="24" fill="#CE4A22"/>
          <rect x="40" y="64" width="20" height="18" fill="#1C1C1C"/>
          <rect x="150" y="54" width="30" height="28" fill="#1C1C1C"/>
        </svg>`,
    },
  ];

  let idx = 0;
  const tabs = [...document.querySelectorAll("[data-s04-idx]")];
  const yearEl = document.getElementById("s04-year");
  const whoEl = document.getElementById("s04-who");
  const workEl = document.getElementById("s04-work");
  const placeEl = document.getElementById("s04-place");
  const headEl = document.getElementById("s04-head");
  const textEl = document.getElementById("s04-text");
  const figEl = document.getElementById("s04-fig");
  if (!yearEl) return;

  function render() {
    const e = eras[idx];
    yearEl.textContent = e.year;
    whoEl.textContent = e.who;
    workEl.textContent = e.work;
    placeEl.textContent = e.place;
    headEl.textContent = e.headline;
    textEl.textContent = e.text;
    figEl.innerHTML = e.diagram;
    tabs.forEach((t) => {
      const active = Number(t.dataset.s04Idx) === idx;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      idx = Number(t.dataset.s04Idx);
      render();
    })
  );
  render();
}

// =========================================================
// 05 什么时候该打破平衡：四类真实场景 + 稳衡/破衡 A/B 对照
// =========================================================
function initSection05WhenToBreak() {
  const cases = {
    report: {
      name: "机构年报与合同",
      recommend: "balanced",
      recLabel: "建议：严守平衡",
      balancedNote: "页面重心稳正、栏宽均衡，读者立刻感到可信、克制与专业，注意力全部留在数字与条款上。",
      brokenNote: "刻意歪斜或单侧压沉会破坏严肃文件的公信力，让读者下意识觉得排版草率、数据不稳。",
      svgBalanced: `
        <svg viewBox="0 0 260 180" aria-label="机构年报稳衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <rect x="26" y="24" width="208" height="10" fill="#1C1C1C"/>
          <rect x="26" y="42" width="120" height="5" fill="#CE4A22"/>
          <rect x="26" y="62" width="96" height="84" fill="#EFE4D0"/>
          <rect x="138" y="62" width="96" height="84" fill="#EFE4D0"/>
          <rect x="36" y="74" width="76" height="6" fill="#1C1C1C"/>
          <rect x="36" y="88" width="60" height="4" fill="#524B42"/>
          <rect x="148" y="74" width="76" height="6" fill="#1C1C1C"/>
          <rect x="148" y="88" width="64" height="4" fill="#524B42"/>
        </svg>`,
      svgBroken: `
        <svg viewBox="0 0 260 180" aria-label="机构年报失衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <g transform="rotate(7 130 90)">
            <rect x="128" y="18" width="114" height="18" fill="#1C1C1C"/>
            <rect x="136" y="44" width="106" height="96" fill="#CE4A22"/>
            <rect x="22" y="124" width="54" height="6" fill="#524B42"/>
          </g>
        </svg>`,
    },
    book: {
      name: "建筑与摄影画册",
      recommend: "balanced",
      recLabel: "建议：非对称动态平衡",
      balancedNote: "大面积静谧留白配偏置主图与克制朱砂题签，翻页时呼吸感足、久看不累，图片气场得以充分展开。",
      brokenNote: "如果图片和文字全部挤向同一边角、另一侧毫无呼应，整张跨页像没排完的半成品。",
      svgBalanced: `
        <svg viewBox="0 0 260 180" aria-label="建筑画册动态平衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <line x1="130" y1="6" x2="130" y2="174" stroke="#D6C9B3" stroke-dasharray="3 3"/>
          <rect x="24" y="34" width="92" height="112" fill="#1C1C1C"/>
          <circle cx="196" cy="64" r="18" fill="#CE4A22"/>
          <rect x="156" y="102" width="76" height="6" fill="#1C1C1C"/>
          <rect x="156" y="114" width="58" height="4" fill="#524B42"/>
          <rect x="156" y="124" width="66" height="4" fill="#524B42"/>
        </svg>`,
      svgBroken: `
        <svg viewBox="0 0 260 180" aria-label="建筑画册失衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <line x1="130" y1="6" x2="130" y2="174" stroke="#D6C9B3" stroke-dasharray="3 3"/>
          <rect x="14" y="18" width="102" height="126" fill="#1C1C1C"/>
          <circle cx="96" cy="146" r="14" fill="#CE4A22"/>
          <rect x="18" y="152" width="56" height="5" fill="#524B42"/>
        </svg>`,
    },
    sports: {
      name: "极限赛事与冲刺海报",
      recommend: "broken",
      recLabel: "可以：刻意打破平衡",
      balancedNote: "四平八稳居中摆好反而把速度感杀死了——看起来像颁奖合影，不像百米冲线。",
      brokenNote: "把重色斜切冲向右上角、留出左下方大片虚空，故意制造「快要冲出画框」的可控失衡，速度与张力瞬间爆发。",
      svgBalanced: `
        <svg viewBox="0 0 260 180" aria-label="极限赛事稳衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <rect x="64" y="42" width="132" height="68" fill="#1C1C1C"/>
          <circle cx="130" cy="76" r="18" fill="#CE4A22"/>
          <rect x="82" y="126" width="96" height="8" fill="#524B42"/>
        </svg>`,
      svgBroken: `
        <svg viewBox="0 0 260 180" aria-label="极限赛事可控破衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <polygon points="88,166 246,16 246,120 158,166" fill="#1C1C1C"/>
          <polygon points="154,28 236,28 214,66 132,66" fill="#CE4A22"/>
          <line x1="26" y1="150" x2="112" y2="64" stroke="#CE4A22" stroke-width="3"/>
          <rect x="24" y="26" width="64" height="6" fill="#1C1C1C"/>
        </svg>`,
    },
    thriller: {
      name: "悬疑电影与危急警示",
      recommend: "broken",
      recLabel: "可以：刻意打破平衡",
      balancedNote: "过于舒适、安稳的构图会消解悬念，让观众产生「一切尽在掌控」的安全错觉。",
      brokenNote: "把孤小剪影压在逼仄下角、上方压下巨大沉重暗影，故意打破舒适重力，让观者用身体直接感到不安与压迫。",
      svgBalanced: `
        <svg viewBox="0 0 260 180" aria-label="悬疑片稳衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <circle cx="130" cy="72" r="24" fill="#1C1C1C"/>
          <rect x="116" y="96" width="28" height="44" fill="#1C1C1C"/>
          <rect x="86" y="150" width="88" height="6" fill="#CE4A22"/>
        </svg>`,
      svgBroken: `
        <svg viewBox="0 0 260 180" aria-label="悬疑片可控破衡示范">
          <rect x="6" y="6" width="248" height="168" fill="#FDF7EC" stroke="#D6C9B3"/>
          <polygon points="6,6 254,6 254,116 6,62" fill="#1C1C1C"/>
          <circle cx="212" cy="136" r="7" fill="#CE4A22"/>
          <rect x="206" y="145" width="12" height="20" fill="#CE4A22"/>
          <rect x="22" y="148" width="52" height="4" fill="#524B42"/>
        </svg>`,
    },
  };

  let curCase = "sports";
  let mode = "broken";
  const caseBtns = [...document.querySelectorAll("[data-s05-case]")];
  const modeBtns = [...document.querySelectorAll("[data-s05-state]")];
  const fig = document.getElementById("s05-fig");
  const rec = document.getElementById("s05-rec");
  const note = document.getElementById("s05-note");
  if (!fig) return;

  function render() {
    const c = cases[curCase];
    fig.innerHTML = mode === "balanced" ? c.svgBalanced : c.svgBroken;
    rec.textContent = c.recLabel;
    rec.classList.toggle("is-break", c.recommend === "broken");
    note.textContent = mode === "balanced" ? c.balancedNote : c.brokenNote;

    caseBtns.forEach((b) => {
      const active = b.dataset.s05Case === curCase;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    modeBtns.forEach((b) => {
      const active = b.dataset.s05State === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  caseBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curCase = b.dataset.s05Case;
      mode = cases[curCase].recommend;
      render();
    })
  );
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.s05State;
      render();
    })
  );
  render();
}

// =========================================================
// 06 动眼挑出真正平衡的版面（4 选 1，中性标签，只差一个变量！）
// =========================================================
function initSection06Quiz() {
  const answers = {
    A: {
      ok: false,
      title: "选 A 容易左沉：右侧视觉重量与力臂双双不足",
      reason:
        "左侧深墨建筑立面体量大、反差极强；A 把右侧文字全做成极细浅灰且缩在紧贴中轴的位置，视觉重量乘以短力臂远远抵不住左侧，整张海报会向左下角塌陷。",
    },
    B: {
      ok: false,
      title: "选 B 反而右偏且互抢：等高黑块贴边反超左图",
      reason:
        "虽然两边都有重黑块，但 B 把右侧整块铺满高饱和黑底还死贴最右缘，力臂比左图更长、视觉重量反超左侧；同时左右两块黑墙各自抢戏，缺少主次与朱砂锚点呼应。",
    },
    C: {
      ok: true,
      title: "答对了！选 C 构成了经典非对称动态平衡",
      reason:
        "C 没有机械复制左边的黑块尺寸，而是借用高饱和朱砂色块的高视觉权重，配以略长于左图的右力臂和干净的四周呼吸边距：一举抵消左侧暗图分量，主次分明又左右呼应。",
    },
    D: {
      ok: false,
      title: "选 D 单侧超载：右半幅彻底空洞断联",
      reason:
        "把标题与展期全部塞回左侧暗图底部，所有墨量与信息都堆死在左半幅，右半张纸毫无呼应元素，视觉天平一头彻底着地。",
    },
  };

  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const fb = document.getElementById("s06-feedback");
  const fbTitle = document.getElementById("s06-fb-title");
  const fbBody = document.getElementById("s06-fb-body");
  const retryBtn = document.getElementById("s06-retry");
  if (!cards.length || !fb) return;

  function choose(opt) {
    const info = answers[opt];
    cards.forEach((c) => {
      const k = c.dataset.quizOpt;
      c.classList.remove("is-correct", "is-wrong", "is-reveal");
      if (k === opt) c.classList.add(info.ok ? "is-correct" : "is-wrong");
      else if (k === "C") c.classList.add("is-reveal");
      c.setAttribute("aria-pressed", String(k === opt));
    });
    fb.hidden = false;
    fb.classList.toggle("is-ok", info.ok);
    fbTitle.textContent = info.title;
    fbBody.textContent = info.reason;
  }

  cards.forEach((c) => c.addEventListener("click", () => choose(c.dataset.quizOpt)));
  retryBtn?.addEventListener("click", () => {
    cards.forEach((c) => {
      c.classList.remove("is-correct", "is-wrong", "is-reveal");
      c.setAttribute("aria-pressed", "false");
    });
    fb.hidden = true;
  });
}

// =========================================================
// 07 原海报放大、拖动、Esc 关闭灯箱
// =========================================================
function initSection07Lightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const zoomLabel = document.getElementById("lb-zoom-label");
  if (!poster || !dialog || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function openLightbox() {
    lbImg.src = poster.currentSrc || poster.src;
    resetView();
    dialog.showModal();
  }

  function closeLightbox() {
    if (dialog.open) dialog.close();
  }

  poster.addEventListener("click", openLightbox);
  openBtn?.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      closeLightbox();
    }
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === lbStage) closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", resetView);

  lbStage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(0.75, Math.min(3, +(scale + dir).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    pan = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
    lbImg.setPointerCapture(e.pointerId);
    lbImg.style.cursor = "grabbing";
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!pan || pan.id !== e.pointerId) return;
    tx = e.clientX - pan.sx;
    ty = e.clientY - pan.sy;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => {
    pan = null;
    lbImg.style.cursor = "grab";
  });
  lbImg.addEventListener("pointercancel", () => {
    pan = null;
    lbImg.style.cursor = "grab";
  });
}
