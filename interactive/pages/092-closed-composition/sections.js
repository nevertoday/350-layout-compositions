// 092 封闭式构图 — 正文各节独立互动模块（01–07）
// 每一节采用完全不同的控件与视觉语言，严禁绘制人物五官，全部用纯剪影/几何图解。

// ==================== 01 四层剖面剥离卡尺 ====================
export function mountPeelLab() {
  const svg = document.getElementById("peel-svg");
  const verdict = document.getElementById("peel-verdict");
  const buttons = [...document.querySelectorAll(".layer-btn")];
  const btnRestore = document.getElementById("peel-restore");
  const btnOnlyBox = document.getElementById("peel-only-box");
  if (!svg) return;

  const layers = { outer: true, bevel: true, ring: true, core: true };

  function render() {
    const parts = [];
    parts.push(`<rect width="420" height="420" fill="#F1E6D6"/>`);
    // 参考淡金网格
    parts.push(`<path d="M210 12V408M12 210H408" stroke="#C4A670" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>`);

    if (layers.outer) {
      parts.push(`
        <g>
          <rect x="20" y="20" width="380" height="380" fill="#112C21"/>
          <rect x="38" y="38" width="344" height="344" fill="none" stroke="#D6AF6D" stroke-width="1.2" opacity="0.65"/>
          <rect x="58" y="58" width="304" height="304" fill="#EBDFC7"/>
        </g>
      `);
    } else {
      parts.push(`
        <rect x="20" y="20" width="380" height="380" fill="none" stroke="#B83227" stroke-width="1.8" stroke-dasharray="7 5"/>
        <text x="210" y="42" text-anchor="middle" fill="#B83227" font-size="13" font-weight="700">外墙已撤 · 边界敞开</text>
      `);
    }

    if (layers.bevel) {
      parts.push(`
        <g>
          <polygon points="58,58 362,58 326,94 94,94" fill="#F2E6CF"/>
          <polygon points="58,362 362,362 326,326 94,326" fill="#E6D2AE"/>
          <polygon points="58,58 94,94 94,326 58,362" fill="#D8BD8D"/>
          <polygon points="362,58 326,94 326,326 362,362" fill="#D0B280"/>
          <rect x="94" y="94" width="232" height="232" fill="#EBDFC7" stroke="#173426" stroke-width="5"/>
          <polygon points="184,58 236,58 210,94" fill="#112C21"/>
          <polygon points="184,362 236,362 210,326" fill="#112C21"/>
          <polygon points="58,184 58,236 94,210" fill="#112C21"/>
          <polygon points="362,184 362,236 326,210" fill="#112C21"/>
        </g>
      `);
    } else if (layers.outer) {
      parts.push(`<rect x="94" y="94" width="232" height="232" fill="none" stroke="#B83227" stroke-width="1.4" stroke-dasharray="5 4"/>`);
    }

    if (layers.ring) {
      parts.push(`
        <g>
          <circle cx="210" cy="210" r="112" fill="#173426" stroke="#C4A670" stroke-width="1.4"/>
          <circle cx="210" cy="210" r="82" fill="#112C21" stroke="#D6AF6D" stroke-width="4.5"/>
          <polygon points="210,132 288,210 210,288 132,210" fill="#EBDFC7"/>
        </g>
      `);
    }

    if (layers.core) {
      parts.push(`
        <g>
          <rect x="166" y="166" width="88" height="88" fill="#C7A76B"/>
          <circle cx="210" cy="210" r="28" fill="#112C21"/>
          <circle cx="210" cy="210" r="12" fill="#D6A354"/>
        </g>
      `);
    } else {
      parts.push(`<circle cx="210" cy="210" r="26" fill="none" stroke="#B83227" stroke-width="1.8" stroke-dasharray="4 4"/>`);
    }

    svg.innerHTML = parts.join("");

    // 动态白话诊评
    const onCount = Object.values(layers).filter(Boolean).length;
    if (onCount === 4) {
      verdict.textContent = "四层完整咬合：外墙阻断外溢、斜壁改变角度、圆环过渡缓冲、核座承接终点。";
    } else if (!layers.outer && !layers.bevel && !layers.ring && !layers.core) {
      verdict.textContent = "四层全撤：画布只剩空纸与参考十字，毫无围合可言。";
    } else if (layers.outer && !layers.bevel && !layers.ring && !layers.core) {
      verdict.textContent = "只剩一道空外框：这正是初学者常犯的「假封闭」——四周画了黑线，框里却既没有导向也没有重心。";
    } else if (!layers.outer) {
      verdict.textContent = "撤掉外墙（L1）：内圈形体还在，但外缘失去阻挡，整体气场立即松散外泄。";
    } else if (!layers.core) {
      verdict.textContent = "撤掉核座（L4）：四面围墙把目光辛苦送到中央，却扑了个空——结构成了空壳。";
    } else if (!layers.bevel) {
      verdict.textContent = "撤掉斜切导引（L2）：外框和内环之间缺少折角牵引，视线容易在外墙四角空转。";
    } else if (!layers.ring) {
      verdict.textContent = "撤掉内环缓冲（L3）：方框与核心之间过渡太生硬，少了一层柔化直角的向心承托。";
    } else {
      verdict.textContent = `当前开启 ${onCount}/4 层：结构仍缺关键环节，视线无法完整完成「拦住→折向→落核」。`;
    }

    for (const btn of buttons) {
      const k = btn.dataset.layer;
      const on = layers[k];
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
      btn.querySelector(".layer-state").textContent = on ? "开启" : "已拆";
    }
  }

  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const k = btn.dataset.layer;
      layers[k] = !layers[k];
      render();
    });
  }
  btnRestore?.addEventListener("click", () => {
    layers.outer = layers.bevel = layers.ring = layers.core = true;
    render();
  });
  btnOnlyBox?.addEventListener("click", () => {
    layers.outer = true;
    layers.bevel = layers.ring = layers.core = false;
    render();
  });

  render();
}

// ==================== 02 三种围合 + 隐形围栏 X-Ray 帘幕 ====================
export function mountXrayLab() {
  const svg = document.getElementById("xray-svg");
  const curtain = document.getElementById("xray-curtain");
  const curtainVal = document.getElementById("xray-curtain-val");
  const titleEl = document.getElementById("xray-title");
  const descEl = document.getElementById("xray-desc");
  const whyEl = document.getElementById("xray-why");
  const btns = [...document.querySelectorAll("[data-closure]")];
  if (!svg) return;

  const MODES = {
    frame: {
      title: "实体框景围合：用门洞、拱廊或版心留白切出「画中画」",
      desc: "最直接也最有仪式感的方式。苏州园林的月洞门、精装书封的烫金套框、建筑摄影里的廊柱拱门，都是先立一道清晰物理边界，再让主角端坐框内。",
      why: "暗色前景门墙彻底截断了四周杂景，大脑把洞口内的庭院识别成独立完整的舞台，目光零损耗直达中央。",
      scene: () => `
        <rect width="560" height="360" fill="#143225"/>
        <circle cx="280" cy="180" r="126" fill="#F1E6D6"/>
        <path d="M164 236 Q220 198 280 218 T396 226 L396 310 L164 310 Z" fill="#D5BC91"/>
        <path d="M242 238 L242 152 L280 124 L318 152 L318 238 Z" fill="#173426"/>
        <path d="M228 156 L280 114 L332 156 Z" fill="#112C21"/>
        <circle cx="280" cy="180" r="16" fill="#D6A354"/>
        <circle cx="280" cy="180" r="126" fill="none" stroke="#C4A670" stroke-width="4"/>
      `,
      overlay: () => `
        <circle cx="280" cy="180" r="134" fill="none" stroke="#FFE09E" stroke-width="2.2" stroke-dasharray="8 5"/>
        <path d="M90 180 H140 M470 180 H420 M280 18 V44 M280 342 V316" stroke="#FFE09E" stroke-width="2"/>
        <circle cx="280" cy="180" r="24" fill="none" stroke="#73D6A4" stroke-width="2.2"/>
      `,
      tag: "物理月洞门壁 = 硬边界闭环",
    },
    vignette: {
      title: "明暗暗角围合：没有一根边框线，只靠深影裹住亮核",
      desc: "古典静物画、暗调产品棚拍与维米尔的室内光，往往四周没有硬框，却用重色幕布、前景暗树或自然暗角把四周压沉，让中央亮区像聚光灯一样亮出来。",
      why: "人眼本能奔向高对比明暗交界处。四周压暗等于筑起一道柔和的「光影围墙」，既不显得生硬，又能把视线稳稳留在亮核。",
      scene: () => `
        <defs>
          <radialGradient id="vig-g" cx="50%" cy="48%" r="54%">
            <stop offset="0%" stop-color="#F6EBD8"/>
            <stop offset="46%" stop-color="#DEC69B"/>
            <stop offset="78%" stop-color="#214635"/>
            <stop offset="100%" stop-color="#0A1B13"/>
          </radialGradient>
        </defs>
        <rect width="560" height="360" fill="url(#vig-g)"/>
        <path d="M0 0 H155 C112 108 118 240 165 360 H0 Z" fill="#0C2017" opacity="0.86"/>
        <path d="M560 0 H405 C448 108 442 240 395 360 H560 Z" fill="#0C2017" opacity="0.86"/>
        <rect x="210" y="246" width="140" height="10" fill="#173426"/>
        <path d="M254 246 L262 174 C244 156 244 128 268 118 L266 96 H294 L292 118 C316 128 316 156 298 174 L306 246 Z" fill="#173426"/>
        <rect x="255" y="144" width="50" height="8" fill="#D6A354"/>
      `,
      overlay: () => `
        <ellipse cx="280" cy="176" rx="146" ry="118" fill="none" stroke="#FFE09E" stroke-width="2.2" stroke-dasharray="8 5"/>
        <path d="M100 176 L154 176 M460 176 L406 176 M280 34 L280 74 M280 326 L280 284" stroke="#FFE09E" stroke-width="2"/>
        <circle cx="280" cy="166" r="46" fill="none" stroke="#73D6A4" stroke-width="2.2"/>
      `,
      tag: "明暗梯度围墙 = 零边框的光影封闭",
    },
    gaze: {
      title: "视线与姿态闭环：左右人物向内俯身，凝视锁住中央器物",
      desc: "高阶绘画与剧照里，画面四周空旷无框，却靠左右两位人物的身体弧度与视线方向共同朝向中心点（如圆桌、信件、怀抱婴孩），形成看不见的心理闭环。",
      why: "韦特海默的格式塔闭合原则指出，大脑会自动补全向心合围的轮廓；只要所有姿态和目光都在画内互相接住，观者就不会往画外张望。",
      scene: () => `
        <rect width="560" height="360" fill="#F1E6D6"/>
        <rect x="0" y="276" width="560" height="84" fill="#DFC8A0"/>
        <!-- 左侧纯剪影人物（无任何五官，仅头肩侧影向内微倾） -->
        <path d="M126 276 C132 212 152 178 186 168 C178 156 178 136 194 128 C210 120 226 132 224 150 C222 162 214 170 208 176 C224 196 232 228 228 276 Z" fill="#173426"/>
        <!-- 右侧纯剪影人物（无任何五官，向内微倾呼应） -->
        <path d="M434 276 C428 212 408 178 374 168 C382 156 382 136 366 128 C350 120 334 132 336 150 C338 162 346 170 352 176 C336 196 328 228 332 276 Z" fill="#173426"/>
        <!-- 中央金灯核心 -->
        <ellipse cx="280" cy="252" rx="34" ry="8" fill="#B48835"/>
        <path d="M262 252 Q266 218 280 206 Q294 218 298 252 Z" fill="#D6A354"/>
        <circle cx="280" cy="210" r="14" fill="#FFF7DE" opacity="0.72"/>
      `,
      overlay: () => `
        <path d="M138 274 C138 148 206 94 280 94 C354 94 422 148 422 274 Z" fill="none" stroke="#112C21" stroke-width="2.5" stroke-dasharray="8 5"/>
        <line x1="212" y1="152" x2="272" y2="212" stroke="#B83227" stroke-width="2.4" stroke-dasharray="5 4"/>
        <line x1="348" y1="152" x2="288" y2="212" stroke="#B83227" stroke-width="2.4" stroke-dasharray="5 4"/>
        <circle cx="280" cy="218" r="24" fill="none" stroke="#1E6B47" stroke-width="2.5"/>
      `,
      tag: "双人弧背 + 对向视线 = 隐形格式塔闭合",
    },
  };

  let mode = "frame";
  let pct = 62;

  function render() {
    const m = MODES[mode];
    const clipX = Math.round((pct / 100) * 560);
    svg.innerHTML = `
      <defs>
        <clipPath id="xray-clip"><rect x="0" y="0" width="${clipX}" height="360"/></clipPath>
      </defs>
      ${m.scene()}
      <g clip-path="url(#xray-clip)">
        <rect width="560" height="360" fill="${mode === "gaze" ? "rgba(241,230,214,0.18)" : "rgba(13,33,24,0.22)"}"/>
        ${m.overlay()}
      </g>
      <line x1="${clipX}" y1="0" x2="${clipX}" y2="360" stroke="#D6AF6D" stroke-width="2.2"/>
      <rect x="${Math.max(8, Math.min(484, clipX - 34))}" y="10" width="68" height="22" fill="#112C21" stroke="#D6AF6D" stroke-width="1"/>
      <text x="${Math.max(42, Math.min(518, clipX))}" y="25" text-anchor="middle" fill="#EFE6D5" font-size="11" font-weight="600">显影 ${pct}%</text>
      <rect x="138" y="324" width="284" height="26" fill="rgba(17,44,33,0.92)" stroke="#D6AF6D" stroke-width="1"/>
      <text x="280" y="341" text-anchor="middle" fill="#FFE09E" font-size="12.5" font-weight="700">${m.tag}</text>
    `;
    titleEl.textContent = m.title;
    descEl.textContent = m.desc;
    whyEl.textContent = m.why;
    curtainVal.textContent = `${pct}%`;

    for (const b of btns) {
      const active = b.dataset.closure === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
  }

  for (const b of btns) {
    b.addEventListener("click", () => {
      mode = b.dataset.closure;
      render();
    });
  }
  curtain?.addEventListener("input", () => {
    pct = Number(curtain.value);
    render();
  });

  render();
}

// ==================== 03 深柏暗室六站年表 ====================
export function mountEraStepper() {
  const svg = document.getElementById("era-svg");
  const kicker = document.getElementById("era-kicker");
  const title = document.getElementById("era-title");
  const body = document.getElementById("era-body");
  const source = document.getElementById("era-source");
  const tabs = [...document.querySelectorAll(".era-tab")];
  if (!svg) return;

  const ERAS = {
    raphael: {
      kicker: "HIGH RENAISSANCE TONDO · NATIONAL GALLERY OF ART",
      title: "拉斐尔《阿尔巴圣母》（约 1510 年）",
      body: "这幅直径 94.5 厘米的圆形油画（现藏华盛顿国家美术馆，馆藏号 1937.1.24）是盛期文艺复兴封闭构图的典范。圣母、圣婴与施洗者约翰呈低稳金字塔形顺应圆框弯曲，衣褶与三道凝视全部收拢到中央细十字架上，整张画如自足的微缩世界。",
      source: "National Gallery of Art, Washington — Raphael, The Alba Madonna (c. 1510, 1937.1.24)",
      draw: () => `
        <circle cx="200" cy="150" r="118" fill="#153124" stroke="#D6AF6D" stroke-width="2.4"/>
        <circle cx="200" cy="150" r="106" fill="none" stroke="#D6AF6D" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>
        <polygon points="200,66 292,226 108,226" fill="rgba(214,175,109,0.14)" stroke="#D6AF6D" stroke-width="1.8"/>
        <path d="M138 220 C142 152 170 112 200 108 C230 112 258 152 262 220" fill="none" stroke="#EFE6D5" stroke-width="2"/>
        <circle cx="200" cy="176" r="10" fill="#D6A354"/>
        <path d="M174 140 L196 170 M228 148 L204 172" stroke="#73D6A4" stroke-width="1.8" stroke-dasharray="4 3"/>
        <text x="200" y="286" text-anchor="middle" fill="#C0CEC5" font-size="12">Tondo 圆框 × 低金字塔形 × 三向凝视焦核</text>
      `,
    },
    jicheng: {
      kicker: "LATE MING GARDEN ARCHITECTURE · YUANYE",
      title: "计成《园冶》（1631–1634 年）与中式框景",
      body: "晚明造园家计成在《园冶》中系统总结「门窗洞口」与「借景」之法。江南园林把粉墙化作外框，开出月洞门、八角窗或花窗漏景，让原本散漫的竹石亭台一经收框，便成一幅可游可驻的封闭画卷。",
      source: "计成《园冶》（1631–1634）；Alison Hardie 译本 The Craft of Gardens, Yale University Press, 1988",
      draw: () => `
        <rect x="44" y="28" width="312" height="224" fill="#153124" stroke="#D6AF6D" stroke-width="2"/>
        <circle cx="200" cy="144" r="82" fill="#0D2118" stroke="#D6AF6D" stroke-width="2.4"/>
        <path d="M134 188 Q174 156 200 170 T266 178" fill="none" stroke="#C4A670" stroke-width="1.8"/>
        <path d="M180 184 V134 L200 118 L220 134 V184 Z" fill="rgba(214,175,109,0.22)" stroke="#EFE6D5" stroke-width="1.6"/>
        <path d="M168 136 L200 110 L232 136" fill="none" stroke="#EFE6D5" stroke-width="2"/>
        <circle cx="200" cy="152" r="6" fill="#D6A354"/>
        <text x="200" y="278" text-anchor="middle" fill="#C0CEC5" font-size="12">粉墙月洞门框景：化散漫园景为聚焦方寸</text>
      `,
    },
    vermeer: {
      kicker: "DUTCH GOLDEN AGE · NATIONAL GALLERY OF ART",
      title: "维米尔《持天平的女子》（约 1664 年）",
      body: "现藏华盛顿国家美术馆（馆藏号 1942.9.97）。维米尔没有画装饰边框，却用左侧窗帘暗影、桌上深色首饰盒与背后《末日审判》的漆黑画框套出层层「框中框」，把观者目光安静压到画面中央空悬平衡的天平支点。",
      source: "National Gallery of Art, Washington — Johannes Vermeer, Woman Holding a Balance (c. 1664, 1942.9.97)",
      draw: () => `
        <rect x="64" y="26" width="272" height="232" fill="#0A1A13" stroke="#D6AF6D" stroke-width="1.8"/>
        <rect x="136" y="44" width="176" height="148" fill="#153124" stroke="#C4A670" stroke-width="2"/>
        <path d="M64 26 H124 L108 258 H64 Z" fill="#173426"/>
        <line x1="200" y1="126" x2="200" y2="196" stroke="#EFE6D5" stroke-width="1.6"/>
        <line x1="168" y1="154" x2="232" y2="154" stroke="#D6AF6D" stroke-width="2"/>
        <circle cx="200" cy="154" r="9" fill="#D6A354"/>
        <rect x="148" y="106" width="104" height="96" fill="none" stroke="#73D6A4" stroke-width="1.5" stroke-dasharray="5 4"/>
        <text x="200" y="282" text-anchor="middle" fill="#C0CEC5" font-size="12">画中画黑框 + 窗帘暗影 → 压向天平支点</text>
      `,
    },
    wolfflin: {
      kicker: "FOUNDATIONAL ART HISTORY · 1915 MUNICH",
      title: "沃尔夫林《美术史的基本概念》（1915 年）",
      body: "瑞士艺术史家海因里希·沃尔夫林在 1915 年首版名著中提出五组形式范畴，第三组正是「封闭形式与开放形式」（Geschlossene Form und offene Form，亦称建构式与非建构式）。他指出封闭形式呼应画框的横竖骨架，让一切视觉力量在内部自我平衡。",
      source: "Heinrich Wölfflin, Kunstgeschichtliche Grundbegriffe, München: F. Bruckmann, 1915 (doi:10.11588/diglit.27250)",
      draw: () => `
        <g transform="translate(26,34)">
          <rect width="154" height="196" fill="#153124" stroke="#D6AF6D" stroke-width="2.2"/>
          <line x1="77" y1="16" x2="77" y2="180" stroke="#D6AF6D" stroke-width="1.2" stroke-dasharray="4 4"/>
          <line x1="16" y1="98" x2="138" y2="98" stroke="#D6AF6D" stroke-width="1.2" stroke-dasharray="4 4"/>
          <rect x="34" y="42" width="86" height="112" fill="none" stroke="#EFE6D5" stroke-width="2"/>
          <circle cx="77" cy="98" r="14" fill="#D6A354"/>
          <text x="77" y="220" text-anchor="middle" fill="#D6AF6D" font-size="12" font-weight="700">封闭形式 (Tektonisch)</text>
        </g>
        <g transform="translate(220,34)">
          <rect width="154" height="196" fill="#10281D" stroke="#C0CEC5" stroke-width="1.2" stroke-dasharray="6 4"/>
          <line x1="-10" y1="166" x2="168" y2="26" stroke="#FF8373" stroke-width="2.2"/>
          <circle cx="146" cy="44" r="24" fill="none" stroke="#FF8373" stroke-width="1.8"/>
          <text x="77" y="220" text-anchor="middle" fill="#C0CEC5" font-size="12">开放形式 (Atektonisch)</text>
        </g>
      `,
    },
    wertheimer: {
      kicker: "GESTALT PSYCHOLOGY · PSYCHOLOGISCHE FORSCHUNG",
      title: "韦特海默「闭合原则」（1923 年）",
      body: "格式塔心理学奠基人马克斯·韦特海默在 1923 年发表《格式塔理论研究 II》，阐明「闭合原则」（Geschlossenheit）：人脑天然偏向把围合起一块内部区域的轮廓视作完整整体，甚至会自动补齐微小缺口——这正是封闭式构图产生整体统一感的认知根基。",
      source: "Max Wertheimer, Untersuchungen zur Lehre von der Gestalt II, Psychologische Forschung 4 (1923): 301–350",
      draw: () => `
        <path d="M104 72 H174 M226 72 H296 M296 72 V132 M296 172 V232 M296 232 H226 M174 232 H104 M104 232 V172 M104 132 V72" fill="none" stroke="#EFE6D5" stroke-width="3.2" stroke-linecap="square"/>
        <rect x="104" y="72" width="192" height="160" fill="rgba(214,175,109,0.12)" stroke="#73D6A4" stroke-width="1.4" stroke-dasharray="5 5"/>
        <circle cx="200" cy="152" r="22" fill="#D6A354"/>
        <text x="200" y="268" text-anchor="middle" fill="#C0CEC5" font-size="12">即使只留四组折角，人脑仍自动补全封闭场域</text>
      `,
    },
    braudy: {
      kicker: "FILM THEORY & COMPOSITION · 1976 / 1982",
      title: "布劳迪《框中世界》与阿恩海姆《中心的力量》",
      body: "1976 年电影学者利奥·布劳迪在《框中世界》中区分「封闭电影」与「开放电影」：希区柯克、弗里茨·朗把银幕当作严密自足的画框，帧内每件器物都服务于内部秩序；1982 年阿恩海姆在《中心的力量》中进一步指出，优秀构图永远是「笛卡尔边界框架」与「向心辐射核心」彼此制衡的结果。",
      source: "Leo Braudy, The World in a Frame (1976); Rudolf Arnheim, The Power of the Center, UC Press (1982 / rev. 1988)",
      draw: () => `
        <rect x="44" y="48" width="312" height="184" fill="#153124" stroke="#D6AF6D" stroke-width="2.4"/>
        <rect x="64" y="66" width="272" height="148" fill="none" stroke="#EFE6D5" stroke-width="1" opacity="0.45"/>
        <circle cx="200" cy="140" r="56" fill="none" stroke="#D6AF6D" stroke-width="1.8" stroke-dasharray="5 4"/>
        <circle cx="200" cy="140" r="24" fill="#D6A354"/>
        <path d="M64 66 L160 116 M336 66 L240 116 M64 214 L160 164 M336 214 L240 164" stroke="#73D6A4" stroke-width="1.5"/>
        <text x="200" y="266" text-anchor="middle" fill="#C0CEC5" font-size="12">笛卡尔银幕外框 × 向心辐射体系的动态均衡</text>
      `,
    },
  };

  function select(id) {
    const e = ERAS[id];
    if (!e) return;
    kicker.textContent = e.kicker;
    title.textContent = e.title;
    body.textContent = e.body;
    source.textContent = `核实出处：${e.source}`;
    svg.innerHTML = e.draw();
    for (const t of tabs) {
      const active = t.dataset.era === id;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    }
  }

  for (const t of tabs) {
    t.addEventListener("click", () => select(t.dataset.era));
  }
  select("raphael");
}

// ==================== 04 应用载体留白压测 ====================
export function mountMarginTester() {
  const grid = document.getElementById("app-grid");
  const note = document.getElementById("margin-note");
  const btns = [...document.querySelectorAll("[data-margin]")].filter((el) => el.tagName === "BUTTON");
  if (!grid) return;

  const NOTES = {
    tight: "当前：6% 窒息紧框——主角和按钮快顶到边框线，四周失去喘息，权威感瞬间变成压迫与局促。",
    balanced: "当前：18% 经验稳态——外框稳稳护住四周，主角四周仍有一圈透气护城河，权威感与舒适度兼得。",
    airy: "当前：28% 疏朗典雅——内庭留白更加宽裕，精致克制，特别适合高端画册封面与典藏级海报。",
  };

  for (const b of btns) {
    b.addEventListener("click", () => {
      const m = b.dataset.margin;
      grid.dataset.margin = m;
      note.textContent = NOTES[m];
      for (const o of btns) {
        const active = o === b;
        o.classList.toggle("is-active", active);
        o.setAttribute("aria-pressed", String(active));
      }
    });
  }
}

// ==================== 05 什么时候别用（三组翻转病例） ====================
export function mountAvoidCards() {
  const cards = [...document.querySelectorAll(".avoid-card")];
  const DATA = {
    coast: {
      badSvg: `
        <rect width="300" height="180" fill="#112C21"/>
        <rect x="28" y="22" width="244" height="136" fill="#F1E6D6" stroke="#C4A670" stroke-width="5"/>
        <rect x="31" y="100" width="238" height="55" fill="#44685E"/>
        <circle cx="150" cy="76" r="18" fill="#D6A354"/>
        <text x="150" y="172" text-anchor="middle" fill="#FF8373" font-size="11">粗框把海天截成孤立小标本</text>
      `,
      goodSvg: `
        <rect width="300" height="180" fill="#F1E6D6"/>
        <rect x="0" y="106" width="300" height="74" fill="#2A5447"/>
        <circle cx="246" cy="54" r="34" fill="#D6A354"/>
        <path d="M-10 124 Q120 112 310 132" stroke="#F1E6D6" stroke-width="2" fill="none" opacity="0.65"/>
        <rect x="8" y="150" width="166" height="22" fill="rgba(17,44,33,0.86)"/>
        <text x="91" y="165" text-anchor="middle" fill="#73D6A4" font-size="11">破框出血，海平线延向画外</text>
      `,
    },
    sprint: {
      badSvg: `
        <rect width="300" height="180" fill="#112C21"/>
        <rect x="24" y="20" width="252" height="140" fill="#E9DCC7" stroke="#173426" stroke-width="8"/>
        <path d="M52 126 L220 66 L206 54 L250 56 L224 88 L220 74 L58 138 Z" fill="#173426"/>
        <line x1="252" y1="30" x2="252" y2="150" stroke="#B83227" stroke-width="3" stroke-dasharray="4 3"/>
        <text x="150" y="172" text-anchor="middle" fill="#FF8373" font-size="11">动势箭锋一头撞死在右框壁</text>
      `,
      goodSvg: `
        <rect width="300" height="180" fill="#E9DCC7"/>
        <path d="M-12 152 L252 44 L234 26 L308 26 L268 82 L256 62 L-4 170 Z" fill="#173426"/>
        <circle cx="238" cy="112" r="24" fill="#D6A354"/>
        <rect x="8" y="150" width="168" height="22" fill="rgba(17,44,33,0.9)"/>
        <text x="92" y="165" text-anchor="middle" fill="#73D6A4" font-size="11">斜势穿出右缘，冲劲彻底释放</text>
      `,
    },
    phone: {
      badSvg: `
        <rect width="300" height="180" fill="#112C21"/>
        <rect x="96" y="8" width="108" height="142" rx="7" fill="#F1E6D6" stroke="#C4A670" stroke-width="2"/>
        <rect x="106" y="20" width="88" height="54" fill="none" stroke="#173426" stroke-width="3.5"/>
        <rect x="113" y="27" width="74" height="40" fill="none" stroke="#B83227" stroke-width="1.8"/>
        <rect x="122" y="38" width="54" height="5" fill="#173426"/>
        <rect x="122" y="48" width="38" height="4" fill="#44564B"/>
        <rect x="106" y="82" width="88" height="54" fill="none" stroke="#173426" stroke-width="3.5"/>
        <rect x="113" y="89" width="74" height="40" fill="none" stroke="#B83227" stroke-width="1.8"/>
        <rect x="122" y="100" width="48" height="5" fill="#173426"/>
        <text x="150" y="170" text-anchor="middle" fill="#FF8373" font-size="11">多层粗框套娃，正文被挤成细缝</text>
      `,
      goodSvg: `
        <rect width="300" height="180" fill="#112C21"/>
        <rect x="96" y="8" width="108" height="142" rx="7" fill="#F8F2E8" stroke="#73D6A4" stroke-width="2"/>
        <rect x="104" y="18" width="92" height="36" fill="#DFC8A0"/>
        <rect x="104" y="60" width="80" height="5" fill="#173426"/>
        <rect x="104" y="70" width="62" height="4" fill="#44564B"/>
        <line x1="104" y1="84" x2="196" y2="84" stroke="#C4A670" stroke-width="1"/>
        <rect x="104" y="92" width="92" height="32" fill="#DFC8A0"/>
        <rect x="104" y="130" width="74" height="5" fill="#173426"/>
        <text x="150" y="170" text-anchor="middle" fill="#73D6A4" font-size="11">去掉多余硬框，信息流呼吸顺畅</text>
      `,
    },
  };

  for (const card of cards) {
    const id = card.dataset.avoid;
    const svg = card.querySelector("svg");
    const badge = card.querySelector(".avoid-badge");
    const btn = card.querySelector(".btn-flip");

    function draw() {
      const isGood = card.dataset.state === "good";
      svg.innerHTML = isGood ? DATA[id].goodSvg : DATA[id].badSvg;
      badge.textContent = isGood ? "破框救场" : "硬封翻车";
      btn.textContent = isGood ? "切回硬封翻车版" : "切到破框救场版";
    }

    btn.addEventListener("click", () => {
      card.dataset.state = card.dataset.state === "good" ? "bad" : "good";
      draw();
    });
    draw();
  }
}

// ==================== 06 单变量严苛实战小练习 ====================
export function mountQuiz() {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const verdict = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("quiz-v-title");
  const vBody = document.getElementById("quiz-v-body");
  const btnReset = document.getElementById("quiz-reset");
  if (!cards.length) return;

  const CORRECT = "C";
  let picked = null;

  // 共同主体（相同底色、相同青铜樽器形、相同标题位），只改边界与导向一个变量
  const baseVessel = `
    <g transform="translate(120,152)">
      <path d="M-22 44 L-16 8 C-30 -6 -30 -24 -12 -32 L-14 -48 H14 L12 -32 C30 -24 30 -6 16 8 L22 44 Z" fill="#EBDFC7"/>
      <rect x="-18" y="-12" width="36" height="6" fill="#D6A354"/>
      <rect x="-26" y="44" width="52" height="6" fill="#C4A670"/>
    </g>
    <rect x="74" y="236" width="92" height="7" fill="#EFE6D5"/>
    <rect x="92" y="250" width="56" height="4" fill="#C4A670"/>
  `;

  function plateSvg(choice, reveal) {
    let frame = "";
    let overlay = "";

    if (choice === "A") {
      // A：看似精致，但右侧大开口 + 内侧金角朝右外张泄气
      frame = `
        <rect width="240" height="300" fill="#112C21"/>
        <path d="M236 22 H22 V278 H236" fill="none" stroke="#C4A670" stroke-width="2.4"/>
        <path d="M186 44 L218 44 L218 76 M186 256 L218 256 L218 224" fill="none" stroke="#D6AF6D" stroke-width="2"/>
        <path d="M174 150 H232" stroke="#D6AF6D" stroke-width="1.4" stroke-dasharray="4 3"/>
      `;
      overlay = `
        <line x1="230" y1="22" x2="230" y2="278" stroke="#FF8373" stroke-width="3" stroke-dasharray="6 4"/>
        <path d="M156 150 H226 M218 142 L228 150 L218 158" fill="none" stroke="#FF8373" stroke-width="2.4"/>
        <rect x="44" y="8" width="152" height="22" fill="#B83227"/>
        <text x="120" y="23" text-anchor="middle" fill="#FFF9EE" font-size="11" font-weight="700">A · 右侧敞口外泄</text>
      `;
    } else if (choice === "B") {
      // B：四壁封合，但极厚斜框把器物死死挤住，几乎零呼吸缓冲
      frame = `
        <rect width="240" height="300" fill="#112C21"/>
        <rect x="6" y="6" width="228" height="288" fill="none" stroke="#C4A670" stroke-width="24"/>
        <rect x="30" y="30" width="180" height="240" fill="none" stroke="#173426" stroke-width="18"/>
        <rect x="52" y="72" width="136" height="150" fill="none" stroke="#D6AF6D" stroke-width="2.5"/>
      `;
      overlay = `
        <rect x="52" y="72" width="136" height="150" fill="none" stroke="#FF8373" stroke-width="2.5" stroke-dasharray="5 4"/>
        <rect x="44" y="8" width="152" height="22" fill="#B83227"/>
        <text x="120" y="23" text-anchor="middle" fill="#FFF9EE" font-size="11" font-weight="700">B · 过封窒息零留气</text>
      `;
    } else if (choice === "C") {
      // C（正确）：四边完整稳合 + 约 20% 舒朗留白 + 四角轻度向内指核
      frame = `
        <rect width="240" height="300" fill="#112C21"/>
        <rect x="18" y="18" width="204" height="264" fill="none" stroke="#C4A670" stroke-width="2.2"/>
        <rect x="26" y="26" width="188" height="248" fill="none" stroke="#C4A670" stroke-width="0.9" opacity="0.55"/>
        <polygon points="108,26 132,26 120,38" fill="#C4A670"/>
        <polygon points="108,274 132,274 120,262" fill="#C4A670"/>
        <polygon points="26,138 26,162 38,150" fill="#C4A670"/>
        <polygon points="214,138 214,162 202,150" fill="#C4A670"/>
      `;
      overlay = `
        <circle cx="120" cy="152" r="68" fill="none" stroke="#73D6A4" stroke-width="2" stroke-dasharray="5 4"/>
        <path d="M40 40 L74 74 M200 40 L166 74 M40 260 L74 226 M200 260 L166 226" stroke="#73D6A4" stroke-width="1.8"/>
        <rect x="44" y="8" width="152" height="22" fill="#1E6B47"/>
        <text x="120" y="23" text-anchor="middle" fill="#FFF9EE" font-size="11" font-weight="700">C · 围合与留气均衡</text>
      `;
    } else {
      // D：细框虽闭合，但高亮亮块贴死左下与右上对角边缘，把目光撕向四角
      frame = `
        <rect width="240" height="300" fill="#112C21"/>
        <rect x="18" y="18" width="204" height="264" fill="none" stroke="#C4A670" stroke-width="1.6"/>
        <rect x="164" y="18" width="58" height="44" fill="#D6A354"/>
        <rect x="18" y="238" width="58" height="44" fill="#D6A354"/>
        <line x1="164" y1="62" x2="222" y2="18" stroke="#112C21" stroke-width="2"/>
      `;
      overlay = `
        <path d="M120 152 L192 40 M120 152 L48 260" stroke="#FF8373" stroke-width="2.2" stroke-dasharray="5 4"/>
        <rect x="44" y="8" width="152" height="22" fill="#B83227"/>
        <text x="120" y="23" text-anchor="middle" fill="#FFF9EE" font-size="11" font-weight="700">D · 贴边高亮挂角抢戏</text>
      `;
    }

    return `${frame}${baseVessel}${reveal ? overlay : ""}`;
  }

  const EXPLAIN = {
    A: {
      title: "再想想：你选的 A 漏出了一条「逃生口」",
      body: "A 的右侧边框刻意断开，且内角线朝右外张，观者的视线会顺着右侧缺口直接滑出封面——它已经偏向 091 开放式构图。正确答案是 C：四边完整闭合、四向轻楔向内折返，且留足约 20% 的核周呼吸余量。",
    },
    B: {
      title: "再想想：你选的 B 犯了「过封成笼」",
      body: "B 虽然四边严丝合缝，但极厚的金绿叠框一路压到青铜樽边缘，核周几乎没有喘息空间，让人先感到逼仄和沉重。正确答案是 C：稳定来自清晰的边界与从容的留白，而不是越粗越紧。",
    },
    C: {
      title: "判断精准：C 是唯一同时守住围合、内引与留气的版本",
      body: "C 的四边双细线完整封界、四枚小金楔温和向内指核，同时在青铜樽与框壁之间留出舒朗缓冲。对比之下：A 右侧开口漏气，B 粗墙挤压窒息，D 两枚高亮色块贴死对角边缘抢走了中心重心。",
    },
    D: {
      title: "再想想：你选的 D 被边缘亮块撕散了重心",
      body: "D 虽有闭合细框，但右上和左下两枚高饱和亮金块死死贴在角边，把目光生生拽向对角，破坏了整体向内收束。正确答案是 C：所有元素都服务于中心器物，不设贴边抢戏的次焦点。",
    },
  };

  function render() {
    const revealed = picked !== null;
    for (const card of cards) {
      const ch = card.dataset.choice;
      card.querySelector("svg").innerHTML = plateSvg(ch, revealed);
      card.setAttribute("aria-pressed", String(picked === ch));
      card.classList.toggle("is-picked", picked === ch);
      card.classList.toggle("is-right", revealed && ch === CORRECT);
      card.classList.toggle("is-wrong", revealed && picked === ch && ch !== CORRECT);
    }

    if (!revealed) {
      verdict.classList.remove("is-right", "is-wrong");
      vTitle.textContent = "先选一版，看看视线会往哪走。";
      vBody.textContent = "选完以后，四版封面会同时亮起隐藏的视线轨迹与呼吸余量线，逐一拆解每一版的差别。";
      btnReset.hidden = true;
    } else {
      const ok = picked === CORRECT;
      verdict.classList.toggle("is-right", ok);
      verdict.classList.toggle("is-wrong", !ok);
      vTitle.textContent = EXPLAIN[picked].title;
      vBody.textContent = EXPLAIN[picked].body;
      btnReset.hidden = false;
    }
  }

  for (const card of cards) {
    card.addEventListener("click", () => {
      picked = card.dataset.choice;
      render();
    });
  }
  btnReset?.addEventListener("click", () => {
    picked = null;
    render();
  });

  render();
}

// ==================== 07 原海报灯箱（点击放大、拖拽平移、Esc 关） ====================
export function mountPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-btn");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbViewport = document.getElementById("lb-viewport");
  const lbZoom = document.getElementById("lb-zoom");
  const lbClose = document.getElementById("lb-close");
  if (!poster || !openBtn || !lb) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbZoom.textContent = scale > 1 ? "恢复 100%" : "放大至 180%";
  }

  function open() {
    lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    lbClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  lbClose.addEventListener("click", close);
  lbZoom.addEventListener("click", () => {
    scale = scale > 1 ? 1 : 1.8;
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  lbViewport.addEventListener("pointerdown", (e) => {
    if (e.target === lbViewport && scale === 1) {
      close();
      return;
    }
    drag = { x: e.clientX, y: e.clientY, tx, ty };
    lbViewport.classList.add("is-dragging");
    try { lbViewport.setPointerCapture(e.pointerId); } catch {}
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    applyTransform();
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    drag = null;
    lbViewport.classList.remove("is-dragging");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
