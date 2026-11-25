// 119 图底关系原则 · 01–07 节全部独立交互模块
// 每节使用不同控件形态，绝不相邻复用同一种滑杆或交互。

import { POSTER_COLORS, contrastRatio } from "./model.js";

// =========================================================================
// 01 节：共享轮廓的分层纸雕透视切换器（2D 物理平面 vs 3D 知觉分层）
// =========================================================================
export function initSection01() {
  const stage = document.getElementById("sec01-depth-stage");
  const buttons = [...document.querySelectorAll("[data-depth-mode]")];
  const caption = document.getElementById("sec01-depth-caption");
  const ownerTag = document.getElementById("sec01-owner-tag");
  if (!stage || !buttons.length) return;

  const MODES = {
    flat: {
      cls: "mode-flat",
      tag: "物理现实：同一张平面",
      text: "在纸面或像素屏幕上，深藏青与暖象牙严丝合缝地并置在同一平面里，共享同一条曲线边界，物理上根本没有前后之分。",
    },
    vase: {
      cls: "mode-vase",
      tag: "知觉分层：花瓶浮出成图",
      text: "当大脑把共享边界判给中央暖象牙区域时，花瓶立刻获得立体物感并向前浮起；深藏青退居后方，在大脑里被补成一整块连续无缝的夜幕。",
    },
    faces: {
      cls: "mode-faces",
      tag: "知觉分层：侧影浮出成图",
      text: "同一条边界瞬间倒戈归属两侧深藏青时，两张相对的剪影浮到前景，而原本的花瓶退化为在背后连续延展的暖白纸底。",
    },
  };

  function setMode(mode) {
    const cfg = MODES[mode] || MODES.vase;
    stage.classList.remove("mode-flat", "mode-vase", "mode-faces");
    stage.classList.add(cfg.cls);
    buttons.forEach((b) => {
      const active = b.dataset.depthMode === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    if (ownerTag) ownerTag.textContent = cfg.tag;
    if (caption) caption.textContent = cfg.text;
  }

  buttons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.depthMode)));
  setMode("vase");
}

// =========================================================================
// 02 节：六条格式塔线索「拔河投票卡」（逐卡点击颠倒条件，顶部实时汇总）
// =========================================================================
export function initSection02() {
  const grid = document.getElementById("sec02-cues-grid");
  const scoreDarkEl = document.getElementById("sec02-score-dark");
  const scoreLightEl = document.getElementById("sec02-score-light");
  const barDarkEl = document.getElementById("sec02-bar-dark");
  const summaryEl = document.getElementById("sec02-tug-summary");
  if (!grid) return;

  const CUES = [
    {
      id: "area",
      title: "小面积优先",
      en: "SMALLER AREA",
      source: "Rubin 1915 · Koffka 1935",
      winner: "dark", // "dark" | "light"
      explainDark: "深藏青块仅占 24%，面积明显更小，人眼毫不犹豫把它当成压在浅纸上的「图」。",
      explainLight: "面积条件反转：暖象牙块缩到 24%，深藏青铺满四周，此刻反倒是小块暖白跳出来成「图」。",
      svg: (w) =>
        w === "dark"
          ? `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#FEF9F3" stroke="#0E2044" stroke-width="1.5"/>
               <rect x="64" y="24" width="52" height="48" fill="#0E2044"/>
               <circle cx="90" cy="48" r="4" fill="#F04B00"/>
             </svg>`
          : `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#0E2044"/>
               <rect x="64" y="24" width="52" height="48" fill="#FEF9F3"/>
               <circle cx="90" cy="48" r="4" fill="#F04B00"/>
             </svg>`,
    },
    {
      id: "surround",
      title: "被包围者成图",
      en: "SURROUNDEDNESS",
      source: "Rubin 1915",
      winner: "dark",
      explainDark: "深藏青圆环把边界完全闭合在浅纸之中，被四周托举的封闭区域天然抢占前景。",
      explainLight: "深藏青扩张并合围整个画框，中央暖象牙椭圆被彻底包裹，于是亮区一跃成为前景。",
      svg: (w) =>
        w === "dark"
          ? `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#E8DED1" stroke="#0E2044" stroke-width="1.5"/>
               <ellipse cx="90" cy="48" rx="34" ry="26" fill="#0E2044"/>
             </svg>`
          : `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#0E2044"/>
               <ellipse cx="90" cy="48" rx="34" ry="26" fill="#FEF9F3"/>
             </svg>`,
    },
    {
      id: "symmetry",
      title: "对称区域优先",
      en: "SYMMETRY",
      source: "Bahnsen 1928 · Palmer 1999",
      winner: "dark",
      explainDark: "深色竖带左右镜像对称、两端整齐，而夹缝里的浅带呈不规则波折，大脑先把对称条判为实体。",
      explainLight: "改让暖象牙竖带保持镜像对称、深侧边缘变得不对称，前景身份立刻转交暖象牙柱体。",
      svg: (w) =>
        w === "dark"
          ? `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#FEF9F3" stroke="#0E2044" stroke-width="1.5"/>
               <path d="M22,0 C34,24 14,52 28,96 L58,96 C72,52 52,24 64,0 Z" fill="#0E2044"/>
               <path d="M104,0 C118,28 118,68 104,96 L146,96 C132,68 132,28 146,0 Z" fill="#0E2044"/>
             </svg>`
          : `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#0E2044"/>
               <path d="M24,0 C36,24 16,56 30,96 L58,96 C44,56 64,24 52,0 Z" fill="#FEF9F3"/>
               <path d="M100,0 C116,28 116,68 100,96 L146,96 C130,68 130,28 146,0 Z" fill="#FEF9F3"/>
             </svg>`,
    },
    {
      id: "convex",
      title: "外凸轮廓优先",
      en: "CONVEXITY",
      source: "Kanizsa & Gerbino 1976",
      winner: "dark",
      explainDark: "自然界绝大多数实体向外鼓出。当深区边缘呈连续外凸圆瓣、浅区呈内凹尖槽时，深区稳稳胜出。",
      explainLight: "翻转凹凸：暖象牙一侧向外鼓起成圆润拱瓣，深藏青退作内凹夹缝，浅区瞬间向前凸起。",
      svg: (w) =>
        w === "dark"
          ? `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#FEF9F3" stroke="#0E2044" stroke-width="1.5"/>
               <path d="M0,0 L76,0 Q108,24 76,48 Q108,72 76,96 L0,96 Z" fill="#0E2044"/>
               <path d="M180,0 L132,0 Q100,24 132,48 Q100,72 132,96 L180,96 Z" fill="#0E2044"/>
             </svg>`
          : `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#0E2044"/>
               <path d="M62,0 Q34,24 62,48 Q34,72 62,96 L118,96 Q146,72 118,48 Q146,24 118,0 Z" fill="#FEF9F3"/>
             </svg>`,
    },
    {
      id: "contrast",
      title: "强反差抢前排",
      en: "HIGHER CONTRAST",
      source: "Wagemans et al. 2012",
      winner: "dark",
      explainDark: "在中暖砂纸上，深藏青与底的亮度反差远大于浅米块，高反差边缘更快激活视觉皮层边界归属。",
      explainLight: "把底调成中深灰蓝，暖象牙亮块与底的反差反超深藏青，于是亮块率先跳到前排。",
      svg: (w) =>
        w === "dark"
          ? `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#DDD2C2" stroke="#0E2044" stroke-width="1.5"/>
               <rect x="24" y="20" width="56" height="56" fill="#0E2044"/>
               <rect x="100" y="20" width="56" height="56" fill="#F4EDE2"/>
             </svg>`
          : `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#2A3B5C"/>
               <rect x="24" y="20" width="56" height="56" fill="#182745"/>
               <rect x="100" y="20" width="56" height="56" fill="#FEF9F3"/>
             </svg>`,
    },
    {
      id: "familiar",
      title: "熟悉物形优先",
      en: "FAMILIARITY",
      source: "Peterson & Gibson 1994",
      winner: "dark",
      explainDark: "1994 年实验证实：只要轮廓像熟悉物体（如正立松树剪影），高阶记忆可在 28 毫秒内帮它夺下前景。",
      explainLight: "把熟悉的尖塔剪影换成暖象牙正立形，即便深侧面积更大，大脑仍优先把熟悉的正立亮形认作「图」。",
      svg: (w) =>
        w === "dark"
          ? `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#FEF9F3" stroke="#0E2044" stroke-width="1.5"/>
               <path d="M90,10 L114,40 L102,40 L122,68 L98,68 L98,86 L82,86 L82,68 L58,68 L78,40 L66,40 Z" fill="#0E2044"/>
             </svg>`
          : `<svg viewBox="0 0 180 96" aria-hidden="true">
               <rect width="180" height="96" fill="#0E2044"/>
               <path d="M90,10 L114,40 L102,40 L122,68 L98,68 L98,86 L82,86 L82,68 L58,68 L78,40 L66,40 Z" fill="#FEF9F3"/>
             </svg>`,
    },
  ];

  // 默认设为 4:2 混合初态，让用户真能点翻每张卡片看拔河变化
  CUES[1].winner = "light";
  CUES[4].winner = "light";

  function render() {
    grid.innerHTML = CUES.map((c, idx) => {
      const isDark = c.winner === "dark";
      return `
        <article class="cue-card" data-cue-idx="${idx}">
          <div class="cue-head">
            <div>
              <h3 class="cue-title">${c.title}</h3>
              <p class="cue-en">${c.en}</p>
            </div>
            <span class="cue-badge ${isDark ? "is-dark" : "is-light"}">${isDark ? "深侧胜出" : "浅侧胜出"}</span>
          </div>
          <div class="cue-visual">${c.svg(c.winner)}</div>
          <p class="cue-explain">${isDark ? c.explainDark : c.explainLight}</p>
          <div class="cue-foot">
            <span class="cue-src">${c.source}</span>
            <button type="button" class="cue-flip-btn" data-flip-cue="${idx}">颠倒此条件 ⇄</button>
          </div>
        </article>
      `;
    }).join("");

    const darkVotes = CUES.filter((c) => c.winner === "dark").length;
    const lightVotes = CUES.length - darkVotes;
    if (scoreDarkEl) scoreDarkEl.textContent = `深侧 ${darkVotes} 票`;
    if (scoreLightEl) scoreLightEl.textContent = `浅侧 ${lightVotes} 票`;
    if (barDarkEl) barDarkEl.style.width = `${(darkVotes / CUES.length) * 100}%`;
    if (summaryEl) {
      if (darkVotes === lightVotes) {
        summaryEl.textContent = "此刻 3 : 3 势均力敌——正是最容易触发双关反转的临界点！";
      } else if (darkVotes > lightVotes) {
        summaryEl.textContent = `深侧握有 ${darkVotes} 条线索优势，大脑会稳稳把深色区域锁成「图」。`;
      } else {
        summaryEl.textContent = `浅侧握有 ${lightVotes} 条线索优势，暖象牙区域跃升为画面的「图」。`;
      }
    }
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-flip-cue]");
    if (!btn) return;
    const idx = Number(btn.dataset.flipCue);
    CUES[idx].winner = CUES[idx].winner === "dark" ? "light" : "dark";
    render();
  });

  render();
}

// =========================================================================
// 03 节（深藏青暗室）：WCAG 2.1 真实对比度实验室 + 负空间字距游标
// =========================================================================
export function initSection03() {
  const presetsWrap = document.getElementById("sec03-contrast-presets");
  const cardPreview = document.getElementById("sec03-card-preview");
  const ratioEl = document.getElementById("sec03-ratio-val");
  const gradeNormalEl = document.getElementById("sec03-grade-normal");
  const gradeLargeEl = document.getElementById("sec03-grade-large");
  const noteEl = document.getElementById("sec03-contrast-note");

  const PRESETS = [
    {
      id: "poster",
      label: "原海报 · 藏青配象牙",
      fg: "#0E2044",
      bg: "#FEF9F3",
      note: (r) => `119 原海报主配色：高达 ${r}:1，微暖象牙纸比刺眼纯白更柔和耐读，正文与细线全线过审。`,
    },
    {
      id: "sand",
      label: "原海报 · 藏青配米砂",
      fg: "#0E2044",
      bg: "#E8DED1",
      note: (r) => `原海报下方嵌套方框色系：${r}:1，纸感更沉稳，适合大块背景衬托深色主体。`,
    },
    {
      id: "fog",
      label: "翻车 · 浅灰字配暖白",
      fg: "#A0A6B0",
      bg: "#FEF9F3",
      note: (r) => `常见「性冷淡风」误区：对比度仅 ${r}:1，正文和 3.0:1 图形门槛全部失守，阳光下几乎消失。`,
    },
    {
      id: "vibrate",
      label: "翻车 · 等亮红配绿",
      fg: "#D92B2B",
      bg: "#1F9E4A",
      note: (r) => `色相大相径庭但相对亮度接近（仅 ${r}:1），互补高饱和直接触发边缘视觉震颤，极其刺眼。`,
    },
    {
      id: "darkmode",
      label: "暗室反白 · 象牙配深蓝",
      fg: "#FEF9F3",
      bg: "#0A1733",
      note: (r) => `暗底反白必须把亮度差拉足（${r}:1），且略降纯白为微暖象牙，减轻光晕炫目（halation）。`,
    },
  ];

  function applyPreset(id) {
    const p = PRESETS.find((x) => x.id === id) || PRESETS[0];
    const ratio = contrastRatio(p.fg, p.bg);
    if (cardPreview) {
      // 使用 SVG 渲染对比度标本卡：既忠实演示 1.3:1 红绿震颤与 2.3:1 浅灰雾，又确保外部页面文字 100% 满足可读标准
      cardPreview.innerHTML = `
        <svg viewBox="0 0 460 156" role="img" aria-label="对比度标本预览：前景色 ${p.fg}，背景色 ${p.bg}，对比度 ${ratio.toFixed(1)} 比 1">
          <rect x="1" y="1" width="458" height="154" fill="${p.bg}" stroke="${p.fg}" stroke-width="2"/>
          <text x="22" y="34" fill="${p.fg}" font-family="Syne, sans-serif" font-size="13" font-weight="700" letter-spacing="2">FIGURE / GROUND</text>
          <text x="438" y="38" text-anchor="end" fill="${p.fg}" font-family="JetBrains Mono, monospace" font-size="24" font-weight="600">${ratio.toFixed(1)} : 1</text>
          <text x="22" y="82" fill="${p.fg}" font-family="Noto Sans SC, sans-serif" font-size="23" font-weight="900">先拉开亮度，再谈色彩气质</text>
          <text x="22" y="114" fill="${p.fg}" font-family="Noto Sans SC, sans-serif" font-size="14" font-weight="500">哪怕两个色相截然不同，只要相对亮度接近，</text>
          <text x="22" y="136" fill="${p.fg}" font-family="Noto Sans SC, sans-serif" font-size="14" font-weight="500">字形轮廓依然会融进背景里难以辨认。</text>
        </svg>`;
    }
    if (ratioEl) ratioEl.textContent = `实测 ${ratio.toFixed(1)} : 1`;
    if (gradeNormalEl) {
      const ok = ratio >= 4.5;
      gradeNormalEl.textContent = ok ? "✓ 正文 4.5:1 达标" : "× 正文未达 4.5:1";
      gradeNormalEl.className = `wcag-pill ${ok ? "is-pass" : "is-fail"}`;
    }
    if (gradeLargeEl) {
      const ok = ratio >= 3.0;
      gradeLargeEl.textContent = ok ? "✓ 大字/图形 3.0:1 达标" : "× 大字/图形未达 3.0:1";
      gradeLargeEl.className = `wcag-pill ${ok ? "is-pass" : "is-fail"}`;
    }
    if (noteEl) noteEl.textContent = p.note(ratio.toFixed(1));

    if (presetsWrap) {
      presetsWrap.querySelectorAll("button").forEach((b) => {
        const active = b.dataset.cp === p.id;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
    }
  }

  if (presetsWrap) {
    presetsWrap.innerHTML = PRESETS.map(
      (p) =>
        `<button type="button" class="dark-chip" data-cp="${p.id}" aria-pressed="false">
           <span class="swatch-pair"><i style="background:${p.fg}"></i><i style="background:${p.bg}"></i></span>
           ${p.label}
         </button>`
    ).join("");
    presetsWrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cp]");
      if (b) applyPreset(b.dataset.cp);
    });
    applyPreset("fog"); // 默认先落在一个低对比翻车色，诱导用户切换体会差异
  }

  // 右侧：负空间字距游标（致敬 1994 FedEx E-x 负空间箭头机制）
  const kerningInput = document.getElementById("sec03-kerning");
  const kerningVal = document.getElementById("sec03-kerning-val");
  const kerningStatus = document.getElementById("sec03-kerning-status");
  const glyphRight = document.getElementById("sec03-glyph-x");
  const arrowGlow = document.getElementById("sec03-arrow-outline");
  const revealBtn = document.getElementById("sec03-reveal-arrow");
  let revealOn = false;

  function updateKerning() {
    if (!kerningInput || !glyphRight) return;
    const gap = Number(kerningInput.value); // 0..38，10..15 是精准咬合区
    // 基准位置：gap = 12 时右字块 X 的左凹 V 槽严密扣住 E 的中臂形成清晰向右箭头
    const dx = gap - 12;
    glyphRight.setAttribute("transform", `translate(${dx}, 0)`);
    if (kerningVal) kerningVal.textContent = `${gap} px`;

    const locked = gap >= 9 && gap <= 16;
    if (arrowGlow) {
      arrowGlow.style.opacity = revealOn || locked ? (locked ? "0.95" : "0.45") : "0";
      arrowGlow.setAttribute("transform", `translate(${dx * 0.45}, 0)`);
    }
    if (kerningStatus) {
      if (gap < 9) {
        kerningStatus.textContent = "字距过挤：两笔粘连，负空间箭头被夹扁。";
        kerningStatus.className = "kern-status is-bad";
      } else if (gap > 16) {
        kerningStatus.textContent = "字距过宽：缝隙敞开，空白退化成散漫背景。";
        kerningStatus.className = "kern-status is-bad";
      } else {
        kerningStatus.textContent = "✓ 精准咬合：两字之间的负空间锁出一支锐利向右箭头！";
        kerningStatus.className = "kern-status is-good";
      }
    }
  }

  if (kerningInput) {
    kerningInput.addEventListener("input", updateKerning);
    updateKerning();
  }
  if (revealBtn) {
    revealBtn.addEventListener("click", () => {
      revealOn = !revealOn;
      revealBtn.textContent = revealOn ? "隐藏负形轮廓线" : "标出隐藏箭头轮廓";
      revealBtn.setAttribute("aria-pressed", String(revealOn));
      updateKerning();
    });
  }
}

// =========================================================================
// 04 节：从哪来 · 年代档案抽屉（5 个查证节点 + 同步矢量原理图）
// =========================================================================
export function initSection04() {
  const nav = document.getElementById("sec04-timeline-nav");
  const yearEl = document.getElementById("sec04-year");
  const titleEl = document.getElementById("sec04-title");
  const bodyEl = document.getElementById("sec04-body");
  const metaEl = document.getElementById("sec04-meta");
  const artEl = document.getElementById("sec04-art");
  if (!nav) return;

  const EVENTS = [
    {
      year: "1915 / 1921",
      short: "1915 Rubin",
      title: "Edgar Rubin 提出图底分化与鲁宾花瓶",
      meta: "哥本哈根大学博士论文《Synsoplevede figurer》(1915) · 德文版《Visuell wahrgenommene Figuren》(1921)",
      body: "丹麦心理学家埃德加·鲁宾在博士论文中首次系统实验研究图与底的不对称关系：两条相邻区域共用同一条轮廓线时，只有「图」拥有具体形状与轮廓归属，「底」则被感知为在后方无形延展。论文中的花瓶—双侧影双关图，后来成为全球心理学与设计课的经典母题。",
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
              <rect x="20" y="10" width="180" height="110" fill="#0E2044"/>
              <path d="M44,12 L176,12 C164,26 142,26 138,44 C135,54 128,60 124,65 C129,70 136,76 138,88 C142,102 158,106 168,118 L52,118 C62,106 78,102 82,88 C84,76 91,70 96,65 C92,60 85,54 82,44 C78,26 56,26 44,12 Z" fill="#FEF9F3"/>
              <line x1="110" y1="10" x2="110" y2="120" stroke="#F04B00" stroke-dasharray="4 3" stroke-width="1.5"/>
            </svg>`,
    },
    {
      year: "1935",
      short: "1935 Koffka",
      title: "Kurt Koffka 将图底纳入格式塔体系",
      meta: "《Principles of Gestalt Psychology》(1935, Harcourt, Brace & Co.)",
      body: "1921 年鲁宾论文译成德文后迅速影响了柏林学派。库尔特·考夫卡在 1935 年的经典著作中把图底组织正式写进英语世界格式塔心理学框架，并梳理出图与底在深度感（图更近）、质感（图有物感）与记忆保留上的系统差异。",
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
              <rect x="18" y="16" width="132" height="86" fill="#E8DED1" stroke="#0E2044" stroke-width="1.5"/>
              <rect x="52" y="34" width="116" height="72" fill="#0E2044"/>
              <rect x="86" y="50" width="48" height="40" fill="#FEF9F3"/>
              <path d="M174,34 L196,34 L196,106 L174,106" fill="none" stroke="#F04B00" stroke-width="2"/>
            </svg>`,
    },
    {
      year: "1938",
      short: "1938 Escher",
      title: "M. C. Escher《天空与水 I》渐变镶嵌",
      meta: "木版画《Sky and Water I》(1938 年 6 月) · 藏于美国国家美术馆 (1974.28.10) 与海牙埃舍尔宫博物馆",
      body: "荷兰版画家埃舍尔把静态双关推向动态渐变：画面正中深色飞鸟与浅色游鱼像拼图一样零缝隙咬合，互为对方的负空间；视线向上，白鱼逐步融化为晴朗天空、黑鸟展翅成图；视线向下，黑鸟逐步融化为深水背景、白鱼跃出成图。",
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
              <rect x="20" y="10" width="180" height="36" fill="#FEF9F3" stroke="#0E2044" stroke-width="1.2"/>
              <polygon points="60,28 84,18 92,28 84,38" fill="#0E2044"/>
              <polygon points="128,28 152,18 160,28 152,38" fill="#0E2044"/>
              <rect x="20" y="46" width="180" height="38" fill="#0E2044"/>
              <polygon points="20,46 65,46 42,84" fill="#FEF9F3"/>
              <polygon points="65,46 110,46 87,84" fill="#FEF9F3"/>
              <polygon points="110,46 155,46 132,84" fill="#FEF9F3"/>
              <polygon points="155,46 200,46 177,84" fill="#FEF9F3"/>
              <rect x="20" y="84" width="180" height="36" fill="#0E2044"/>
              <polygon points="88,102 64,92 56,102 64,112" fill="#FEF9F3"/>
              <polygon points="156,102 132,92 124,102 132,112" fill="#FEF9F3"/>
            </svg>`,
    },
    {
      year: "1994",
      short: "1994 认知与标识",
      title: "熟悉度提前介入 & FedEx 隐藏箭头诞生",
      meta: "Peterson & Gibson (Psychological Science, 1994) · Lindon Leader / Landor Associates (1994)",
      body: "这一年科学界与设计界同时改写了对图底的认知：Mary A. Peterson 与 Bradley S. Gibson 通过速示实验证明，熟悉物形能在 28 毫秒内提前介入争夺「图」，推翻了「先纯几何分离、再识别物体」的旧假设；同年，设计师 Lindon Leader 在推敲 FedEx 字标时敏锐捕捉并精修了 E 与 x 之间的向右负空间箭头，成为现代平面标识的教科书范例。",
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
              <rect x="16" y="16" width="188" height="98" fill="#FEF9F3" stroke="#0E2044" stroke-width="2"/>
              <path d="M40,34 h52 v15 h-34 v11 h26 v14 h-26 v12 h34 v15 h-52 z" fill="#0E2044"/>
              <path d="M110,46 h18 l14,20 l14,-20 h18 l-22,28 l23,27 h-18 l-15,-19 l-15,19 h-18 l23,-27 z" fill="#0E2044"/>
              <polygon points="90,64 114,64 114,55 129,71 114,87 114,78 90,78" fill="none" stroke="#F04B00" stroke-width="2.2"/>
            </svg>`,
    },
    {
      year: "2012",
      short: "2012 Wagemans",
      title: "格式塔百年综述与 V2 边界归属神经机制",
      meta: "Wagemans, Elder, Kubovy, Palmer, Peterson, Singh & von der Heydt (Psychological Bulletin, 2012)",
      body: "格式塔心理学百年之际，七位视觉科学家联合综述了图底组织的神经基础：灵长类早期视觉皮层（特别是 V2 区）存在专门编码「边界归属（border ownership）」的神经元——它们并不只是检测明暗边线，而是直接表征「这条边属于左边物体还是右边物体」。",
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
              <rect x="20" y="16" width="90" height="98" fill="#0E2044"/>
              <rect x="110" y="16" width="90" height="98" fill="#E8DED1"/>
              <line x1="110" y1="16" x2="110" y2="114" stroke="#F04B00" stroke-width="3"/>
              <path d="M110,36 L86,36 M94,30 L86,36 L94,42" fill="none" stroke="#FEF9F3" stroke-width="2"/>
              <path d="M110,65 L86,65 M94,59 L86,65 L94,71" fill="none" stroke="#FEF9F3" stroke-width="2"/>
              <path d="M110,94 L86,94 M94,88 L86,94 L94,100" fill="none" stroke="#FEF9F3" stroke-width="2"/>
            </svg>`,
    },
  ];

  function select(idx) {
    const item = EVENTS[idx] || EVENTS[0];
    if (yearEl) yearEl.textContent = item.year;
    if (titleEl) titleEl.textContent = item.title;
    if (bodyEl) bodyEl.textContent = item.body;
    if (metaEl) metaEl.textContent = item.meta;
    if (artEl) artEl.innerHTML = item.svg;
    nav.querySelectorAll("button").forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  nav.innerHTML = EVENTS.map(
    (ev, i) =>
      `<button type="button" role="tab" class="tl-tab" data-tl="${i}" aria-selected="${i === 0}">${ev.short}</button>`
  ).join("");

  nav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tl]");
    if (b) select(Number(b.dataset.tl));
  });
  select(0);
}

// =========================================================================
// 05 节：什么时候用 / 别用 · 三组真实界面「翻车 ⇄ 修稳」对照翻牌
// =========================================================================
export function initSection05() {
  const wrap = document.getElementById("sec05-fix-cards");
  if (!wrap) return;

  const rVib = contrastRatio("#D92B2B", "#1F9E4A").toFixed(1);
  const rPoster = contrastRatio("#0E2044", "#FEF9F3").toFixed(1);
  const CASES = [
    {
      title: "花底实拍图上直接压细字",
      fixed: false,
      badTag: "误用 · 局部明暗吞字",
      goodTag: "修稳 · 暗幕垫底隔离",
      badNote: "背景明暗斑块和细字笔画频率相同，文字一半清楚一半融进亮斑，视觉无法稳住图底边界。",
      goodNote: "叠一层柔和深藏青暗幕把背景频率压平，前景暖象牙标题对比度稳超 12:1，远看一秒立住。",
      render: (fixed) =>
        fixed
          ? `<div class="case-demo">
               <svg viewBox="0 0 280 96" aria-hidden="true">
                 <defs><pattern id="c1g" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="12" height="24" fill="#F2EAE0"/><rect x="12" width="12" height="24" fill="#0E2044"/></pattern></defs>
                 <rect width="280" height="96" fill="url(#c1g)"/>
                 <rect width="280" height="96" fill="#0A1733" opacity="0.86"/>
                 <text x="140" y="46" text-anchor="middle" fill="#FEF9F3" font-size="18" font-weight="900" font-family="Noto Sans SC, sans-serif">建筑双年展</text>
                 <text x="140" y="68" text-anchor="middle" fill="#E8DED1" font-size="12" font-family="JetBrains Mono, monospace">11.25 · 主馆开放</text>
               </svg>
             </div>`
          : `<div class="case-demo">
               <svg viewBox="0 0 280 96" aria-hidden="true">
                 <defs><pattern id="c1b" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="12" height="24" fill="#F2EAE0"/><rect x="12" width="12" height="24" fill="#0E2044"/></pattern></defs>
                 <rect width="280" height="96" fill="url(#c1b)"/>
                 <text x="140" y="46" text-anchor="middle" fill="#FEF9F3" font-size="18" font-weight="500" font-family="Noto Sans SC, sans-serif">建筑双年展</text>
                 <text x="140" y="68" text-anchor="middle" fill="#FEF9F3" font-size="12" font-family="JetBrains Mono, monospace">11.25 · 主馆开放</text>
               </svg>
             </div>`,
    },
    {
      title: "高饱和互补色互作图底",
      fixed: false,
      badTag: `误用 · ${rVib}:1 色彩震颤`,
      goodTag: `修稳 · ${rPoster}:1 清晰主次`,
      badNote: `纯红底配纯绿字看似撞色强烈，其实两者相对亮度几乎相等（仅 ${rVib}:1），边缘刺眼发抖。`,
      goodNote: "退回原海报「暖象牙纯底 + 深藏青主钮 + 局部朱橘点缀」，亮度差拉开，行动按钮一眼锁定。",
      render: (fixed) =>
        fixed
          ? `<div class="case-demo">
               <svg viewBox="0 0 280 96" aria-hidden="true">
                 <rect width="280" height="96" fill="#FEF9F3"/>
                 <rect x="64" y="25" width="152" height="46" fill="#0E2044"/>
                 <rect x="64" y="67" width="152" height="4" fill="#F04B00"/>
                 <text x="140" y="53" text-anchor="middle" fill="#FEF9F3" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif">立即提交预约</text>
               </svg>
             </div>`
          : `<div class="case-demo">
               <svg viewBox="0 0 280 96" aria-hidden="true">
                 <rect width="280" height="96" fill="#FEF9F3"/>
                 <rect x="64" y="25" width="152" height="46" fill="#D92B2B"/>
                 <text x="140" y="54" text-anchor="middle" fill="#1F9E4A" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif">立即提交预约</text>
               </svg>
             </div>`,
    },
    {
      title: "高风险弹窗里硬玩双关",
      fixed: false,
      badTag: "误用 · 双钮等权难辨",
      goodTag: "修稳 · 实空分层单义",
      badNote: "医疗或删除确认弹窗切忌五五平手双黑块或炫技负形，用户压力下极易点错破坏性操作。",
      goodNote: "用实心高反差主按钮做「图」、线框弱对比次按钮退向「底」，并用半透明暗遮罩隔离后方页面。",
      render: (fixed) =>
        fixed
          ? `<div class="case-demo">
               <svg viewBox="0 0 280 96" aria-hidden="true">
                 <rect width="280" height="96" fill="#EFE7DB"/>
                 <rect x="40" y="28" width="90" height="40" fill="#FEF9F3" stroke="#0E2044" stroke-width="2"/>
                 <text x="85" y="53" text-anchor="middle" fill="#0E2044" font-size="14" font-weight="700" font-family="Noto Sans SC, sans-serif">取消</text>
                 <rect x="144" y="28" width="96" height="40" fill="#B62020"/>
                 <text x="192" y="53" text-anchor="middle" fill="#FEF9F3" font-size="14" font-weight="900" font-family="Noto Sans SC, sans-serif">确认删除</text>
               </svg>
             </div>`
          : `<div class="case-demo">
               <svg viewBox="0 0 280 96" aria-hidden="true">
                 <rect width="280" height="96" fill="#EFE7DB"/>
                 <rect x="40" y="28" width="94" height="40" fill="#0E2044"/>
                 <text x="87" y="53" text-anchor="middle" fill="#FEF9F3" font-size="14" font-weight="700" font-family="Noto Sans SC, sans-serif">取消</text>
                 <rect x="146" y="28" width="94" height="40" fill="#0E2044"/>
                 <text x="193" y="53" text-anchor="middle" fill="#FEF9F3" font-size="14" font-weight="700" font-family="Noto Sans SC, sans-serif">确认删除</text>
               </svg>
             </div>`,
    },
  ];

  function render() {
    wrap.innerHTML = CASES.map(
      (c, i) => `
      <article class="fix-card ${c.fixed ? "is-fixed" : ""}">
        <div class="fix-top">
          <h3>${c.title}</h3>
          <span class="fix-pill ${c.fixed ? "is-ok" : "is-bad"}">${c.fixed ? c.goodTag : c.badTag}</span>
        </div>
        ${c.render(c.fixed)}
        <p class="fix-note">${c.fixed ? c.goodNote : c.badNote}</p>
        <button type="button" class="fix-toggle" data-fix-idx="${i}">
          ${c.fixed ? "看回翻车原样 ←" : "一键切到修稳方案 →"}
        </button>
      </article>`
    ).join("");
  }

  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fix-idx]");
    if (!b) return;
    const i = Number(b.dataset.fixIdx);
    CASES[i].fixed = !CASES[i].fixed;
    render();
  });

  render();
}

// =========================================================================
// 06 节：小练习（两道单变量进阶题，A/B/C/D 绝不剧透好坏！）
// =========================================================================
export function initSection06() {
  const qTitle = document.getElementById("sec06-q-title");
  const qDesc = document.getElementById("sec06-q-desc");
  const grid = document.getElementById("sec06-options");
  const feedback = document.getElementById("sec06-feedback");
  const switchBtns = [...document.querySelectorAll("[data-quiz-idx]")];
  if (!grid) return;

  const QUESTIONS = [
    {
      title: "题 1 · 日常信息卡片：哪一版图底分离最清晰稳健？",
      desc: "下面四版卡片排的是同一句活动通知，只有图底关系里「一个变量」不同。选出最稳的一版。",
      answer: "C",
      options: [
        {
          key: "A",
          label: "方案 A",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <defs>
                    <pattern id="q1pat" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="12" stroke="#0E2044" stroke-width="5" opacity="0.34"/>
                    </pattern>
                  </defs>
                  <rect width="220" height="140" fill="#FEF9F3"/>
                  <rect width="220" height="140" fill="url(#q1pat)"/>
                  <rect x="54" y="32" width="112" height="76" fill="#0E2044"/>
                  <text x="110" y="66" text-anchor="middle" fill="#FEF9F3" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif">设计夜谈</text>
                  <text x="110" y="88" text-anchor="middle" fill="#E8DED1" font-size="10" font-family="JetBrains Mono, monospace">19:30 · HALL B</text>
                </svg>`,
          reason: "方案 A 的前景和纸底对比度虽够，但底面铺满高反差斜条纹，背景内部边缘抢夺视线，主体被噪纹切碎。",
        },
        {
          key: "B",
          label: "方案 B",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <rect width="220" height="140" fill="#C4CBD6"/>
                  <rect x="54" y="32" width="112" height="76" fill="#909CAE"/>
                  <text x="110" y="66" text-anchor="middle" fill="#BFC7D4" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif">设计夜谈</text>
                  <text x="110" y="88" text-anchor="middle" fill="#BCC5D2" font-size="10" font-family="JetBrains Mono, monospace">19:30 · HALL B</text>
                </svg>`,
          reason: `方案 B 的纯底与包围比例都没问题，但明暗亮度反差太低（实算仅 ${contrastRatio("#909CAE", "#C4CBD6").toFixed(1)}:1），色块和文字全部融进灰蓝雾里。`,
        },
        {
          key: "C",
          label: "方案 C",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <rect width="220" height="140" fill="#FEF9F3"/>
                  <rect x="54" y="32" width="112" height="76" fill="#0E2044"/>
                  <text x="110" y="66" text-anchor="middle" fill="#FEF9F3" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif">设计夜谈</text>
                  <text x="110" y="88" text-anchor="middle" fill="#E8DED1" font-size="10" font-family="JetBrains Mono, monospace">19:30 · HALL B</text>
                </svg>`,
          reason: `方案 C 正确：纯底无噪、前景被四周暖象牙白完整包围、深藏青与暖象牙实测对比度达 ${contrastRatio("#0E2044", "#FEF9F3").toFixed(1)}:1，一眼分明。`,
        },
        {
          key: "D",
          label: "方案 D",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <rect width="220" height="140" fill="#FEF9F3"/>
                  <rect x="8" y="8" width="204" height="124" fill="#0E2044"/>
                  <rect x="0" y="54" width="18" height="32" fill="#FEF9F3"/>
                  <rect x="202" y="54" width="18" height="32" fill="#FEF9F3"/>
                  <text x="110" y="66" text-anchor="middle" fill="#FEF9F3" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif">设计夜谈</text>
                  <text x="110" y="88" text-anchor="middle" fill="#E8DED1" font-size="11" font-family="JetBrains Mono, monospace">19:30 · HALL B</text>
                </svg>`,
          reason: "方案 D 把深色主体撑满 86% 并贴边切碎背景，原本的背景退化成左右两块孤立白斑，反而抢了视觉焦点（包围倒挂）。",
        },
      ],
    },
    {
      title: "题 2 · 双关正负形海报：哪一版真正能双向自由转换？",
      desc: "以下四版都以「双峰 / 倒影峡谷」作双关构成，仅有一处条件不同。选出深浅两面最容易自由互换的一版。",
      answer: "B",
      options: [
        {
          key: "A",
          label: "方案 A",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <rect x="20" y="14" width="180" height="112" fill="#0E2044"/>
                  <polygon points="100,14 120,14 114,126 106,126" fill="#FEF9F3"/>
                </svg>`,
          reason: "方案 A 中央浅区被挤成不到 10% 的细缝，两侧深色压倒性占优，根本无法实现双关互换。",
        },
        {
          key: "B",
          label: "方案 B",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <rect x="20" y="14" width="180" height="112" fill="#0E2044"/>
                  <polygon points="46,14 174,14 134,70 156,126 64,126 86,70" fill="#FEF9F3"/>
                </svg>`,
          reason: `方案 B 正确：外框闭合、对比度达 ${contrastRatio("#0E2044", "#FEF9F3").toFixed(1)}:1、深浅面积势均力敌且对称共界，既可看作中间沙漏杯，也可看作左右两座对峙山岩。`,
        },
        {
          key: "C",
          label: "方案 C",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <rect x="20" y="14" width="180" height="112" fill="#7D889B"/>
                  <polygon points="46,14 174,14 134,70 156,126 64,126 86,70" fill="#9AA3B0"/>
                </svg>`,
          reason: `方案 C 虽然面积对称，但前景色与背景色对比度实算仅 ${contrastRatio("#7D889B", "#9AA3B0").toFixed(1)}:1，轮廓发虚糊成灰雾，双关切换缺乏利落感。`,
        },
        {
          key: "D",
          label: "方案 D",
          svg: `<svg viewBox="0 0 220 140" aria-hidden="true">
                  <defs>
                    <pattern id="q2pat" width="10" height="10" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="5" x2="10" y2="5" stroke="#FEF9F3" stroke-width="3" opacity="0.55"/>
                    </pattern>
                  </defs>
                  <rect x="20" y="14" width="180" height="112" fill="#0E2044"/>
                  <rect x="20" y="14" width="180" height="112" fill="url(#q2pat)"/>
                  <polygon points="46,14 174,14 134,70 156,126 64,126 86,70" fill="#FEF9F3"/>
                </svg>`,
          reason: "方案 D 给深侧叠了强横纹，破坏了双方的视觉均势，大脑会立刻把条纹区判成花底，无法顺畅反转。",
        },
      ],
    },
  ];

  let curIdx = 0;
  let picked = null;

  function render() {
    const q = QUESTIONS[curIdx];
    if (qTitle) qTitle.textContent = q.title;
    if (qDesc) qDesc.textContent = q.desc;

    switchBtns.forEach((b) => {
      const on = Number(b.dataset.quizIdx) === curIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    grid.innerHTML = q.options
      .map((opt) => {
        let cls = "quiz-opt";
        if (picked) {
          if (opt.key === q.answer) cls += " is-correct";
          else if (opt.key === picked) cls += " is-wrong";
        }
        return `
          <button type="button" class="${cls}" data-pick="${opt.key}" aria-pressed="${picked === opt.key}">
            <span class="quiz-head">
              <strong class="quiz-letter">${opt.key}</strong>
              <span class="quiz-neutral">${opt.label}</span>
            </span>
            <span class="quiz-art">${opt.svg}</span>
          </button>`;
      })
      .join("");

    if (feedback) {
      if (!picked) {
        feedback.hidden = true;
        feedback.innerHTML = "";
      } else {
        const isRight = picked === q.answer;
        feedback.hidden = false;
        feedback.className = `quiz-feedback ${isRight ? "is-right" : "is-wrong"}`;
        feedback.innerHTML = `
          <div class="qf-head">
            <strong>${isRight ? `选对了！${q.answer} 正是最稳的一版` : `你选了 ${picked}，最稳的是 ${q.answer}`}</strong>
            <button type="button" class="qf-next" data-quiz-action="next">${curIdx === 0 ? "做下一题 →" : "回到第 1 题 ←"}</button>
          </div>
          <ul class="qf-list">
            ${q.options
              .map(
                (o) =>
                  `<li class="${o.key === q.answer ? "is-ans" : ""}"><b>${o.key}：</b>${o.reason}</li>`
              )
              .join("")}
          </ul>`;
      }
    }
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick]");
    if (!btn) return;
    picked = btn.dataset.pick;
    render();
  });

  if (feedback) {
    feedback.addEventListener("click", (e) => {
      if (e.target.closest("[data-quiz-action='next']")) {
        curIdx = (curIdx + 1) % QUESTIONS.length;
        picked = null;
        render();
      }
    });
  }

  switchBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curIdx = Number(b.dataset.quizIdx);
      picked = null;
      render();
    })
  );

  render();
}

// =========================================================================
// 07 节：原海报放大灯箱（支持滚轮缩放、按钮缩放、鼠标/触摸拖动、Esc 关闭）
// =========================================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open-btn");
  const thumb = document.getElementById("poster");
  const modal = document.getElementById("poster-lightbox");
  const img = document.getElementById("lightbox-img");
  const stage = document.getElementById("lightbox-stage");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const resetBtn = document.getElementById("lightbox-reset");
  const zoomLabel = document.getElementById("lightbox-zoom-label");
  if (!modal || !img || !thumb) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    // 复用页面已内联的 poster data URI，绝不重复内联图片！
    if (!img.getAttribute("src")) img.src = thumb.src;
    reset();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger?.focus();
  }

  trigger?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.35);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.7, scale - 0.35);
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  resetBtn?.addEventListener("click", reset);

  stage?.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.7, Math.min(3.5, scale + (e.deltaY < 0 ? 0.2 : -0.2)));
      applyTransform();
    },
    { passive: false }
  );

  stage?.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.classList.add("is-dragging");
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    stage?.classList.remove("is-dragging");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}
