// 322 一河两岸式构图 · 正文各节独立交互模块
// 相邻两节绝不复用同一种控件套路：
// 01 四态河道视线轨迹图 · 02 真实力矩视觉天平 · 03 双脉画史对照轴
// 04 跨媒介水脉显影卷帘 · 06 单变量四选一练习 · 07 原海报缩放灯箱

export function initFlowLab() {
  const wrap = document.getElementById("sec-flow-lab");
  if (!wrap) return;
  const svg = wrap.querySelector("#flow-svg");
  const titleEl = wrap.querySelector("#flow-verdict-title");
  const bodyEl = wrap.querySelector("#flow-verdict-body");
  const badgeEl = wrap.querySelector("#flow-verdict-badge");
  const btns = [...wrap.querySelectorAll("[data-flow-mode]")];

  const MODES = {
    straight: {
      badge: "僵直失势",
      title: "死直水渠：目光一眼冲出画框，两岸像被硬劈",
      body: "河岸垂直笔直且上下同宽时，视线没有任何转折缓冲，顺着中线直直滑向顶边。左右两岸彼此背离，失去了隔水顾盼的呼吸感。",
      path: "M170,18 L210,18 L210,202 L170,202 Z",
      gaze: "M190,196 L190,26",
      dwell: [[190, 110]],
      status: "warn",
    },
    graceful: {
      badge: "开合有度",
      title: "微弯 S 形收束：先放后收，视线在两岸间从容往返",
      body: "近景河口敞开迎入目光，中段轻弯放慢速度，引导眼睛先顾左岸亭阁、再望右岸疏林，最后随逐渐收窄的水脉淡入远山烟岚。",
      path: "M178,18 C172,62 216,96 206,136 C198,166 154,182 146,202 L236,202 C226,182 246,158 232,126 C218,92 198,58 202,18 Z",
      gaze: "M192,196 C198,162 222,146 218,122 C214,96 184,74 190,26",
      dwell: [
        [192, 174],
        [218, 122],
        [188, 66],
      ],
      status: "ok",
    },
    kinked: {
      badge: "急弯挤岸",
      title: "过弯蛇行：内岸被压碎，水势在中途梗阻",
      body: "河道如果剧烈左右折返，凹岸一侧几乎没有立足空间，景物被迫挤在画框边角；视线像走迷宫一样频繁急刹，节奏反而散了。",
      path: "M176,18 C110,64 290,94 108,144 C70,162 126,184 150,202 L244,202 C212,182 162,166 206,144 C332,96 176,62 204,18 Z",
      gaze: "M196,196 C158,176 158,154 156,142 C256,102 152,66 190,26",
      dwell: [
        [156, 142],
        [232, 96],
      ],
      status: "warn",
    },
    wide: {
      badge: "宽峡割裂",
      title: "宽河断桥：中段空成海峡，两岸各自孤立",
      body: "水面宽到占去大半画幅时，左右两岸被挤到最外缘，距离超过人眼自然联结的舒适范围，构图裂成互不相干的左右两条细边。",
      path: "M110,18 C102,78 96,136 74,202 L306,202 C284,136 278,78 270,18 Z",
      gaze: "M190,196 C188,136 192,82 190,26",
      dwell: [[190, 112]],
      status: "warn",
    },
  };

  function render(key) {
    const m = MODES[key] || MODES.graceful;
    btns.forEach((b) => {
      const on = b.dataset.flowMode === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    titleEl.textContent = m.title;
    bodyEl.textContent = m.body;
    badgeEl.textContent = m.badge;
    badgeEl.dataset.state = m.status;

    const accent = m.status === "ok" ? "#0B5E4E" : "#A82D24";
    const dwells = m.dwell
      .map(
        ([cx, cy], idx) => `
      <circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${accent}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.72"/>
      <circle cx="${cx}" cy="${cy}" r="7.5" fill="${accent}" stroke="#F4F8FA" stroke-width="1.4"/>
      <text x="${cx}" y="${cy + 3.6}" text-anchor="middle" font-size="10" font-weight="700" fill="#FFFFFF" font-family="Space Mono, monospace">${idx + 1}</text>
    `
      )
      .join("");

    // 左右岸固定参照轮廓（观察不同河势如何挤压或呼应两岸）
    svg.innerHTML = `
      <rect x="0" y="0" width="380" height="220" rx="6" fill="#E4E9EB"/>
      <path d="M0,48 Q68,14 134,54 L0,54 Z" fill="#9EB0BA" opacity="0.52"/>
      <path d="M380,48 Q312,18 248,54 L380,54 Z" fill="#9EB0BA" opacity="0.48"/>
      <path d="${m.path}" fill="#DCCDB2" transform="translate(-16,0) scale(1.085,1)" opacity="0.65"/>
      <path d="${m.path}" fill="#175B75"/>
      <circle cx="62" cy="134" r="18" fill="#5D7784" opacity="0.72"/>
      <rect x="44" y="120" width="24" height="14" fill="#173A4A" opacity="0.82"/>
      <circle cx="316" cy="96" r="15" fill="#466978" opacity="0.64"/>
      <circle cx="304" cy="164" r="12" fill="#2A5161" opacity="0.85"/>
      <path d="${m.gaze}" fill="none" stroke="#F4F8FA" stroke-width="2" stroke-dasharray="6 5"/>
      <polygon points="190,18 184,30 196,30" fill="#F4F8FA"/>
      ${dwells}
    `;
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.flowMode)));
  render("graceful");
}

export function initBalanceSeesaw() {
  const wrap = document.getElementById("sec-balance-lab");
  if (!wrap) return;
  const svg = wrap.querySelector("#seesaw-svg");
  const slider = wrap.querySelector("#seesaw-right-weight");
  const sliderVal = wrap.querySelector("#seesaw-right-val");
  const verdictEl = wrap.querySelector("#seesaw-verdict");
  const noteEl = wrap.querySelector("#seesaw-note");
  const presetBtns = [...wrap.querySelectorAll("[data-seesaw-preset]")];

  const state = {
    preset: "hetero",
    leftMass: 72,   // 左岸固定：一座近景深墨重亭
    rightMass: 70,  // 右岸可调：疏林+远山+扁舟总分量
    mirror: false,
  };

  const PRESETS = {
    mirror: { leftMass: 72, rightMass: 72, mirror: true, label: "同形同高复刻" },
    tilted: { leftMass: 72, rightMass: 24, mirror: false, label: "左重右轻失衡" },
    hetero: { leftMass: 72, rightMass: 70, mirror: false, label: "左亭配右林舟" },
    distant: { leftMass: 72, rightMass: 68, mirror: false, label: "近实配远展" },
  };

  function draw() {
    const diff = state.leftMass - state.rightMass; // 正值左倾，负值右倾
    const angle = Math.max(-13, Math.min(13, -diff * 0.24));
    const balanced = Math.abs(diff) <= 10;

    slider.value = String(state.rightMass);
    sliderVal.textContent = `${state.rightMass} 分量（示意）`;

    presetBtns.forEach((b) => {
      const on = b.dataset.seesawPreset === state.preset;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    if (state.mirror && balanced) {
      verdictEl.textContent = "天平虽平，却是机械镜像";
      verdictEl.dataset.state = "warn";
      noteEl.textContent =
        "左右两边形状、高低与浓淡一模一样，重心是稳住了，画面却像对折剪纸一样缺乏生气。这就是为什么原海报英文虽写 SYMMETRY，实战中更强调「异形等重」的动态呼应。";
    } else if (!balanced) {
      const heavy = diff > 0 ? "左岸" : "右岸";
      verdictEl.textContent = `${heavy}明显偏沉（倾角示意 ${Math.abs(angle).toFixed(0)}°）`;
      verdictEl.dataset.state = "warn";
      noteEl.textContent =
        diff > 0
          ? "左岸厚重的楼阁压低了梁端，右岸体量接不住这份分量，整张画面往左滑坠。拖动下方滑杆给右岸补足疏林或横展山势，看天平慢慢拉平。"
          : "右岸堆叠过重，反压过了左岸的主体。适当减淡或拉远右岸景物，让两岸分量重新回到同一水平线上。";
    } else {
      verdictEl.textContent = "异形等重 · 稳而不板";
      verdictEl.dataset.state = "ok";
      noteEl.textContent =
        "左岸是一座体量集中、墨色沉实的临水亭阁；右岸没有复制第二座亭子，而是用更舒展的疏林与淡墨小舟拉长力臂、凑平分量——形异而意合，这才是「对称呼应」的真意。";
    }

    const rScale = 0.55 + (state.rightMass / 100) * 0.72;
    const rightGroup = state.mirror
      ? `
        <rect x="268" y="64" width="38" height="32" fill="#0A4D65"/>
        <polygon points="260,64 287,42 314,64" fill="#101D23"/>
        <text x="287" y="114" text-anchor="middle" font-size="11" fill="#A82D24">复制亭阁</text>
      `
      : `
        <g transform="translate(288, 96) scale(${rScale.toFixed(2)})">
          <ellipse cx="-18" cy="-14" rx="18" ry="11" fill="#3B6474"/>
          <ellipse cx="4" cy="-24" rx="22" ry="13" fill="#1F5368"/>
          <ellipse cx="22" cy="-11" rx="14" ry="9" fill="#5D8494"/>
          <line x1="-18" y1="0" x2="-18" y2="-10" stroke="#101D23" stroke-width="2"/>
          <line x1="4" y1="0" x2="4" y2="-18" stroke="#101D23" stroke-width="2.4"/>
          <line x1="22" y1="0" x2="22" y2="-8" stroke="#101D23" stroke-width="1.8"/>
          <path d="M-34,4 Q-16,10 2,3" fill="none" stroke="#8F7346" stroke-width="2.2"/>
        </g>
        <text x="288" y="114" text-anchor="middle" font-size="11" fill="#0A4D65">疏林与远舟</text>
      `;

    const beamColor = balanced && !state.mirror ? "#0B5E4E" : "#A82D24";
    svg.innerHTML = `
      <rect x="0" y="0" width="380" height="176" rx="6" fill="#F4F0E8"/>
      <path d="M142,176 C160,144 176,122 190,114 C204,122 220,144 238,176 Z" fill="#175B75"/>
      <line x1="190" y1="118" x2="190" y2="146" stroke="#E4E9EB" stroke-width="1.5" stroke-dasharray="3 3"/>
      <g transform="rotate(${angle.toFixed(2)} 190 102)">
        <line x1="56" y1="102" x2="324" y2="102" stroke="${beamColor}" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="56" cy="102" r="4" fill="${beamColor}"/>
        <circle cx="324" cy="102" r="4" fill="${beamColor}"/>
        <rect x="74" y="64" width="38" height="32" fill="#0A4D65"/>
        <polygon points="66,64 93,42 120,64" fill="#101D23"/>
        <text x="93" y="114" text-anchor="middle" font-size="11" fill="#0A4D65">左岸重亭</text>
        ${rightGroup}
      </g>
      <circle cx="190" cy="102" r="6" fill="#DCCDB2" stroke="#094B64" stroke-width="2"/>
      <text x="190" y="164" text-anchor="middle" font-size="11" fill="#F2F5F7">河脉支点</text>
    `;
  }

  presetBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.seesawPreset;
      const p = PRESETS[k];
      if (!p) return;
      state.preset = k;
      state.leftMass = p.leftMass;
      state.rightMass = p.rightMass;
      state.mirror = p.mirror;
      draw();
    })
  );

  slider.addEventListener("input", () => {
    state.rightMass = Number(slider.value);
    state.mirror = false;
    state.preset = "";
    draw();
  });

  draw();
}

export function initLineageSwitch() {
  const wrap = document.getElementById("sec-lineage");
  if (!wrap) return;
  const tabs = [...wrap.querySelectorAll("[data-lineage]")];
  const panels = [...wrap.querySelectorAll("[data-lineage-panel]")];

  function activate(id) {
    tabs.forEach((t) => {
      const on = t.dataset.lineage === id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.lineagePanel !== id;
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => activate(t.dataset.lineage)));
  activate("classic");
}

export function initXrayCurtain() {
  const wrap = document.getElementById("sec-xray");
  if (!wrap) return;
  const tabs = [...wrap.querySelectorAll("[data-xray-scene]")];
  const slider = wrap.querySelector("#xray-range");
  const valEl = wrap.querySelector("#xray-val");
  const overlayEl = wrap.querySelector("#xray-overlay");
  const seamEl = wrap.querySelector("#xray-seam");
  const baseSvg = wrap.querySelector("#xray-base-svg");
  const skelSvg = wrap.querySelector("#xray-skel-svg");
  const captionEl = wrap.querySelector("#xray-caption");

  const CASES = {
    garden: {
      caption: "园林与街头摄影：青石曲径或林荫大道就是「河流」，把前景廊柱与右侧花木分开，又把视线引向深处门洞。",
      base: `
        <rect width="480" height="240" fill="#DCE4E7"/>
        <path d="M0,78 Q120,42 210,78 L0,78 Z" fill="#8FA2AE" opacity="0.6"/>
        <path d="M480,72 Q355,36 270,78 L480,78 Z" fill="#8FA2AE" opacity="0.5"/>
        <path d="M222,74 C216,120 250,152 204,240 L276,240 C306,156 264,120 254,74 Z" fill="#C9BEB0"/>
        <rect x="34" y="102" width="110" height="112" rx="2" fill="#2A4A57"/>
        <rect x="46" y="114" width="38" height="58" fill="#E4E9EB" opacity="0.28"/>
        <rect x="94" y="114" width="38" height="58" fill="#E4E9EB" opacity="0.28"/>
        <circle cx="368" cy="126" r="42" fill="#3D6572"/>
        <circle cx="408" cy="156" r="34" fill="#254C5B"/>
        <circle cx="332" cy="176" r="24" fill="#5A8392"/>
        <rect x="220" y="54" width="38" height="24" rx="12" fill="#0A4D65"/>
      `,
      skel: `
        <rect width="480" height="240" fill="#092430"/>
        <path d="M222,74 C216,120 250,152 204,240 L276,240 C306,156 264,120 254,74 Z" fill="#175B75" stroke="#73CDE3" stroke-width="2"/>
        <path d="M238,232 C272,158 242,122 238,76" fill="none" stroke="#F2F6F8" stroke-width="2" stroke-dasharray="6 5"/>
        <rect x="34" y="102" width="110" height="112" fill="none" stroke="#E5CCA0" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="89" y="162" text-anchor="middle" font-size="13" fill="#E5CCA0">左岸 · 建筑实体</text>
        <ellipse cx="372" cy="150" rx="68" ry="52" fill="none" stroke="#E5CCA0" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="372" y="154" text-anchor="middle" font-size="13" fill="#E5CCA0">右岸 · 疏密绿群</text>
        <text x="240" y="42" text-anchor="middle" font-size="12" fill="#73CDE3">曲径 = 隐形河道</text>
      `,
    },
    spread: {
      caption: "杂志与画册跨页：宽阔的书脊中缝与上下留白带承担「中心河道」，左页叙事文字与右页主图在体量和灰度上隔缝呼应。",
      base: `
        <rect width="480" height="240" fill="#F2EFE8"/>
        <rect x="206" y="10" width="68" height="220" fill="#E2E8EB"/>
        <rect x="34" y="34" width="118" height="18" fill="#094B64"/>
        <rect x="34" y="64" width="144" height="7" fill="#5D6E76"/>
        <rect x="34" y="79" width="136" height="7" fill="#5D6E76"/>
        <rect x="34" y="94" width="140" height="7" fill="#5D6E76"/>
        <rect x="34" y="122" width="130" height="7" fill="#7B8B93"/>
        <rect x="34" y="137" width="142" height="7" fill="#7B8B93"/>
        <rect x="34" y="152" width="118" height="7" fill="#7B8B93"/>
        <rect x="34" y="178" width="84" height="28" fill="#DCCDB2"/>
        <rect x="298" y="34" width="148" height="122" fill="#2A657C"/>
        <polygon points="298,156 356,92 412,156" fill="#DCCDB2" opacity="0.8"/>
        <rect x="298" y="170" width="110" height="8" fill="#094B64"/>
        <rect x="298" y="186" width="140" height="6" fill="#7B8B93"/>
      `,
      skel: `
        <rect width="480" height="240" fill="#092430"/>
        <path d="M214,12 C210,88 220,152 204,228 L276,228 C264,152 272,88 266,12 Z" fill="#175B75" stroke="#73CDE3" stroke-width="2"/>
        <line x1="240" y1="222" x2="240" y2="20" stroke="#F2F6F8" stroke-width="2" stroke-dasharray="6 5"/>
        <rect x="30" y="30" width="154" height="180" fill="none" stroke="#E5CCA0" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="107" y="124" text-anchor="middle" font-size="13" fill="#E5CCA0">左岸 · 文字叙事流</text>
        <rect x="294" y="30" width="156" height="168" fill="none" stroke="#E5CCA0" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="372" y="124" text-anchor="middle" font-size="13" fill="#E5CCA0">右岸 · 图像与图注</text>
        <text x="240" y="122" text-anchor="middle" font-size="12" fill="#F2F6F8">中缝留白</text>
      `,
    },
    ui: {
      caption: "网页与产品对比页：一条竖向时间轴或版本分隔带切开左右两栏，旧方案与新方案逐行对位，读者一眼就能完成横向比对。",
      base: `
        <rect width="480" height="240" fill="#EDF2F5"/>
        <rect x="220" y="18" width="40" height="204" rx="20" fill="#175B75" opacity="0.16"/>
        <line x1="240" y1="30" x2="240" y2="210" stroke="#0A4D65" stroke-width="2" stroke-dasharray="4 4"/>
        <circle cx="240" cy="64" r="6" fill="#0A4D65"/>
        <circle cx="240" cy="122" r="6" fill="#0A4D65"/>
        <circle cx="240" cy="180" r="6" fill="#0A4D65"/>
        <rect x="32" y="42" width="172" height="44" rx="4" fill="#FFFFFF" stroke="#B7C6CE"/>
        <rect x="46" y="54" width="76" height="8" fill="#5D7482"/>
        <rect x="46" y="68" width="124" height="6" fill="#9EB0BA"/>
        <rect x="32" y="100" width="172" height="44" rx="4" fill="#FFFFFF" stroke="#B7C6CE"/>
        <rect x="46" y="112" width="90" height="8" fill="#5D7482"/>
        <rect x="46" y="126" width="110" height="6" fill="#9EB0BA"/>
        <rect x="32" y="158" width="172" height="44" rx="4" fill="#FFFFFF" stroke="#B7C6CE"/>
        <rect x="46" y="170" width="66" height="8" fill="#5D7482"/>
        <rect x="46" y="184" width="130" height="6" fill="#9EB0BA"/>
        <rect x="276" y="42" width="172" height="44" rx="4" fill="#FFFFFF" stroke="#0A4D65" stroke-width="1.5"/>
        <rect x="290" y="54" width="92" height="8" fill="#0A4D65"/>
        <rect x="290" y="68" width="132" height="6" fill="#59879A"/>
        <rect x="276" y="100" width="172" height="44" rx="4" fill="#FFFFFF" stroke="#0A4D65" stroke-width="1.5"/>
        <rect x="290" y="112" width="102" height="8" fill="#0A4D65"/>
        <rect x="290" y="126" width="118" height="6" fill="#59879A"/>
        <rect x="276" y="158" width="172" height="44" rx="4" fill="#FFFFFF" stroke="#0A4D65" stroke-width="1.5"/>
        <rect x="290" y="170" width="84" height="8" fill="#0A4D65"/>
        <rect x="290" y="184" width="134" height="6" fill="#59879A"/>
      `,
      skel: `
        <rect width="480" height="240" fill="#092430"/>
        <rect x="216" y="16" width="48" height="208" rx="24" fill="#175B75" stroke="#73CDE3" stroke-width="2"/>
        <line x1="240" y1="26" x2="240" y2="214" stroke="#F2F6F8" stroke-width="2" stroke-dasharray="5 4"/>
        <rect x="30" y="38" width="176" height="168" fill="none" stroke="#E5CCA0" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="118" y="126" text-anchor="middle" font-size="13" fill="#E5CCA0">左岸 · 现状对照组</text>
        <rect x="274" y="38" width="176" height="168" fill="none" stroke="#E5CCA0" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="362" y="126" text-anchor="middle" font-size="13" fill="#E5CCA0">右岸 · 目标升级组</text>
        <text x="240" y="124" text-anchor="middle" font-size="11" fill="#F2F6F8">轴线河道</text>
      `,
    },
  };

  let current = "garden";

  function updateReveal() {
    const pct = Number(slider.value);
    valEl.textContent = `${pct}%`;
    overlayEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    if (seamEl) seamEl.style.left = `${pct}%`;
  }

  function renderScene(key) {
    current = key;
    const c = CASES[key];
    tabs.forEach((t) => {
      const on = t.dataset.xrayScene === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    });
    baseSvg.innerHTML = c.base;
    skelSvg.innerHTML = c.skel;
    captionEl.textContent = c.caption;
    updateReveal();
  }

  tabs.forEach((t) => t.addEventListener("click", () => renderScene(t.dataset.xrayScene)));
  slider.addEventListener("input", updateReveal);
  renderScene(current);
}

export function initQuiz() {
  const wrap = document.getElementById("sec-quiz");
  if (!wrap) return;
  const options = [...wrap.querySelectorAll("[data-quiz-opt]")];
  const feedback = wrap.querySelector("#quiz-feedback");
  const fbTitle = wrap.querySelector("#quiz-fb-title");
  const fbBody = wrap.querySelector("#quiz-fb-body");
  const resetBtn = wrap.querySelector("#quiz-reset");

  const ANSWERS = {
    A: {
      ok: false,
      title: "方案 A · 稳住了，但掉进了「机械镜像」的坑",
      body: "右岸在完全相同的高度和距离摆了一座一模一样的阁楼。两边的确等重，但就像拿一张纸对折印出来的双胞胎，视线在左右来回打转却没有新鲜变化，显得呆板。",
    },
    B: {
      ok: false,
      title: "方案 B · 左重右空，画面朝左边倾倒了",
      body: "左岸近景有一座深墨厚重的钟楼，右岸却只在极远处留了一笔淡影。两边体量与力矩悬殊太大，整幅跨页重心往左坠，河道起不到平衡两翼的作用。",
    },
    C: {
      ok: true,
      title: "方案 C · 选对了！异形等重、高低错落",
      body: "右岸没有照抄左岸的建筑，而是用中远景一片舒展的疏林加两叶淡墨扁舟接住分量：轮廓不同但视觉总量相当，高度错开带出斜向呼应，近实远虚也一并保住了。",
    },
    D: {
      ok: false,
      title: "方案 D · 主体横跨河心，截断了水脉与视线",
      body: "把新建筑直接压在河道正中，违背了「河流作为自然分隔线，避免将主体置于画面正中心」的基本规矩。原本引导目光往纵深走的水道被迎面拦腰切断。",
    },
  };

  function pick(choice) {
    const ans = ANSWERS[choice];
    if (!ans) return;
    options.forEach((btn) => {
      const k = btn.dataset.quizOpt;
      btn.classList.toggle("is-selected", k === choice);
      btn.classList.toggle("is-correct", k === choice && ans.ok);
      btn.classList.toggle("is-wrong", k === choice && !ans.ok);
      btn.setAttribute("aria-pressed", String(k === choice));
    });
    feedback.hidden = false;
    feedback.dataset.state = ans.ok ? "ok" : "warn";
    fbTitle.textContent = ans.title;
    fbBody.textContent = ans.body;
  }

  options.forEach((btn) => btn.addEventListener("click", () => pick(btn.dataset.quizOpt)));
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      options.forEach((b) => {
        b.classList.remove("is-selected", "is-correct", "is-wrong");
        b.setAttribute("aria-pressed", "false");
      });
      feedback.hidden = true;
    });
  }
}

export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const dialog = document.getElementById("poster-lightbox");
  if (!poster || !dialog) return;

  const fullImg = dialog.querySelector("#lightbox-img");
  const closeBtn = dialog.querySelector("#lightbox-close");
  const zoomInBtn = dialog.querySelector("#lightbox-zoom-in");
  const zoomOutBtn = dialog.querySelector("#lightbox-zoom-out");
  const zoomResetBtn = dialog.querySelector("#lightbox-zoom-reset");
  const viewport = dialog.querySelector("#lightbox-viewport");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    fullImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    if (!fullImg.src) fullImg.src = poster.src;
    resetView();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function close() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  poster.addEventListener("click", open);
  if (openBtn) openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      close();
    }
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.4).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.4).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", resetView);

  viewport.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  viewport.addEventListener("pointerup", () => {
    dragging = false;
  });
  viewport.addEventListener("pointercancel", () => {
    dragging = false;
  });
}
