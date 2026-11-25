// 329 疏密相间构图 — 正文 01–07 节各不相同的专属交互模块
import { clamp } from "./model.js";

// ============================================================
// 01 节：点击缝隙敲节拍（16 枚圆点，点 15 处缝隙开关宽/窄，亲测韦特海默接近律）
// ============================================================
export function initBeatStrip() {
  const host = document.getElementById("beat-strip");
  const groupsEl = document.getElementById("beat-groups");
  const verdictEl = document.getElementById("beat-verdict");
  const waveEl = document.getElementById("beat-mini-wave");
  if (!host) return;

  const DOT_COUNT = 16;
  // 15 处缝隙：true = 拉宽成停顿，false = 收紧成密群；初始全 false（机械等距）
  let gaps = Array(DOT_COUNT - 1).fill(false);

  const PRESETS = {
    even: Array(15).fill(false),
    meter: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    organic: [false, false, false, false, false, false, true, false, true, false, false, false, false, true, false],
  };

  function computeGroups() {
    const out = [];
    let run = 1;
    for (let i = 0; i < gaps.length; i++) {
      if (gaps[i]) {
        out.push(run);
        run = 1;
      } else {
        run++;
      }
    }
    out.push(run);
    return out;
  }

  function render() {
    host.innerHTML = "";
    for (let i = 0; i < DOT_COUNT; i++) {
      const dot = document.createElement("span");
      dot.className = "beat-dot";
      dot.setAttribute("aria-hidden", "true");
      host.appendChild(dot);

      if (i < DOT_COUNT - 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "beat-gap" + (gaps[i] ? " is-wide" : "");
        btn.setAttribute("aria-pressed", String(gaps[i]));
        btn.setAttribute("aria-label", `第 ${i + 1} 与 ${i + 2} 点之间：${gaps[i] ? "已拉开疏缝，点击合拢" : "紧凑，点击拉开疏缝"}`);
        btn.innerHTML = `<span class="beat-gap-mark">${gaps[i] ? "疏" : "·"}</span>`;
        btn.addEventListener("click", () => {
          gaps[i] = !gaps[i];
          render();
        });
        host.appendChild(btn);
      }
    }

    const groups = computeGroups();
    const wideCount = gaps.filter(Boolean).length;
    const uniqueSizes = new Set(groups).size;

    // 分组标示
    groupsEl.textContent = `当前读作 ${groups.length} 组：${groups.join(" — ")}（仍是同一批 16 个圆点）`;

    // 迷你声谱条
    waveEl.innerHTML = groups
      .map((n, idx) => {
        const hPct = Math.round(clamp(22 + n * 12, 26, 100));
        const sep = idx < groups.length - 1 ? `<span class="mini-rest" aria-hidden="true"></span>` : "";
        return `<span class="mini-pulse" style="height:${hPct}%" title="密群 ${n} 点"></span>${sep}`;
      })
      .join("");

    // 白话评价「为什么」
    if (wideCount === 0) {
      verdictEl.textContent = "零处停顿：16 个点平铺成一长串，眼睛数不到第 6 个就开始发花——数量一样多，却毫无轻重。";
      verdictEl.dataset.tone = "warn";
    } else if (wideCount >= 11) {
      verdictEl.textContent = `拉开了 ${wideCount} 处缝隙，点几乎全散成单个孤立颗粒：到处都在停顿，反而失去了重拍聚群。`;
      verdictEl.dataset.tone = "warn";
    } else if (uniqueSizes === 1 && groups.length >= 3) {
      verdictEl.textContent = `切成了均等的 ${groups.join("-")}：比通篇粘连清晰，但每一拍长短完全一致，更像机械节拍器而非有机韵律。`;
      verdictEl.dataset.tone = "mid";
    } else {
      verdictEl.textContent = `不增减任何一点，只靠 ${wideCount} 处呼吸缝就拆出「${groups.join("—")}」的长短起伏：密群当重拍、疏缝作喘息，眼睛扫一眼就记住结构。`;
      verdictEl.dataset.tone = "ok";
    }
  }

  document.querySelectorAll("[data-beat-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.beatPreset;
      if (PRESETS[key]) {
        gaps = [...PRESETS[key]];
        render();
      }
    });
  });

  render();
}

// ============================================================
// 02 节：横向拖拽扫描探针 — 三式密度剖面与视线扫描速度剖析
// ============================================================
export function initSlopeScanner() {
  const canvas = document.getElementById("slope-canvas");
  const slider = document.getElementById("slope-probe");
  const readout = document.getElementById("slope-readout");
  const summary = document.getElementById("slope-summary");
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  let mode = "grad"; // "cliff" | "grad" | "wave"
  let probe = 0.42;

  const MODES = {
    cliff: {
      name: "一刀切硬边（无坡度）",
      desc: "左侧 28% 挤成实黑砖墙，28% 右侧瞬间归零。视线在分界处猛然坠崖，左半幅与右半幅像贴错的两张纸。",
      density: (u) => (u < 0.28 ? 0.94 : 0.02),
    },
    grad: {
      name: "原海报渐散坡度",
      desc: "左端沉实结密，中段颗粒渐细渐稀铺出约 30% 的缓冲带，右侧敞开疏朗留白托起蓝圆——疏密由坡度牵成一气。",
      density: (u) => clamp(Math.exp(-Math.pow(u / 0.46, 1.85)) * 0.92, 0.02, 0.95),
    },
    wave: {
      name: "双峰相间波浪",
      desc: "左重峰聚气、中段放空换气、右轻峰遥相呼应，适合长卷、专题长页与多段落视觉阅读。",
      density: (u) => {
        const p1 = 0.88 * Math.exp(-Math.pow((u - 0.19) / 0.16, 2));
        const p2 = 0.56 * Math.exp(-Math.pow((u - 0.83) / 0.12, 2));
        return clamp(p1 + p2 + 0.03, 0.02, 0.95);
      },
    },
  };

  function resizeAndDraw() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const fn = MODES[mode].density;
    const topH = Math.round(h * 0.54);
    const botTop = topH + 10;
    const botH = h - botTop - 16;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#F6ECCB";
    ctx.fillRect(0, 0, w, h);

    // 上半区：实绘点阵剖面
    ctx.fillStyle = "#F8C426";
    ctx.fillRect(0, 0, w, topH);

    const cols = 34;
    const rows = 6;
    for (let c = 0; c < cols; c++) {
      const u = (c + 0.5) / cols;
      const d = fn(u);
      for (let r = 0; r < rows; r++) {
        const v = (r + 0.5) / rows;
        const j = Math.sin(c * 91.3 + r * 47.7) * 43758.5453;
        const rnd = j - Math.floor(j);
        if (rnd > d * 1.15 + 0.04) continue;
        const rad = clamp(1.2 + d * 5.2, 1.2, 6.2);
        const px = u * w + (rnd - 0.5) * (1 - d) * 8;
        const py = 10 + v * (topH - 20);
        ctx.fillStyle = "#0B0907";
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 焦点圆参考位置
    const fx = mode === "wave" ? w * 0.56 : w * 0.82;
    ctx.fillStyle = "#1F3BB6";
    ctx.beginPath();
    ctx.arc(fx, topH * 0.48, Math.min(20, topH * 0.18), 0, Math.PI * 2);
    ctx.fill();

    // 下半区：视线停留强度曲线（密区慢读，疏区加速游走并在蓝圆处停顿）
    ctx.strokeStyle = "rgba(11, 9, 7, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, botTop + botH);
    ctx.lineTo(w, botTop + botH);
    ctx.stroke();

    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const d = fn(u);
      const x = u * w;
      const y = botTop + botH - d * (botH - 12);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = mode === "cliff" ? "#A82412" : "#1F3BB6";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // 扫描探针竖线
    const px = probe * w;
    const pd = fn(probe);
    const py = botTop + botH - pd * (botH - 12);

    ctx.strokeStyle = "#1F3BB6";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#1F3BB6";
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FDFBF4";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标签
    ctx.fillStyle = "#2E281E";
    ctx.font = '600 11px "Inter", "Noto Serif SC", sans-serif';
    ctx.fillText("密度剖面曲线（高=停留细读，低=轻快扫过）", 10, botTop + 13);
    ctx.restore();

    // 更新探针文字读数
    const pct = Math.round(pd * 100);
    const zone =
      pct >= 58 ? "高密重拍区：视线主动减速、逐项辨认信息"
      : pct >= 18 ? "渐散缓冲带：颗粒逐步松开，把视线顺滑递往空处"
      : Math.abs(probe - (mode === "wave" ? 0.56 : 0.82)) < 0.09
        ? "疏朗焦点锚点：四周空阔，眼睛自然停在克莱因蓝主角上"
        : "疏朗呼吸域：视线轻快滑行，获得心理喘息";
    readout.textContent = `探针位于横轴 ${Math.round(probe * 100)}% · 局部密度约 ${pct}% — ${zone}`;
    summary.textContent = MODES[mode].desc;
  }

  // 直接在画布上横拖也能移动探针
  let dragging = false;
  const setFromEv = (ev) => {
    const r = canvas.getBoundingClientRect();
    probe = clamp((ev.clientX - r.left) / Math.max(1, r.width), 0.02, 0.98);
    slider.value = String(Math.round(probe * 100));
    resizeAndDraw();
  };
  canvas.addEventListener("pointerdown", (ev) => {
    dragging = true;
    setFromEv(ev);
    try { canvas.setPointerCapture(ev.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (dragging) setFromEv(ev);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });

  slider.addEventListener("input", () => {
    probe = clamp(Number(slider.value) / 100, 0.02, 0.98);
    resizeAndDraw();
  });

  document.querySelectorAll("[data-slope-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.slopeMode;
      document.querySelectorAll("[data-slope-mode]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.toggle("is-active", b === btn);
      });
      resizeAndDraw();
    });
  });

  new ResizeObserver(resizeAndDraw).observe(canvas);
  resizeAndDraw();
}

// ============================================================
// 03 节：深蓝暗室 — 真实活动海报卡片的呼吸重排实验
// ============================================================
export function initBreathCard() {
  const card = document.getElementById("breath-demo-card");
  const note = document.getElementById("breath-demo-note");
  const btnTight = document.getElementById("toggle-cluster");
  const btnMoat = document.getElementById("toggle-moat");
  if (!card || !btnTight || !btnMoat) return;

  let clustered = false;
  let hasMoat = false;

  function sync() {
    card.dataset.clustered = clustered ? "1" : "0";
    card.dataset.moat = hasMoat ? "1" : "0";
    btnTight.setAttribute("aria-pressed", String(clustered));
    btnMoat.setAttribute("aria-pressed", String(hasMoat));
    btnTight.classList.toggle("is-on", clustered);
    btnMoat.classList.toggle("is-on", hasMoat);

    if (!clustered && !hasMoat) {
      note.textContent = "现状（均分塞满）：日期、标签、说明与报名钮把卡片四角铺得满满当当，眼睛不知道先看哪一句。";
    } else if (clustered && !hasMoat) {
      note.textContent = "已收拢次要群组（建密区）：时间、地点与四枚标签合成紧致一束，但主标题和行动钮仍贴得偏紧，还差一口气。";
    } else if (!clustered && hasMoat) {
      note.textContent = "只拉开外圈留白（缺密区）：主标题空出来了，但周边散落标签依然四处抢戏，整张卡片显得发散。";
    } else {
      note.textContent = "疏密同时就位：所有辅助信息收进左下「密块」，右上大面积疏朗空间独托主标题与蓝钮——零删减文字，一眼聚焦。";
    }
  }

  btnTight.addEventListener("click", () => { clustered = !clustered; sync(); });
  btnMoat.addEventListener("click", () => { hasMoat = !hasMoat; sync(); });

  document.querySelectorAll("[data-breath-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.breathPreset;
      if (p === "flat") { clustered = false; hasMoat = false; }
      else if (p === "cluster") { clustered = true; hasMoat = false; }
      else { clustered = true; hasMoat = true; }
      sync();
    });
  });

  sync();
}

// ============================================================
// 04 节：可点选东西方历史长卷时间轴 + 实时 SVG 图解
// ============================================================
export function initOriginsTimeline() {
  const buttons = [...document.querySelectorAll("[data-origin]")];
  const titleEl = document.getElementById("origin-title");
  const metaEl = document.getElementById("origin-meta");
  const quoteEl = document.getElementById("origin-quote");
  const bodyEl = document.getElementById("origin-body");
  const diagramEl = document.getElementById("origin-diagram");
  if (!buttons.length || !titleEl) return;

  const DATA = {
    xiagui: {
      title: "夏圭《溪山清远图》手卷",
      meta: "南宋（约 13 世纪初） · 纸本水墨 46.5 × 889.1 cm · 台北国立故宫博物院藏",
      quote: "一卷展开近九米，近景重嶂密林与旷远平湖反复交替，步步换气。",
      body: "手卷不是一眼看完的矩形，而是随双手卷舒推进的时间艺术。夏圭把浓墨斧劈皴与杂树楼阁收束成紧簇的密段，转手便放出一大片不着一墨的江水烟岚，再用几笔孤舟远岫轻点，让观者在密处驻足、在疏处放眼。",
      svg: `<svg viewBox="0 0 360 150" role="img" aria-label="夏圭长卷疏密节奏示意">
        <rect width="360" height="150" fill="#F8C426" rx="4"/>
        <path d="M12 124 L42 52 L74 88 L98 44 L132 124 Z" fill="#0B0907"/>
        <path d="M262 124 L288 76 L316 98 L342 124 Z" fill="#0B0907" opacity="0.82"/>
        <circle cx="52" cy="96" r="5" fill="#F8C426" opacity="0.25"/>
        <circle cx="88" cy="84" r="4" fill="#F8C426" opacity="0.25"/>
        <path d="M148 112 Q196 104 244 114" stroke="#1F3BB6" stroke-width="2.6" fill="none"/>
        <ellipse cx="198" cy="86" rx="14" ry="4" fill="#1F3BB6"/>
        <text x="58" y="28" font-size="11" fill="#0B0907" font-weight="700">重嶂密林</text>
        <text x="172" y="28" font-size="11" fill="#1F3BB6" font-weight="700">平湖大疏</text>
        <text x="274" y="28" font-size="11" fill="#0B0907" font-weight="700">轻峰再聚</text>
      </svg>`,
    },
    shen: {
      title: "沈宗骞《芥舟学画编》",
      meta: "清乾隆四十六年（1781） · 卷一《布置》、卷二《取势》",
      quote: "「密不嫌迫塞，疏不嫌空松」 · 「将欲作结密郁塞，必先之以疏落点缀」",
      body: "沈宗骞在山水画法里直接道出疏密的双向底线：密处绝不能闷死窒息，疏处也不能松散失据；想画一处浓重结密，先要在旁以疏落笔意铺垫对比——这与同小类的「开合构图」互为表里。",
      svg: `<svg viewBox="0 0 360 150" role="img" aria-label="密不迫塞疏不空松示意">
        <rect width="360" height="150" fill="#F8C426" rx="4"/>
        <g fill="#0B0907">
          <circle cx="48" cy="54" r="10"/><circle cx="72" cy="54" r="10"/><circle cx="96" cy="54" r="9"/>
          <circle cx="48" cy="78" r="11"/><circle cx="72" cy="78" r="11"/><circle cx="96" cy="78" r="8"/>
          <circle cx="48" cy="102" r="9"/><circle cx="72" cy="102" r="9"/><circle cx="96" cy="102" r="6"/>
          <circle cx="122" cy="64" r="5"/><circle cx="130" cy="88" r="4.5"/><circle cx="152" cy="74" r="3"/>
          <circle cx="176" cy="66" r="2.2"/><circle cx="192" cy="90" r="2"/>
        </g>
        <circle cx="282" cy="68" r="22" fill="#1F3BB6"/>
        <path d="M126 130 C190 128 214 96 336 108" stroke="#1F3BB6" stroke-width="2.5" fill="none"/>
        <text x="36" y="26" font-size="11" fill="#0B0907" font-weight="700">密中有缝（不迫塞）</text>
        <text x="228" y="26" font-size="11" fill="#1F3BB6" font-weight="700">疏中有主（不空松）</text>
      </svg>`,
    },
    deng: {
      title: "邓石如传法 · 包世臣《艺舟双楫》",
      meta: "清嘉庆七年壬戌（1802）受教 · 卷五《述书上》载录",
      quote: "「字画疏处可以走马，密处不使透风，常计白以当黑，奇趣乃出。」",
      body: "包世臣记录清代碑学与篆刻大家邓石如的口诀：敢把该紧的地方收得密不透风，才敢把该放的地方敞得可以走马。后半句「计白当黑」重在把空白当作实体去雕形，前半句讲的正是疏与密拉大落差的胆魄。",
      svg: `<svg viewBox="0 0 360 150" role="img" aria-label="疏可走马密不透风篆刻章法示意">
        <rect width="360" height="150" fill="#F8C426" rx="4"/>
        <rect x="96" y="18" width="168" height="114" fill="none" stroke="#0B0907" stroke-width="2.5"/>
        <rect x="108" y="28" width="54" height="94" fill="#0B0907"/>
        <g stroke="#F8C426" stroke-width="2.2">
          <line x1="118" y1="36" x2="118" y2="114"/><line x1="130" y1="36" x2="130" y2="114"/>
          <line x1="142" y1="36" x2="142" y2="114"/><line x1="154" y1="36" x2="154" y2="114"/>
          <line x1="114" y1="62" x2="158" y2="62"/><line x1="114" y1="88" x2="158" y2="88"/>
        </g>
        <circle cx="226" cy="75" r="14" fill="#1F3BB6"/>
        <text x="16" y="80" font-size="11" fill="#0B0907" font-weight="700">密不透风</text>
        <text x="276" y="80" font-size="11" fill="#1F3BB6" font-weight="700">疏可走马</text>
      </svg>`,
    },
    wertheimer: {
      title: "马克斯·韦特海默 · 格式塔接近律",
      meta: "1923 ·《格式塔理论研究 II》· Psychologische Forschung 第 4 卷",
      quote: "一排等距圆点只需收紧部分间距，视觉便自动将其归为密组，拉开处即成停顿。",
      body: "韦特海默用极简点阵做实验证明：人的视觉系统天生厌恶逐一清点零散元素，它靠「间距差异」瞬间完成编组。这从认知心理学角度解释了为什么疏密相间比均匀排布更容易读懂。",
      svg: `<svg viewBox="0 0 360 150" role="img" aria-label="韦特海默点阵接近律示意">
        <rect width="360" height="150" fill="#F8C426" rx="4"/>
        <g fill="#0B0907" opacity="0.45">
          <circle cx="38" cy="44" r="6"/><circle cx="72" cy="44" r="6"/><circle cx="106" cy="44" r="6"/>
          <circle cx="140" cy="44" r="6"/><circle cx="174" cy="44" r="6"/><circle cx="208" cy="44" r="6"/>
          <circle cx="242" cy="44" r="6"/><circle cx="276" cy="44" r="6"/><circle cx="310" cy="44" r="6"/>
        </g>
        <g fill="#0B0907">
          <circle cx="38" cy="102" r="7"/><circle cx="56" cy="102" r="7"/><circle cx="74" cy="102" r="7"/>
          <circle cx="142" cy="102" r="7"/><circle cx="160" cy="102" r="7"/>
          <circle cx="238" cy="102" r="7"/><circle cx="256" cy="102" r="7"/><circle cx="274" cy="102" r="7"/><circle cx="292" cy="102" r="7"/>
        </g>
        <line x1="88" y1="102" x2="128" y2="102" stroke="#1F3BB6" stroke-width="2" stroke-dasharray="3 3"/>
        <line x1="176" y1="102" x2="222" y2="102" stroke="#1F3BB6" stroke-width="2" stroke-dasharray="3 3"/>
        <text x="32" y="24" font-size="11" fill="#0B0907">等距排布：无自动编组</text>
        <text x="32" y="82" font-size="11" fill="#1F3BB6" font-weight="700">不等距：3—2—4 自动成拍</text>
      </svg>`,
    },
    kandinsky: {
      title: "瓦西里·康定斯基《点线面》",
      meta: "1926 · 包豪斯丛书第 9 卷（Punkt und Linie zu Fläche）",
      quote: "点群的大小增减与疏密聚散，在平面上奏出与音乐休止符相同的视觉节拍。",
      body: "康定斯基把最基本的视觉颗粒「点」从几何定义里解放出来：单点静止，但成群的点一旦出现聚散、粗细与留白停顿，就会在纸面上发出强弱起伏的声律。329 原海报上的黑点渐变阵配竖线拍谱，正是这一语言的当代回响。",
      svg: `<svg viewBox="0 0 360 150" role="img" aria-label="康定斯基点群节拍示意">
        <rect width="360" height="150" fill="#F8C426" rx="4"/>
        <g fill="#0B0907">
          <circle cx="48" cy="72" r="14"/><circle cx="76" cy="58" r="9"/><circle cx="80" cy="86" r="7"/>
          <circle cx="106" cy="70" r="5"/><circle cx="128" cy="60" r="3.5"/><circle cx="144" cy="84" r="3"/>
          <circle cx="242" cy="76" r="8"/><circle cx="264" cy="66" r="5"/>
        </g>
        <circle cx="198" cy="54" r="16" fill="#1F3BB6"/>
        <g stroke="#0B0907" stroke-width="2">
          <line x1="48" y1="116" x2="48" y2="136"/><line x1="76" y1="120" x2="76" y2="136"/>
          <line x1="106" y1="126" x2="106" y2="136"/><line x1="198" y1="114" x2="198" y2="136" stroke="#1F3BB6"/>
          <line x1="242" y1="122" x2="242" y2="136"/><line x1="264" y1="128" x2="264" y2="136"/>
        </g>
        <text x="32" y="26" font-size="11" fill="#0B0907" font-weight="700">点粒大小 × 疏密间距 ＝ 视觉乐谱</text>
      </svg>`,
    },
  };

  function select(key) {
    const item = DATA[key];
    if (!item) return;
    buttons.forEach((b) => {
      const on = b.dataset.origin === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    titleEl.textContent = item.title;
    metaEl.textContent = item.meta;
    quoteEl.textContent = item.quote;
    bodyEl.textContent = item.body;
    diagramEl.innerHTML = item.svg;
  }

  buttons.forEach((b) => b.addEventListener("click", () => select(b.dataset.origin)));
  select("xiagui");
}

// ============================================================
// 05 节：4 张真实需求「点击翻牌诊断卡」
// ============================================================
export function initScenarioCards() {
  document.querySelectorAll(".flip-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      btn.classList.toggle("is-open", !open);
    });
  });
}

// ============================================================
// 06 节：墨黑暗室小练习（4 选 1 盲测，同数量 28 黑点 + 1 蓝圆，唯一变量是分布与焦点空域）
// ============================================================
export function initPracticeQuiz() {
  const choices = [...document.querySelectorAll(".quiz-card")];
  const feedback = document.getElementById("quiz-feedback");
  const resetBtn = document.getElementById("quiz-reset");
  if (!choices.length || !feedback) return;

  // 严格生成 28 颗黑点（总墨量相同）+ 1 颗蓝圆，四个选项仅改变空间分布
  function makeOptionDots(key) {
    const dots = [];
    if (key === "A") {
      // 7×4 机械均匀铺满，蓝圆嵌在中间某格
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 7; c++) {
          dots.push({ x: 26 + c * 42, y: 30 + r * 36, r: 6.2 });
        }
      }
      return { dots, focus: { x: 173, y: 84, r: 17 } };
    }
    if (key === "B") {
      // 28 颗全部死挤在最左 56px 竖墙内，无渐散过渡，蓝圆贴死右边框
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 4; c++) {
          dots.push({ x: 16 + c * 14, y: 15 + r * 20.5, r: 6.0 });
        }
      }
      return { dots, focus: { x: 282, y: 80, r: 17 } };
    }
    if (key === "C") {
      // 左右形成两簇密点，看起来有疏有密，但把蓝圆埋进了左侧密点正中央！
      const leftCoords = [
        [34,26],[54,28],[74,30],[94,34],[116,42],
        [32,48],[52,48],[72,50],[92,54],[114,62],
        [30,72],[52,72],[74,74],[96,76],[118,84],
        [34,96],[56,96],[78,96],[98,98],
        [38,118],[60,116],[82,114],
      ];
      const rightCoords = [
        [244,44],[264,56],[250,74],[268,86],[248,104],[266,116],
      ];
      leftCoords.forEach(([x, y], i) => dots.push({ x, y, r: i % 3 === 0 ? 7.0 : 5.8 }));
      rightCoords.forEach(([x, y]) => dots.push({ x, y, r: 5.5 }));
      return { dots, focus: { x: 66, y: 72, r: 17 } };
    }
    // D（正确）：左侧饱满聚密 -> 中段渐细渐稀过渡 -> 右侧开阔疏朗独托蓝圆
    const dCoords = [
      [28,28,7.4],[48,28,6.8],[68,30,5.6],[92,34,4.2],[124,40,2.8],
      [28,50,8.2],[48,50,7.6],[70,52,6.2],[94,54,4.6],[122,58,3.2],[152,62,2.4],
      [28,74,8.6],[50,74,8.0],[72,74,6.4],[96,76,4.8],[124,78,3.2],[158,82,2.2],
      [28,98,8.0],[50,98,7.4],[72,98,5.8],[96,100,4.2],[128,104,2.8],
      [30,122,7.0],[52,120,6.2],[74,120,4.8],[102,122,3.4],[136,126,2.4],[170,118,2.2],
    ];
    dCoords.forEach(([x, y, r]) => dots.push({ x, y, r }));
    return { dots, focus: { x: 244, y: 66, r: 17 } };
  }

  // 从实绘 dots 算真实 12 切片密度波（选后揭晓给读者看！）
  function sliceWavePath(dots) {
    const bins = Array(12).fill(0);
    for (const d of dots) {
      const idx = clamp(Math.floor((d.x / 300) * 12), 0, 11);
      bins[idx] += Math.PI * d.r * d.r;
    }
    const maxB = Math.max(1, ...bins, 560);
    return bins
      .map((v, i) => {
        const x = 14 + (i / 11) * 272;
        const y = 30 - clamp(v / maxB, 0, 1) * 24;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  // 把四个选项画进各自 SVG
  choices.forEach((btn) => {
    const key = btn.dataset.choice;
    const { dots, focus } = makeOptionDots(key);
    const waveD = sliceWavePath(dots);
    const stage = btn.querySelector(".quiz-thumb");
    const waveWrap = btn.querySelector(".quiz-wave");
    if (stage) {
      const dotSvg = dots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="#0B0907"/>`).join("");
      stage.innerHTML = `<svg viewBox="0 0 300 156" role="img" aria-label="方案 ${key} 构图样本">
        <rect width="300" height="156" fill="#F8C426"/>
        ${dotSvg}
        <circle cx="${focus.x}" cy="${focus.y}" r="${focus.r}" fill="#1F3BB6"/>
      </svg>`;
    }
    if (waveWrap) {
      waveWrap.innerHTML = `<svg viewBox="0 0 300 36" aria-hidden="true">
        <line x1="14" y1="30" x2="286" y2="30" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>
        <path d="${waveD}" fill="none" stroke="${key === "D" ? "#F8C426" : "#8BB0FF"}" stroke-width="2.4" stroke-linecap="round"/>
      </svg>`;
    }
  });

  const EXPLAIN = {
    A: {
      ok: false,
      title: "方案 A 不对：工整，但密度波拉成了一条直线",
      body: "28 枚黑点按 7×4 均匀平铺，每处间距一样，没有任何疏密落差；蓝圆被夹在等距点阵里，虽然齐整却毫无视觉呼吸与强弱拍。",
    },
    B: {
      ok: false,
      title: "方案 B 不对：硬劈断崖，且蓝圆贴死右边沿",
      body: "虽然把点都挤到了左侧，但完全缺少由密入疏的渐散坡度，画面被生硬切成了左黑墙和右黄板；同时蓝圆几乎撞到右侧画框，显得局促失气。",
    },
    C: {
      ok: false,
      title: "方案 C 不对：有疏有密，却把主角埋进了密点堆",
      body: "这一版很具迷惑性——左右确实做出了大小有别的两簇点群，但它把克莱因蓝圆塞进了左侧最密的区域里，主角和密区互相缠绕，浪费了中间那片宝贵的疏朗留白。",
    },
    D: {
      ok: true,
      title: "选对了！方案 D 同时成立「对比、坡度、呼吸」三件事",
      body: "同样 28 枚黑点，方案 D 在左侧结密成势，中段借渐细渐稀的颗粒顺滑过渡到右侧开阔疏域，并让蓝色焦点稳落疏朗呼吸圈内（四周净空无干扰），看底部揭晓的波形曲线，起伏最自然贯通。",
    },
  };

  function answer(key) {
    const info = EXPLAIN[key];
    choices.forEach((btn) => {
      const k = btn.dataset.choice;
      btn.classList.toggle("is-picked", k === key);
      btn.classList.toggle("is-right", k === "D");
      btn.classList.toggle("is-wrong", k === key && k !== "D");
      btn.classList.add("is-revealed");
      btn.setAttribute("aria-pressed", String(k === key));
    });
    feedback.hidden = false;
    feedback.dataset.state = info.ok ? "ok" : "wrong";
    feedback.innerHTML = `<p class="quiz-fb-title">${info.title}</p><p class="quiz-fb-body">${info.body}</p>`;
    if (resetBtn) resetBtn.hidden = false;
  }

  choices.forEach((btn) => btn.addEventListener("click", () => answer(btn.dataset.choice)));
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      choices.forEach((btn) => {
        btn.classList.remove("is-picked", "is-right", "is-wrong", "is-revealed");
        btn.setAttribute("aria-pressed", "false");
      });
      feedback.hidden = true;
      resetBtn.hidden = true;
    });
  }
}

// ============================================================
// 07 节：原海报点击灯箱放大、可拖查看细节、Esc 关
// ============================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const lightbox = document.getElementById("poster-lightbox");
  const zoomImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const zoomResetBtn = document.getElementById("lightbox-zoom-reset");
  const stage = document.getElementById("lightbox-stage");
  if (!trigger || !posterImg || !lightbox || !zoomImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    zoomImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (stage) stage.style.cursor = scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in";
  }

  function open() {
    if (!zoomImg.getAttribute("src")) zoomImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (ev) => {
    if (ev.target === lightbox || ev.target === stage) close();
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !lightbox.hidden) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(scale + 0.4, 1, 3.2);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(scale - 0.4, 1, 3.2);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  zoomImg.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (Math.abs(tx - stx) > 4 || Math.abs(ty - sty) > 4) return;
    scale = scale < 1.8 ? 2 : 1;
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  zoomImg.addEventListener("pointerdown", (ev) => {
    if (scale <= 1) return;
    ev.preventDefault();
    dragging = true;
    sx = ev.clientX;
    sy = ev.clientY;
    stx = tx;
    sty = ty;
    try { zoomImg.setPointerCapture(ev.pointerId); } catch {}
    applyTransform();
  });
  zoomImg.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    tx = stx + (ev.clientX - sx);
    ty = sty + (ev.clientY - sy);
    applyTransform();
  });
  zoomImg.addEventListener("pointerup", () => {
    dragging = false;
    applyTransform();
  });
}
