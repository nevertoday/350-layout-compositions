// 136 非对称跨页 —— 第 01 / 02 / 04 / 05 / 06 / 07 节专属交互模块
// 相邻两节控件完全不同：
// 01: SVG 视觉杠杆材质筹码实验器
// 02: 左右卷帘对比幕 + 三要点切换
// 03: (见 gutterCanvas.js) 2D Canvas 书脊弯折透视模拟器
// 04: 百年设计史年代印章文献展柜 + 版式骨架缩略图
// 05: 出版物特征体检选择器
// 06: 四选一单一变量小练习
// 07: 原海报全屏缩放拖拽灯箱

import { clamp } from "./model.js";

// ---------- 01 节：视觉杠杆与材质配重实验器 ----------
const CHIPS = {
  coral: {
    name: "高饱和珊瑚朱红",
    en: "WARM CORAL",
    color: "#ED6042",
    density: 2.35,
    size: 24,
    note: "暖色前进且饱和度极高，虽然体量只有左侧蓝块的约五分之一，拉开力臂后却能稳稳托平整架天平。",
  },
  blue: {
    name: "同色深群青小块",
    en: "DEEP COBALT",
    color: "#2250CD",
    density: 1.35,
    size: 28,
    note: "冷色在视知觉中略向后退，单位光学重量不及暖色珊瑚红，需要推得更远才能勉强拉住左端大色块。",
  },
  gray: {
    name: "暖灰图像小框",
    en: "WARM GRAY",
    color: "#B9B4AA",
    density: 0.78,
    size: 32,
    note: "明度与暖米纸接近、色相中性，即使放到右端外切边，单靠浅灰小框也很难对抗左页的大面积深蓝。",
  },
  ink: {
    name: "细密纯黑排线块",
    en: "FINE TEXT BLOCK",
    color: "#1B283C",
    density: 1.55,
    size: 26,
    note: "深墨高对比的小块文字群有很强的局部聚合力，配合外侧大片留白同样能构成冷静理性的视觉锚点。",
  },
};

export function initLeverSection() {
  const beam = document.getElementById("s1-beam");
  const rightChip = document.getElementById("s1-right-chip");
  const armRange = document.getElementById("s1-arm-range");
  const armVal = document.getElementById("s1-arm-val");
  const torqueBadge = document.getElementById("s1-torque-badge");
  const explainEl = document.getElementById("s1-explain");
  const chipBtns = [...document.querySelectorAll("[data-chip]")];
  if (!beam || !armRange) return;

  let curChip = "coral";
  let arm = 76; // 右侧力臂 20..100（代表距书脊支点距离）

  // 左侧固定：大体量深蓝块（面积大、离支点较近：面积 3.6 × 密度 1.15 × 力臂 42 ≈ 174 示意力矩）
  const LEFT_TORQUE = 174;

  function render() {
    const ch = CHIPS[curChip];
    const rightTorque = 1.0 * ch.density * arm;
    const diff = rightTorque - LEFT_TORQUE;
    const norm = clamp(diff / LEFT_TORQUE, -1, 1);
    const angle = clamp(norm * 16, -15, 15);

    beam.setAttribute("transform", `rotate(${angle.toFixed(1)} 280 124)`);
    const rx = 280 + (arm / 100) * 195;
    rightChip.setAttribute("x", (rx - ch.size * 0.5).toFixed(1));
    rightChip.setAttribute("y", (118 - ch.size).toFixed(1));
    rightChip.setAttribute("width", String(ch.size));
    rightChip.setAttribute("height", String(ch.size));
    rightChip.setAttribute("fill", ch.color);

    armVal.textContent = `${arm}% 外延力臂`;

    let statusText = "";
    let statusClass = "is-bad";
    if (Math.abs(norm) <= 0.14) {
      statusText = "动态平衡成立（示意）";
      statusClass = "is-ok";
    } else if (norm < 0) {
      statusText = `左端蓝块沉坠 ${Math.round(norm * 100)}%（示意）`;
    } else {
      statusText = `右端配重压过头 +${Math.round(norm * 100)}%（示意）`;
    }

    torqueBadge.textContent = statusText;
    torqueBadge.className = `s1-badge ${statusClass}`;
    explainEl.textContent = `${ch.name}（力臂 ${arm}%）：${ch.note}`;

    for (const b of chipBtns) {
      const on = b.dataset.chip === curChip;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  for (const b of chipBtns) {
    b.addEventListener("click", () => {
      curChip = b.dataset.chip;
      render();
    });
  }
  armRange.addEventListener("input", () => {
    arm = Number(armRange.value);
    render();
  });

  render();
}

// ---------- 02 节：图像与留白的对话 · 左右卷帘对比幕 ----------
const CURTAIN_MODES = {
  dialogue: {
    zh: "图像与留白的对话",
    en: "DIALOGUE BETWEEN IMAGE AND WHITE SPACE",
    badLabel: "满塞无呼吸 · 留白 14%",
    goodLabel: "主图配大留白 · 留白 49%",
    note: "左幕把跨页塞得不留缝隙，图片和字互相抢空气；拉开右幕后，大块暖米留白反过来成了衬托图像体积感的「第二主体」，这正是布罗多维奇所说的「乐谱休止符」。",
  },
  rhythm: {
    zh: "细节与节奏",
    en: "DETAIL AND RHYTHM",
    badLabel: "均分等高排 · 节奏单一",
    goodLabel: "1宽2窄阶梯 · 疏密交替",
    note: "136 原海报右页并非随手堆字：先用一条通宽摘要托住图像，再一分为二切出紧凑排线与小图示，一宽一窄的落差让眼睛有快有慢。",
  },
  guide: {
    zh: "引导视线",
    en: "GUIDE THE EYE",
    badLabel: "孤立僵平 · 视线停在左页",
    goodLabel: "橙点 → 蓝方 · 对角牵引",
    note: "视线不会凭空跨过装订线。通过左上/左下重块与右页高饱和珊瑚锚点形成对角张力，读者的目光会被自然拉过书脊中缝，完成整幅跨页扫视。",
  },
};

export function initCurtainSection() {
  const wrap = document.getElementById("s2-curtain");
  const topLayer = document.getElementById("s2-top-layer");
  const divider = document.getElementById("s2-divider");
  const range = document.getElementById("s2-range");
  const noteEl = document.getElementById("s2-note");
  const badTag = document.getElementById("s2-bad-tag");
  const goodTag = document.getElementById("s2-good-tag");
  const modeBtns = [...document.querySelectorAll("[data-curtain-mode]")];
  const badSvgWrap = document.getElementById("s2-svg-bad");
  const goodSvgWrap = document.getElementById("s2-svg-good");
  if (!wrap || !range) return;

  let mode = "dialogue";
  let split = 54;
  let dragging = false;

  function renderSvgs() {
    if (mode === "dialogue") {
      badSvgWrap.innerHTML = `
        <svg viewBox="0 0 600 340" aria-hidden="true">
          <rect width="600" height="340" fill="#EAE3D6"/>
          <rect x="18" y="18" width="272" height="304" fill="#2250CD"/>
          <rect x="310" y="18" width="272" height="142" fill="#C7C3BE"/>
          <g fill="#424D5E">
            <rect x="310" y="172" width="272" height="10"/><rect x="310" y="190" width="265" height="10"/>
            <rect x="310" y="208" width="272" height="10"/><rect x="310" y="226" width="260" height="10"/>
            <rect x="310" y="244" width="272" height="10"/><rect x="310" y="262" width="272" height="10"/>
            <rect x="310" y="280" width="268" height="10"/><rect x="310" y="298" width="240" height="10"/>
          </g>
          <line x1="300" y1="0" x2="300" y2="340" stroke="#495364" stroke-dasharray="5 5" stroke-width="1.5"/>
        </svg>`;
      goodSvgWrap.innerHTML = `
        <svg viewBox="0 0 600 340" aria-hidden="true">
          <rect width="600" height="340" fill="#EFE8DD"/>
          <ellipse cx="40" cy="170" rx="258" ry="155" fill="#2250CD"/>
          <rect x="355" y="72" width="196" height="118" fill="#DDDAD0"/>
          <polygon points="355,190 422,126 456,154 498,108 551,190" fill="#C7C3BE"/>
          <circle cx="394" cy="108" r="13" fill="#C1BDB7"/>
          <rect x="355" y="212" width="9" height="9" fill="#ED6042"/>
          <rect x="372" y="213" width="110" height="7" fill="#091928"/>
          <rect x="355" y="232" width="196" height="4" fill="#6F7785"/>
          <rect x="355" y="244" width="152" height="4" fill="#6F7785"/>
          <path d="M 412 340 A 56 56 0 0 1 524 340 Z" fill="#ED6042"/>
          <line x1="300" y1="0" x2="300" y2="340" stroke="#495364" stroke-dasharray="5 5" stroke-width="1.5"/>
          <circle cx="300" cy="170" r="6" fill="#091928"/>
        </svg>`;
    } else if (mode === "rhythm") {
      badSvgWrap.innerHTML = `
        <svg viewBox="0 0 600 340" aria-hidden="true">
          <rect width="600" height="340" fill="#EAE3D6"/>
          <rect x="32" y="34" width="246" height="125" fill="#2250CD"/>
          <rect x="32" y="180" width="246" height="125" fill="#C7C3BE"/>
          <rect x="322" y="34" width="246" height="125" fill="#C7C3BE"/>
          <rect x="322" y="180" width="246" height="125" fill="#8C939E"/>
          <line x1="300" y1="0" x2="300" y2="340" stroke="#495364" stroke-dasharray="5 5" stroke-width="1.5"/>
        </svg>`;
      goodSvgWrap.innerHTML = `
        <svg viewBox="0 0 600 340" aria-hidden="true">
          <rect width="600" height="340" fill="#EFE8DD"/>
          <ellipse cx="40" cy="170" rx="258" ry="155" fill="#2250CD"/>
          <rect x="352" y="42" width="206" height="94" fill="#DDDAD0"/>
          <line x1="352" y1="150" x2="558" y2="150" stroke="#495364" stroke-width="1.2"/>
          <rect x="352" y="164" width="9" height="9" fill="#ED6042"/>
          <rect x="368" y="166" width="188" height="5" fill="#091928"/>
          <rect x="352" y="184" width="206" height="3" fill="#6F7785"/>
          <rect x="352" y="196" width="206" height="3" fill="#6F7785"/>
          <line x1="352" y1="212" x2="558" y2="212" stroke="#C5BEB0" stroke-width="1"/>
          <line x1="454" y1="224" x2="454" y2="306" stroke="#C5BEB0" stroke-width="1"/>
          <rect x="352" y="226" width="8" height="8" fill="#ED6042"/>
          <rect x="352" y="246" width="86" height="3" fill="#495364"/>
          <rect x="352" y="258" width="86" height="3" fill="#495364"/>
          <rect x="352" y="270" width="86" height="3" fill="#495364"/>
          <rect x="352" y="282" width="66" height="3" fill="#495364"/>
          <rect x="470" y="226" width="88" height="72" fill="none" stroke="#495364" stroke-width="1"/>
          <circle cx="488" cy="244" r="6" fill="#ED6042"/>
          <line x1="494" y1="248" x2="536" y2="278" stroke="#091928" stroke-width="1.2"/>
          <rect x="536" y="275" width="10" height="10" fill="#2250CD"/>
          <line x1="300" y1="0" x2="300" y2="340" stroke="#495364" stroke-dasharray="5 5" stroke-width="1.5"/>
          <circle cx="300" cy="170" r="6" fill="#091928"/>
        </svg>`;
    } else {
      badSvgWrap.innerHTML = `
        <svg viewBox="0 0 600 340" aria-hidden="true">
          <rect width="600" height="340" fill="#EAE3D6"/>
          <rect x="44" y="64" width="212" height="212" fill="#2250CD"/>
          <rect x="344" y="64" width="212" height="212" fill="#C7C3BE"/>
          <line x1="150" y1="170" x2="150" y2="170" stroke="#B5231C" stroke-width="4"/>
          <circle cx="150" cy="170" r="24" fill="none" stroke="#ED6042" stroke-width="2" stroke-dasharray="4 4"/>
          <line x1="300" y1="0" x2="300" y2="340" stroke="#495364" stroke-dasharray="5 5" stroke-width="1.5"/>
        </svg>`;
      goodSvgWrap.innerHTML = `
        <svg viewBox="0 0 600 340" aria-hidden="true">
          <rect width="600" height="340" fill="#EFE8DD"/>
          <ellipse cx="42" cy="170" rx="260" ry="155" fill="#2250CD"/>
          <rect x="366" y="54" width="186" height="114" fill="#DDDAD0"/>
          <path d="M 418 340 A 56 56 0 0 1 530 340 Z" fill="#ED6042"/>
          <path d="M 140 165 C 235 165, 290 140, 456 112 C 495 160, 488 232, 474 294" fill="none" stroke="#ED6042" stroke-width="3" stroke-dasharray="7 5"/>
          <circle cx="140" cy="165" r="8" fill="#FAF6EE" stroke="#ED6042" stroke-width="3"/>
          <circle cx="300" cy="151" r="6" fill="#091928"/>
          <circle cx="456" cy="112" r="7" fill="#ED6042"/>
          <rect x="466" y="294" width="14" height="14" fill="#2250CD" stroke="#FAF6EE" stroke-width="2"/>
          <line x1="300" y1="0" x2="300" y2="340" stroke="#495364" stroke-dasharray="5 5" stroke-width="1.5"/>
        </svg>`;
    }
  }

  function update() {
    const info = CURTAIN_MODES[mode];
    topLayer.style.clipPath = `inset(0 ${100 - split}% 0 0)`;
    divider.style.left = `${split}%`;
    range.value = String(split);
    badTag.textContent = info.badLabel;
    goodTag.textContent = info.goodLabel;
    noteEl.textContent = info.note;
    for (const b of modeBtns) {
      const on = b.dataset.curtainMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  function setFromClientX(clientX) {
    const r = wrap.getBoundingClientRect();
    split = Math.round(clamp(((clientX - r.left) / r.width) * 100, 8, 92));
    update();
  }

  wrap.addEventListener("mousedown", (e) => {
    dragging = true;
    setFromClientX(e.clientX);
  });
  window.addEventListener("mousemove", (e) => {
    if (dragging) setFromClientX(e.clientX);
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
  });
  divider.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        dragging = true;
        setFromClientX(e.touches[0].clientX);
      }
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (dragging && e.touches.length === 1) {
        e.preventDefault();
        setFromClientX(e.touches[0].clientX);
      }
    },
    { passive: false }
  );
  window.addEventListener("touchend", () => {
    dragging = false;
  });

  range.addEventListener("input", () => {
    split = Number(range.value);
    update();
  });

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      mode = b.dataset.curtainMode;
      renderSvgs();
      update();
    });
  }

  renderSvgs();
  update();
}

// ---------- 04 节：百年非对称革命 · 年代印章文献展柜 ----------
const HISTORY_ITEMS = {
  1928: {
    year: "1928",
    who: "扬·奇肖尔德（Jan Tschichold）",
    work: "《新字体排印》（Die neue Typographie），柏林德国印刷工人教育协会初版；1995 年加州大学出版社英译本",
    summary:
      "奇肖尔德在书中正面挑战文艺复兴以来的中轴对称传统，主张用「非对称动态平衡」取代僵化居中：按信息主次把版面拉开重量差，用无衬线体与主动留白服务阅读效率。",
    quote: "现代排版的秩序来自内容本身的功能层级，而不是把每一行机械地钉在书页中轴上。",
    svg: `<svg viewBox="0 0 320 180" aria-hidden="true">
      <rect width="320" height="180" fill="#F7F3EC" stroke="#C5BEB0"/>
      <line x1="160" y1="0" x2="160" y2="180" stroke="#727C8C" stroke-dasharray="4 4"/>
      <rect x="20" y="24" width="126" height="22" fill="#091928"/>
      <rect x="20" y="56" width="84" height="5" fill="#ED6042"/>
      <rect x="20" y="76" width="118" height="4" fill="#495364"/>
      <rect x="20" y="88" width="96" height="4" fill="#495364"/>
      <rect x="196" y="48" width="102" height="92" fill="#2250CD"/>
      <circle cx="196" cy="30" r="7" fill="#ED6042"/>
    </svg>`,
  },
  1934: {
    year: "1934–1958",
    who: "阿列克谢·布罗多维奇（Alexey Brodovitch）",
    work: "《时尚芭莎》（Harper's Bazaar）艺术总监，1987 年获 AIGA 奖章",
    summary:
      "布罗多维奇把杂志的对开双页视作同一块电影银幕，打破两页各自为政的旧习：一页铺满剧烈裁切的出血摄影，对页大胆留出大面积洁净空白，把留白当作乐谱里的休止符，制造出强烈的翻页节奏。",
    quote: "杂志跨页不是两张单页的拼贴，而是一次连贯的视觉蒙太奇。",
    svg: `<svg viewBox="0 0 320 180" aria-hidden="true">
      <rect width="320" height="180" fill="#F7F3EC" stroke="#C5BEB0"/>
      <rect x="0" y="0" width="194" height="180" fill="#1B3F9E"/>
      <line x1="160" y1="0" x2="160" y2="180" stroke="#FAF6EE" stroke-dasharray="4 4"/>
      <rect x="220" y="112" width="74" height="5" fill="#091928"/>
      <rect x="220" y="124" width="58" height="4" fill="#6F7785"/>
      <rect x="220" y="134" width="68" height="4" fill="#6F7785"/>
      <circle cx="282" cy="34" r="10" fill="#ED6042"/>
    </svg>`,
  },
  1954: {
    year: "1954",
    who: "鲁道夫·阿恩海姆（Rudolf Arnheim）",
    work: "《艺术与视知觉》（Art and Visual Perception），加州大学出版社 1954 年初版，1974 年修订版",
    summary:
      "格式塔心理学家阿恩海姆在首章《平衡》中提出：画面存在隐性的知觉力场，元素的「视觉重量」由面积、明度、色彩冷暖、孤立程度和距中心力臂共同决定。这为非对称跨页的「以小搏大」提供了清晰的视知觉依据。",
    quote: "平衡不等于对称；当不同位置与重量的知觉力量彼此抵消时，画面便稳住且充满生机。",
    svg: `<svg viewBox="0 0 320 180" aria-hidden="true">
      <rect width="320" height="180" fill="#F7F3EC" stroke="#C5BEB0"/>
      <line x1="160" y1="0" x2="160" y2="180" stroke="#727C8C" stroke-dasharray="4 4"/>
      <circle cx="96" cy="90" r="44" fill="#2250CD"/>
      <circle cx="276" cy="90" r="16" fill="#ED6042"/>
      <line x1="96" y1="150" x2="276" y2="150" stroke="#091928" stroke-width="2"/>
      <polygon points="160,152 153,164 167,164" fill="#091928"/>
    </svg>`,
  },
  1981: {
    year: "1981",
    who: "约瑟夫·米勒-布罗克曼（Josef Müller-Brockmann）",
    work: "《平面设计中的网格系统》（Grid Systems in Graphic Design / Rastersysteme für die visuelle Gestaltung），瑞士 Niggli 出版社",
    summary:
      "米勒-布罗克曼把瑞士国际主义排版凝练成跨页多栏网格体系：即便双页不镜像对称，所有主图、图注与宽窄文字阶梯仍严丝合缝落在同一套数学网格线上，使「不对称」兼具自由张力与工业秩序。",
    quote: "非对称的自由不是脱纲乱摆，而是在同一套隐性网格上做有节制的重心偏移。",
    svg: `<svg viewBox="0 0 320 180" aria-hidden="true">
      <rect width="320" height="180" fill="#F7F3EC" stroke="#C5BEB0"/>
      <g stroke="#D9D3C7" stroke-width="1">
        <line x1="40" y1="0" x2="40" y2="180"/><line x1="80" y1="0" x2="80" y2="180"/>
        <line x1="120" y1="0" x2="120" y2="180"/><line x1="200" y1="0" x2="200" y2="180"/>
        <line x1="240" y1="0" x2="240" y2="180"/><line x1="280" y1="0" x2="280" y2="180"/>
        <line x1="0" y1="45" x2="320" y2="45"/><line x1="0" y1="90" x2="320" y2="90"/><line x1="0" y1="135" x2="320" y2="135"/>
      </g>
      <line x1="160" y1="0" x2="160" y2="180" stroke="#495364" stroke-dasharray="4 4"/>
      <rect x="40" y="45" width="120" height="90" fill="#2250CD"/>
      <rect x="200" y="45" width="80" height="45" fill="#DDDAD0"/>
      <rect x="240" y="135" width="40" height="22" fill="#ED6042"/>
    </svg>`,
  },
};

export function initHistorySection() {
  const btns = [...document.querySelectorAll("[data-year]")];
  const yearEl = document.getElementById("s4-year");
  const whoEl = document.getElementById("s4-who");
  const workEl = document.getElementById("s4-work");
  const sumEl = document.getElementById("s4-summary");
  const quoteEl = document.getElementById("s4-quote");
  const svgEl = document.getElementById("s4-svg");
  if (!btns.length || !yearEl) return;

  function select(key) {
    const item = HISTORY_ITEMS[key];
    if (!item) return;
    yearEl.textContent = item.year;
    whoEl.textContent = item.who;
    workEl.textContent = item.work;
    sumEl.textContent = item.summary;
    quoteEl.textContent = item.quote;
    svgEl.innerHTML = item.svg;
    for (const b of btns) {
      const on = b.dataset.year === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    }
  }

  for (const b of btns) {
    b.addEventListener("click", () => select(b.dataset.year));
  }
  select("1928");
}

// ---------- 05 节：什么时候别用 · 出版物场景体检选择器 ----------
const SCENARIOS = {
  bilingual: {
    verdict: "别硬用非对称跨页 · 改用对称跨页或双栏版式",
    tone: "warn",
    reason:
      "法律条文、双语对照与工具辞典需要读者左右逐行比对。重心一旦偏移，眼睛来回核对的水平距离和层级感都会被打乱，反而增加查错成本。",
    altHtml:
      '建议改看 <a href="https://layout.xiaoxiaodong.ai/135/play/" target="_blank" rel="noopener">135 对称跨页</a> 或 <a href="https://layout.xiaoxiaodong.ai/133/play/" target="_blank" rel="noopener">133 双栏版式</a>。',
  },
  monograph: {
    verdict: "非常契合非对称跨页",
    tone: "ok",
    reason:
      "摄影画册、建筑专刊和时尚特辑天然拥有强体量反差（大片摄影 vs 短注与题名），并且采用锁线平摊或骑马订，极适合用大留白和暖色锚点营造跨页张力。",
    altHtml:
      '若需要整张超宽全景横贯双页，也可配合 <a href="https://layout.xiaoxiaodong.ai/137/play/" target="_blank" rel="noopener">137 通版跨页</a> 与 <a href="https://layout.xiaoxiaodong.ai/138/play/" target="_blank" rel="noopener">138 满出血版式</a> 穿插使用。',
  },
  mobile: {
    verdict: "慎用 · 单页窄屏失去了「跨页同时展开」的前提",
    tone: "warn",
    reason:
      "非对称跨页靠左右两页同时进入视野才能成立力矩平衡。若发布在竖屏单页传单或手机长图文里，左右两半被上下折断后，原本的刻意偏置只会变成莫名其妙的「没居中」。",
    altHtml:
      '单幅竖流优先考虑 <a href="https://layout.xiaoxiaodong.ai/132/play/" target="_blank" rel="noopener">132 单栏版式</a> 或清晰留框的 <a href="https://layout.xiaoxiaodong.ai/139/play/" target="_blank" rel="noopener">139 无出血版式</a>。',
  },
  catalog: {
    verdict: "别硬做非对称 · 缺乏体量差只会显得凌乱",
    tone: "warn",
    reason:
      "全文字财务年报、价目目录或纯文字长篇小说里，每一项内容权重几乎相等。强行把一部分正文挪偏，读者只会以为排版跑位，而不是感受艺术张力。",
    altHtml:
      '信息项繁多且需高密度组织时，请转用 <a href="https://layout.xiaoxiaodong.ai/134/play/" target="_blank" rel="noopener">134 多栏版式</a>。',
  },
};

export function initWhenNotSection() {
  const btns = [...document.querySelectorAll("[data-scenario]")];
  const verdictEl = document.getElementById("s5-verdict");
  const reasonEl = document.getElementById("s5-reason");
  const altEl = document.getElementById("s5-alt");
  const box = document.getElementById("s5-result");
  if (!btns.length || !verdictEl) return;

  function select(id) {
    const sc = SCENARIOS[id];
    if (!sc) return;
    verdictEl.textContent = sc.verdict;
    reasonEl.textContent = sc.reason;
    altEl.innerHTML = sc.altHtml;
    box.className = `s5-result is-${sc.tone}`;
    for (const b of btns) {
      const on = b.dataset.scenario === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  for (const b of btns) {
    b.addEventListener("click", () => select(b.dataset.scenario));
  }
  select("bilingual");
}

// ---------- 06 节：小练习（严格 A/B/C/D 中性选项，仅差右页配重与留白单一变量） ----------
const QUIZ = {
  answer: "C",
  feedback: {
    A: {
      ok: false,
      title: "选 A 不够稳：重心偏了，但右页全部挤向书脊",
      detail:
        "A 版左页压着大面积群青主视觉，右页的图块与文字却全部堆在书脊内侧、外切边空荡且缺少高饱和暖色配重。由于右侧力臂过短，整张跨页明显向左沉坠，属于「只偏不平」。",
    },
    B: {
      ok: false,
      title: "选 B 退回了静态对称：主次张力没拉开",
      detail:
        "B 版为了求稳把左页主视觉大幅缩小，让左右两页呈等大同高排列。这样虽然不会倾斜，却失去了非对称跨页「大视觉领头、重心偏移创造张力」的本来目的。",
    },
    C: {
      ok: true,
      title: "答对了！C 版在重心偏移中建立了动态平衡",
      detail:
        "C 版保留左页 62% 的群青大主视觉作为第一落点，右页留出大片暖米呼吸空白并与暖灰中图形成对话，再在远离书脊的底缘外切角压入一颗小而浓烈的珊瑚朱红配重块——凭借更长的光学力臂与暖色前进权重，稳稳托平整个跨页。",
    },
    D: {
      ok: false,
      title: "选 D 配重过头且留白窒息：左右两页互相打架",
      detail:
        "D 版把右页暖色配重放大到几乎与左页等量，同时塞满密排文字。暖色本身比冷色更重，体积再一放大不仅会反压左页主视觉，还把图像最宝贵的留白彻底闷死。",
    },
  },
};

export function initQuizSection() {
  const btns = [...document.querySelectorAll("[data-quiz]")];
  const out = document.getElementById("s6-feedback");
  const titleEl = document.getElementById("s6-fb-title");
  const detailEl = document.getElementById("s6-fb-detail");
  const resetBtn = document.getElementById("s6-reset");
  if (!btns.length || !out) return;

  function pick(choice) {
    const fb = QUIZ.feedback[choice];
    if (!fb) return;
    out.hidden = false;
    out.className = `s6-feedback ${fb.ok ? "is-ok" : "is-bad"}`;
    titleEl.textContent = fb.title;
    detailEl.textContent = fb.detail;
    for (const b of btns) {
      const k = b.dataset.quiz;
      b.classList.remove("is-picked", "is-correct", "is-wrong");
      if (k === choice) b.classList.add("is-picked", fb.ok ? "is-correct" : "is-wrong");
      else if (k === QUIZ.answer) b.classList.add("is-correct");
      b.setAttribute("aria-pressed", String(k === choice));
    }
  }

  for (const b of btns) {
    b.addEventListener("click", () => pick(b.dataset.quiz));
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      out.hidden = true;
      for (const b of btns) {
        b.classList.remove("is-picked", "is-correct", "is-wrong");
        b.setAttribute("aria-pressed", "false");
      }
    });
  }
}

// ---------- 07 节：原海报全屏灯箱（点击放大、缩放、拖拽平移、Esc 关闭） ----------
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const trigger = document.getElementById("poster-open");
  const lightbox = document.getElementById("poster-lightbox");
  const stageImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const zoomResetBtn = document.getElementById("lightbox-zoom-reset");
  const zoomReadout = document.getElementById("lightbox-zoom-val");
  if (!posterImg || !lightbox || !stageImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  function applyTransform() {
    stageImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomReadout) zoomReadout.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    stageImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (trigger) trigger.focus();
  }

  function setScale(next) {
    scale = clamp(next, 0.8, 3.2);
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  }

  if (trigger) trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomInBtn.addEventListener("click", () => setScale(scale + 0.35));
  zoomOutBtn.addEventListener("click", () => setScale(scale - 0.35));
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  lightbox.addEventListener(
    "wheel",
    (e) => {
      if (lightbox.hidden) return;
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.2 : -0.2));
    },
    { passive: false }
  );

  stageImg.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    ox = tx;
    oy = ty;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  stageImg.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        dragging = true;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        ox = tx;
        oy = ty;
      }
    },
    { passive: true }
  );
  stageImg.addEventListener(
    "touchmove",
    (e) => {
      if (dragging && e.touches.length === 1) {
        e.preventDefault();
        tx = ox + (e.touches[0].clientX - sx);
        ty = oy + (e.touches[0].clientY - sy);
        applyTransform();
      }
    },
    { passive: false }
  );
  stageImg.addEventListener("touchend", () => {
    dragging = false;
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) close();
  });
}
