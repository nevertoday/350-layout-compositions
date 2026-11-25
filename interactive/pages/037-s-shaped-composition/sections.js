// 037 S 形构图 · 正文 01–07 节专属交互模块（sections.js）
// 每一节使用截然不同的交互形式，绝不让相邻两节复用同一种控件套路。

import { loop, pixelRatio } from "../../lib/stage.js";
import { HOGARTH_CURVES, clamp, evaluateHogarthCurve } from "./model.js";

// =========================================================================
// 01 节：四线眼动对照赛跑台（直线 / Z 折线 / C 单弧 / S 双反弯）
// =========================================================================
export function initTrackRace() {
  const canvas = document.getElementById("race-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const playBtn = document.getElementById("race-play");
  const scrub = document.getElementById("race-scrub");
  const readout = document.getElementById("race-readout");
  const modeBtns = [...document.querySelectorAll("[data-race-focus]")];

  let progress = 0.42;
  let playing = true;
  let focusIdx = 3; // 默认聚焦 S 形轨道，可点选任意一条轨单独看减速剖面

  const TRACKS = [
    {
      name: "直线竖排",
      en: "STRAIGHT",
      color: "#6C7D74",
      note: "无任何弯折：速度最快、效率最高，但也最缺少停留和节奏变化。",
      evalPt(p) { return { u: 0.5, v: 0.14 + p * 0.72, brake: 0 }; },
    },
    {
      name: "Z 形折线",
      en: "Z-PATH · 035",
      color: "#C45735",
      note: "两处尖折角迫使视线急停换向：适合速扫转化，但转角生硬有力。",
      evalPt(p) {
        if (p < 0.33) {
          const s = p / 0.33;
          return { u: 0.2 + s * 0.6, v: 0.18, brake: s > 0.85 ? 1 : 0 };
        }
        if (p < 0.67) {
          const s = (p - 0.33) / 0.34;
          return { u: 0.8 - s * 0.6, v: 0.18 + s * 0.64, brake: s < 0.12 || s > 0.88 ? 1 : 0 };
        }
        const s = (p - 0.67) / 0.33;
        return { u: 0.2 + s * 0.6, v: 0.82, brake: s < 0.12 ? 1 : 0 };
      },
    },
    {
      name: "C 形单弧",
      en: "C-ARC · 036",
      color: "#31749A",
      note: "曲率全程同号、始终向心围合：擅长怀抱单一主角，但单边偏重。",
      evalPt(p) {
        const ang = -Math.PI * 0.38 - p * Math.PI * 1.24;
        return { u: 0.58 + Math.cos(ang) * 0.32, v: 0.5 + Math.sin(ang) * 0.36, brake: 0.15 };
      },
    },
    {
      name: "S 形双反弯",
      en: "S-CURVE · 037",
      color: "#0B6B6E",
      accent: "#4D6610",
      note: "唯一拐点让曲率平滑由正翻负：没有尖角急刹，又能借两处缓弯自然串联四层信息。",
      evalPt(p) {
        // 标准正 S 曲线
        const v = 0.14 + p * 0.72;
        const u = 0.5 - Math.sin(p * Math.PI * 2) * 0.27;
        return { u, v, brake: 0 };
      },
    },
  ];

  let W = 720, H = 260, dpr = 1;
  const bgLayer = document.createElement("canvas");
  const bgCtx = bgLayer.getContext("2d", { alpha: false });
  let bgDirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10) return;
    const nw = Math.round(r.width);
    const nh = Math.round(r.height);
    const ndpr = pixelRatio(nw < 520 ? 1.5 : 2);
    const pw = Math.round(nw * ndpr);
    const ph = Math.round(nh * ndpr);
    if (nw !== W || nh !== H || ndpr !== dpr || canvas.width !== pw || canvas.height !== ph) {
      W = nw; H = nh; dpr = ndpr;
      canvas.width = pw; canvas.height = ph;
      bgLayer.width = pw; bgLayer.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgDirty = true;
    }
  }

  function updateReadout() {
    const tr = TRACKS[focusIdx];
    const pct = Math.round(progress * 100);
    if (readout) {
      readout.textContent = `当前对照：${tr.name}（行进 ${pct}%）—— ${tr.note}`;
    }
    if (scrub) scrub.value = String(pct);
    if (playBtn) playBtn.textContent = playing ? "暂停光点" : "播放光点";
    modeBtns.forEach((b, i) => {
      const on = i === focusIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    bgDirty = true;
  }

  function rebuildBg() {
    bgDirty = false;
    const c = bgCtx;
    c.fillStyle = "#FAF8F2";
    c.fillRect(0, 0, W, H);

    const cols = W < 540 ? 2 : 4;
    const rows = cols === 2 ? 2 : 1;
    const cellW = W / cols;
    const cellH = H / rows;

    TRACKS.forEach((tr, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const bx = col * cellW + 12;
      const by = row * cellH + 12;
      const bw = cellW - 24;
      const bh = cellH - 24;
      const isFocus = idx === focusIdx;

      c.save();
      c.fillStyle = isFocus ? "#FFFFFF" : "#F3F0E7";
      c.strokeStyle = isFocus ? tr.color : "rgba(11, 34, 25, 0.14)";
      c.lineWidth = isFocus ? 2 : 1;
      c.beginPath();
      c.roundRect(bx, by, bw, bh, 10);
      c.fill();
      c.stroke();

      c.fillStyle = "#0B2219";
      c.font = '700 12.5px "Noto Serif SC", serif';
      c.textAlign = "left";
      c.textBaseline = "top";
      c.fillText(tr.name, bx + 11, by + 9);
      c.fillStyle = tr.color;
      c.font = '600 9.5px "Space Grotesk", sans-serif';
      c.fillText(tr.en, bx + 11, by + 26);

      const gx = bx + 12, gy = by + 40, gw = bw - 24, gh = bh - 50;
      c.strokeStyle = isFocus ? tr.color : "rgba(11, 34, 25, 0.26)";
      c.lineWidth = isFocus ? 3 : 2;
      c.lineCap = "round";
      c.lineJoin = idx === 1 ? "miter" : "round";
      c.beginPath();
      for (let k = 0; k <= 40; k++) {
        const pt = tr.evalPt(k / 40);
        const px = gx + pt.u * gw;
        const py = gy + pt.v * gh;
        if (k === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();

      for (const np of [0.08, 0.36, 0.64, 0.92]) {
        const pt = tr.evalPt(np);
        c.fillStyle = "#FAF8F2";
        c.strokeStyle = tr.color;
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(gx + pt.u * gw, gy + pt.v * gh, 3.8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.restore();
    });
  }

  let lastScrubInt = -1;
  function draw(_t, dt, { still }) {
    if (bgDirty) rebuildBg();
    if (playing && !still && dt > 0) {
      progress = (progress + dt * 0.22) % 1;
      const pct = Math.round(progress * 100);
      if (scrub && pct !== lastScrubInt) {
        lastScrubInt = pct;
        scrub.value = String(pct);
      }
    }

    ctx.drawImage(bgLayer, 0, 0, W, H);

    const cols = W < 540 ? 2 : 4;
    const rows = cols === 2 ? 2 : 1;
    const cellW = W / cols;
    const cellH = H / rows;

    TRACKS.forEach((tr, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const gx = col * cellW + 24;
      const gy = row * cellH + 52;
      const gw = cellW - 48;
      const gh = cellH - 74;
      const cur = tr.evalPt(progress);
      const cx = gx + cur.u * gw;
      const cy = gy + cur.v * gh;
      if (cur.brake > 0.5) {
        ctx.strokeStyle = "#B4281B";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = tr.color;
      ctx.beginPath();
      ctx.arc(cx, cy, idx === focusIdx ? 6.2 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  resize();
  window.addEventListener("resize", () => { resize(); runner.draw(); });

  const runner = loop(canvas, draw);
  playBtn?.addEventListener("click", () => {
    playing = !playing;
    updateReadout();
    runner.draw();
  });
  scrub?.addEventListener("input", () => {
    playing = false;
    progress = Number(scrub.value) / 100;
    updateReadout();
    runner.draw();
  });
  modeBtns.forEach((b, i) => {
    b.addEventListener("click", () => {
      focusIdx = i;
      updateReadout();
      runner.draw();
    });
  });

  updateReadout();
  runner.draw();
}

// =========================================================================
// 02 节：历史时代石碑切换 + 透视 S 骨架叠加开关
// =========================================================================
export function initHistoryLineage() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const xrayBtn = document.getElementById("era-xray-toggle");
  const titleEl = document.getElementById("era-title");
  const metaEl = document.getElementById("era-meta");
  const bodyEl = document.getElementById("era-body");
  const svgBox = document.getElementById("era-diagram");
  if (!tabs.length || !svgBox) return;

  const ERAS = {
    "1072": {
      title: "北宋·郭熙《早春图》",
      meta: "1072 年（熙宁五年） · 绢本浅设色 158.3 × 108.1 cm · 台北国立故宫博物院藏",
      body: "立轴中景的山岩以卷云皴层层叠起，主峰脊线与山间溪谷隐现出一条由近及远盘旋上行的 S 形气脉。郭熙在《林泉高致》中论「高远、深远、平远」，正是靠这道蜿蜒的云水动线，让观者在纸上获得「可行、可望、可居、可游」的连续游观体验。",
      svg(xray) {
        return `<svg viewBox="0 0 320 230" class="era-svg" aria-hidden="true">
          <rect width="320" height="230" rx="10" fill="#E6EFEA"/>
          <path d="M22 208 L88 128 L138 152 L176 58 L228 118 L296 196 L296 220 L22 220 Z" fill="#2A584A" opacity="0.26"/>
          <path d="M128 196 Q98 164 146 138 Q196 112 162 72 Q142 46 184 26" fill="none" stroke="#18473B" stroke-width="14" stroke-linecap="round" opacity="0.22"/>
          <path d="M56 186 Q104 166 132 146 Q174 116 146 82 Q132 62 174 36" fill="none" stroke="#0B6B6E" stroke-width="5" stroke-linecap="round"/>
          <circle cx="242" cy="48" r="14" fill="#D5BE6A" opacity="0.55"/>
          ${xray ? `<path d="M188 26 C116 42, 114 96, 162 116 C210 136, 202 184, 118 206" fill="none" stroke="#B4281B" stroke-width="3" stroke-dasharray="6 4"/>
          <circle cx="162" cy="116" r="5.5" fill="#B4281B"/>
          <text x="174" y="120" fill="#B4281B" font-size="11" font-weight="700">云水拐点</text>` : ""}
          <text x="18" y="218" fill="#375045" font-size="10.5">溪山卷云 · S 形游观势</text>
        </svg>`;
      },
    },
    "1584": {
      title: "文艺复兴晚期·洛马佐与「蛇形体」",
      meta: "1584 年 · Giovanni Paolo Lomazzo《绘画、雕塑与建筑艺术论》米兰首版",
      body: "意大利画家兼理论家洛马佐总结米开朗基罗等大师的雕塑语言，提出「蛇形体（figura serpentinata）」：人物下肢与躯干沿中轴反向螺旋扭转，如同一簇向上摇曳的火焰。与古典静止对称不同，这种贯穿肩、腰、腿的立体 S 扭势让雕塑从每个角度都生出流畅的动态优雅。",
      svg(xray) {
        // 严格遵守 BRIEF：不画人物五官，以极简雕塑背影剪影 + 火焰螺旋轮廓表达
        return `<svg viewBox="0 0 320 230" class="era-svg" aria-hidden="true">
          <rect width="320" height="230" rx="10" fill="#E6EFEA"/>
          <ellipse cx="160" cy="202" rx="54" ry="10" fill="#215342" opacity="0.18"/>
          <path d="M168 32 C178 32, 184 42, 182 52 C180 60, 172 64, 166 64 C156 64, 152 54, 154 44 C156 36, 162 32, 168 32 Z" fill="#1F4F42" opacity="0.72"/>
          <path d="M148 68 C178 64, 198 78, 188 106 C178 130, 134 142, 140 170 C144 186, 162 194, 178 198 L152 200 C130 192, 118 176, 122 156 C128 128, 164 114, 166 94 C168 82, 156 76, 148 68 Z" fill="#1F4F42" opacity="0.62"/>
          ${xray ? `<path d="M174 34 C132 58, 132 96, 160 116 C188 136, 190 174, 146 198" fill="none" stroke="#B4281B" stroke-width="3" stroke-dasharray="6 4"/>
          <circle cx="160" cy="116" r="5.5" fill="#B4281B"/>
          <text x="172" y="120" fill="#B4281B" font-size="11" font-weight="700">腰脊反向扭轴</text>` : ""}
          <text x="18" y="218" fill="#375045" font-size="10.5">雕塑剪影 · figura serpentinata</text>
        </svg>`;
      },
    },
    "1753": {
      title: "18 世纪·威廉·荷加斯《美的分析》",
      meta: "1745 年自画像预告 · 1753 年《The Analysis of Beauty》伦敦出版",
      body: "英国画家荷加斯先在 1745 年自画像《画家与巴哥犬》（现藏泰特不列颠）的调色板上神秘题写「Line of Beauty」，八年后在专著图版 I 中画下 7 条弧度渐增的 S 曲线，断言第 4 号蛇形线不僵不肿，能「以连续的变化愉悦地引导视线游走」，奠定了现代设计对 S 构图的系统表述。",
      svg(xray) {
        const xs = [66, 98, 130, 162, 194, 226, 258];
        const curves = xs.map((x, idx) => {
          const b = 4 + idx * 6.2;
          const is4 = idx === 3;
          return `<path d="M${x} 32 C${x - b} 66, ${x - b} 98, ${x} 115 C${x + b} 132, ${x + b} 164, ${x} 196" fill="none" stroke="${is4 ? "#0B6B6E" : "#375045"}" stroke-width="${is4 ? 3.5 : 1.5}" opacity="${is4 ? 1 : 0.45}"/>
          <text x="${x}" y="212" text-anchor="middle" fill="${is4 ? "#0B6B6E" : "#375045"}" font-size="10" font-weight="${is4 ? 700 : 400}">${idx + 1}</text>`;
        }).join("");
        return `<svg viewBox="0 0 320 230" class="era-svg" aria-hidden="true">
          <rect width="320" height="230" rx="10" fill="#E6EFEA"/>
          ${curves}
          ${xray ? `<rect x="142" y="22" width="40" height="178" rx="6" fill="none" stroke="#B4281B" stroke-width="2" stroke-dasharray="5 3"/>
          <circle cx="162" cy="115" r="5" fill="#B4281B"/>
          <text x="190" y="42" fill="#B4281B" font-size="11" font-weight="700">4 号标准弧</text>` : ""}
        </svg>`;
      },
    },
    "1923": {
      title: "现代视觉科学·完形连续与曲线偏好",
      meta: "1923 年 Max Wertheimer《完形理论研究 II》 · 2006 年 Bar & Neta《Psychological Science》",
      body: "韦特海默在 1923 年用点列实验确立了「良好连续律（gute Kurve）」：大脑会自动把切线顺滑延续的元素看成同一股流势。2006 年巴尔与内塔的快速判断实验进一步发现，人对平滑曲线轮廓普遍比尖锐棱角更有安全感与审美偏好——这正好解释了 S 构图为何兼具「顺畅引导」与「柔和亲和」。",
      svg(xray) {
        const dots = [];
        for (let i = 0; i <= 14; i++) {
          const p = i / 14;
          const x = 44 + p * 232;
          const y = 115 - Math.sin(p * Math.PI * 2) * 52;
          dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#0B6B6E"/>`);
        }
        return `<svg viewBox="0 0 320 230" class="era-svg" aria-hidden="true">
          <rect width="320" height="230" rx="10" fill="#E6EFEA"/>
          ${dots.join("")}
          ${xray ? `<path d="M44 115 C104 20, 146 66, 160 115 C174 164, 216 210, 276 115" fill="none" stroke="#B4281B" stroke-width="2.5" stroke-dasharray="6 4"/>
          <circle cx="160" cy="115" r="5.5" fill="#B4281B"/>
          <text x="170" y="106" fill="#B4281B" font-size="11" font-weight="700">大脑自动补全连续曲线</text>` : ""}
          <text x="18" y="218" fill="#375045" font-size="10.5">点列知觉 · 良好连续律</text>
        </svg>`;
      },
    },
  };

  let activeEra = "1072";
  let xray = true;

  function render() {
    const e = ERAS[activeEra];
    titleEl.textContent = e.title;
    metaEl.textContent = e.meta;
    bodyEl.textContent = e.body;
    svgBox.innerHTML = e.svg(xray);
    tabs.forEach((t) => {
      const on = t.dataset.era === activeEra;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", String(on));
    });
    if (xrayBtn) {
      xrayBtn.textContent = xray ? "透视 S 骨架：开" : "透视 S 骨架：关";
      xrayBtn.setAttribute("aria-pressed", String(xray));
      xrayBtn.classList.toggle("is-active", xray);
    }
  }

  tabs.forEach((t) => t.addEventListener("click", () => { activeEra = t.dataset.era; render(); }));
  xrayBtn?.addEventListener("click", () => { xray = !xray; render(); });
  render();
}

// =========================================================================
// 03 节：荷加斯 1–7 号弧度尺 + 杂志跨页排字实时映射（深松夜绿暗室）
// =========================================================================
export function initHogarthRuler() {
  const strip = document.getElementById("hogarth-strip");
  const spreadSvg = document.getElementById("hogarth-spread");
  const titleEl = document.getElementById("hog-title");
  const verdictEl = document.getElementById("hog-verdict");
  const useEl = document.getElementById("hog-use");
  const mSwing = document.getElementById("hog-m-swing");
  const mKappa = document.getElementById("hog-m-kappa");
  const mSafe = document.getElementById("hog-m-safe");
  if (!strip || !spreadSvg) return;

  let currentNo = 4;

  // 生成 7 枚并列竖向曲线标本按钮
  strip.innerHTML = HOGARTH_CURVES.map((c) => {
    const ev = evaluateHogarthCurve(c.no);
    const d = ev.sample.pts.map((p, i) => `${i === 0 ? "M" : "L"}${(p.u * 60).toFixed(1)},${(p.v * 110).toFixed(1)}`).join(" ");
    return `<button type="button" class="hog-card${c.isIdeal ? " is-ideal" : ""}" data-hog="${c.no}" aria-pressed="${c.no === currentNo}">
      <span class="hog-num">${String(c.no).padStart(2, "0")}</span>
      <svg viewBox="0 0 60 110" class="hog-mini" aria-hidden="true">
        <line x1="30" y1="8" x2="30" y2="102" stroke="rgba(235,223,197,0.16)" stroke-dasharray="3 3"/>
        <path d="${d}" fill="none" stroke="${c.isIdeal ? "#5AD1D2" : "#BFD05B"}" stroke-width="${c.isIdeal ? 3.2 : 2.2}" stroke-linecap="round"/>
      </svg>
      <span class="hog-mini-tag">${c.no === 4 ? "标准" : c.no <= 2 ? "过缓" : c.no >= 6 ? "过急" : "可用"}</span>
    </button>`;
  }).join("");

  const btns = [...strip.querySelectorAll("[data-hog]")];

  function render() {
    const ev = evaluateHogarthCurve(currentNo);
    btns.forEach((b) => {
      const on = Number(b.dataset.hog) === currentNo;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    titleEl.textContent = `第 ${ev.no} 号曲线 · ${ev.tag}`;
    verdictEl.textContent = ev.verdict;
    useEl.textContent = `适用判断：${ev.use}`;
    mSwing.textContent = `${ev.swingPct}%`;
    mKappa.textContent = `${ev.maxKappa}`;
    mSafe.textContent = `${ev.sideSafePct}% 栏宽`;

    // 实时绘制「把该号曲线放进一张竖版杂志海报」的文字安全区映射
    const W = 280, H = 310;
    const pts = ev.sample.pts;
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(p.u * W).toFixed(1)},${(p.v * H).toFixed(1)}`).join(" ");
    const safeW = Math.max(38, Math.round((ev.sideSafePct / 100) * W));
    const bad = ev.no <= 2 || ev.no >= 6;
    const col = ev.no === 4 ? "#5AD1D2" : bad ? "#FF8674" : "#BFD05B";

    // 四段排字块贴合曲线空腹，演示过急如何把文字挤爆
    const blockH = 26;
    const topRightX = clamp(W - safeW - 14, 150, W - 52);
    const botLeftX = 14;
    spreadSvg.innerHTML = `
      <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="10" fill="#093225" stroke="${bad ? "rgba(255,134,116,0.55)" : "rgba(191,208,91,0.4)"}"/>
      <path d="${pathD}" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" opacity="0.18"/>
      <path d="${pathD}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>
      <rect x="${topRightX}" y="38" width="${safeW}" height="${blockH + 14}" rx="4" fill="rgba(235,223,197,0.12)" stroke="${bad && ev.no >= 6 ? "#FF8674" : "rgba(235,223,197,0.35)"}"/>
      <line x1="${topRightX + 7}" y1="50" x2="${topRightX + safeW - 8}" y2="50" stroke="#EBDFC5" stroke-width="3"/>
      <line x1="${topRightX + 7}" y1="60" x2="${topRightX + safeW - 16}" y2="60" stroke="rgba(235,223,197,0.55)" stroke-width="2"/>
      <rect x="${botLeftX}" y="218" width="${safeW}" height="${blockH + 14}" rx="4" fill="rgba(235,223,197,0.12)" stroke="${bad && ev.no >= 6 ? "#FF8674" : "rgba(235,223,197,0.35)"}"/>
      <line x1="${botLeftX + 7}" y1="230" x2="${botLeftX + safeW - 8}" y2="230" stroke="#EBDFC5" stroke-width="3"/>
      <line x1="${botLeftX + 7}" y1="240" x2="${botLeftX + safeW - 16}" y2="240" stroke="rgba(235,223,197,0.55)" stroke-width="2"/>
      <circle cx="${(pts[40].u * W).toFixed(1)}" cy="${(pts[40].v * H).toFixed(1)}" r="5.5" fill="#EFE8A3" stroke="#042318" stroke-width="1.5"/>
      <text x="${W / 2}" y="${H - 16}" text-anchor="middle" fill="${bad ? "#FFD6CF" : "#D9D2C1"}" font-size="11">
        ${ev.no <= 2 ? "曲线偏直 · 两侧留白单调呆板" : ev.no >= 6 ? "弯腹挤岸 · 侧栏仅剩 " + ev.sideSafePct + "% 宽" : "弯腹与文字安全区协调（" + ev.sideSafePct + "% 栏宽）"}
      </text>
    `;
  }

  btns.forEach((b) => b.addEventListener("click", () => {
    currentNo = Number(b.dataset.hog);
    render();
  }));
  strip.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); currentNo = Math.min(7, currentNo + 1); render(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); currentNo = Math.max(1, currentNo - 1); render(); }
  });
  render();
}

// =========================================================================
// 04 节：四站信息卡牌装配台（互换站位 + 开关同大字号/挤爆留白）
// =========================================================================
export function initNodeAssembler() {
  const board = document.getElementById("asm-board");
  const swapBtn = document.getElementById("asm-swap-entry");
  const flatBtn = document.getElementById("asm-flat-scale");
  const cramBtn = document.getElementById("asm-cram-space");
  const resetBtn = document.getElementById("asm-reset");
  const verdict = document.getElementById("asm-verdict");
  if (!board) return;

  let swapped = false;    // 倒置入口主标与出口二维码
  let flatScale = false;  // 四块信息字号拉成一样大（层级坍塌）
  let cramSpace = false;  // 砍掉呼吸留白（信息墙淹没 S 线）

  function render() {
    board.dataset.swapped = String(swapped);
    board.dataset.flat = String(flatScale);
    board.dataset.cram = String(cramSpace);

    const slot1 = document.getElementById("asm-slot-1");
    const slot4 = document.getElementById("asm-slot-4");
    if (slot1 && slot4) {
      if (swapped) {
        slot1.innerHTML = `<span class="asm-k">01 入口</span><strong>扫码预约</strong><span class="asm-sub">10月18日 · 限席 40 位</span>`;
        slot4.innerHTML = `<span class="asm-k">04 出口</span><strong>秋山茶集</strong><span class="asm-sub">年度器物与溪山品茗展</span>`;
      } else {
        slot1.innerHTML = `<span class="asm-k">01 入口</span><strong>秋山茶集</strong><span class="asm-sub">年度器物与溪山品茗展</span>`;
        slot4.innerHTML = `<span class="asm-k">04 出口</span><strong>扫码预约</strong><span class="asm-sub">10月18日 · 限席 40 位</span>`;
      }
    }

    swapBtn?.setAttribute("aria-pressed", String(swapped));
    swapBtn?.classList.toggle("is-active", swapped);
    flatBtn?.setAttribute("aria-pressed", String(flatScale));
    flatBtn?.classList.toggle("is-active", flatScale);
    cramBtn?.setAttribute("aria-pressed", String(cramSpace));
    cramBtn?.classList.toggle("is-active", cramSpace);

    const issues = [];
    if (swapped) issues.push("入口直接丢出「扫码预约」、把展名压到最底：读者还不知道是什么展就被催促行动，起承转合倒挂");
    if (flatScale) issues.push("四站字号和体量拉成一样大：主次消失，S 形再优雅也串不起层级");
    if (cramSpace) issues.push("河道两侧塞满辅文底块：呼吸留白跌破底线，S 动线被文字墙吞没");

    if (verdict) {
      if (issues.length === 0) {
        verdict.dataset.state = "ok";
        verdict.textContent = "层级顺畅：入口大标领读 → 上弯器物视觉承接 → 下弯展期说明过渡 → 出口扫码自然收尾，留白清晰烘托出 S 曲线骨架。";
      } else {
        verdict.dataset.state = "warn";
        verdict.textContent = `当前问题（${issues.length} 项）：${issues.join("；")}。`;
      }
    }
  }

  swapBtn?.addEventListener("click", () => { swapped = !swapped; render(); });
  flatBtn?.addEventListener("click", () => { flatScale = !flatScale; render(); });
  cramBtn?.addEventListener("click", () => { cramSpace = !cramSpace; render(); });
  resetBtn?.addEventListener("click", () => { swapped = false; flatScale = false; cramSpace = false; render(); });
  render();
}

// =========================================================================
// 05 节：什么时候别用 S 形（三组「硬套翻车 vs 换对骨架」翻牌器）
// =========================================================================
export function initAntiPatterns() {
  const cards = [...document.querySelectorAll("[data-anti-card]")];
  cards.forEach((card) => {
    const btn = card.querySelector("[data-anti-toggle]");
    if (!btn) return;
    let fixed = false;
    const sync = () => {
      card.dataset.mode = fixed ? "good" : "bad";
      btn.setAttribute("aria-pressed", String(fixed));
      btn.textContent = fixed ? "已切回正确骨架 · 点看硬套翻车" : "切看正确骨架";
    };
    btn.addEventListener("click", () => { fixed = !fixed; sync(); });
    sync();
  });
}

// =========================================================================
// 06 节：眼力小测（唯一变量：S 曲线骨架与节点落位，全中性标签 A/B/C/D）
// =========================================================================
export function initQuiz() {
  const opts = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("quiz-feedback");
  const retryBtn = document.getElementById("quiz-retry");
  if (!opts.length || !feedback) return;

  const ANSWER = "B";
  const REASONS = {
    A: "方案 A 虽有柔和弧线，但上下两弯倒向同一侧，缺失中央反向拐点——它其实是 C 形半包围构图，视线单边偏沉，没有形成 S 形的左右对冲节拍。",
    B: "选对了。方案 B 具备唯一中央拐点、双弯摆幅贴近荷加斯 4 号舒展弧度，四站信息紧贴曲线由主到次依次展开，出口轻收在画内，留白约 42% 呼吸通透。",
    C: "方案 C 虽然是双反弯，但弯曲摆幅过急（接近荷加斯 6–7 号发卡弯），曲线急甩顶到左右边缘，大幅挤压文字与留白，视线在弯腹明显顿挫。",
    D: "方案 D 的底图曲线本身并不难看，但信息节点全都漂离河道贴死在画框四角，且出口箭头直冲右下边角把视线甩出画外，曲线与内容彻底脱节。",
  };

  let picked = null;

  function render() {
    opts.forEach((btn) => {
      const k = btn.dataset.quizOpt;
      btn.classList.toggle("is-selected", picked === k);
      btn.classList.toggle("is-correct", picked !== null && k === ANSWER);
      btn.classList.toggle("is-wrong", picked === k && k !== ANSWER);
      btn.setAttribute("aria-pressed", String(picked === k));
    });
    if (!picked) {
      feedback.hidden = true;
      if (retryBtn) retryBtn.hidden = true;
    } else {
      feedback.hidden = false;
      feedback.dataset.state = picked === ANSWER ? "ok" : "warn";
      feedback.innerHTML = `<p class="quiz-fb-head">${picked === ANSWER ? "判断准确 · 方案 B" : `你选了方案 ${picked}，正确答案是方案 B`}</p>
        <p>${REASONS[picked]}</p>
        ${picked !== ANSWER ? `<p class="quiz-fb-note"><strong>为什么选方案 B：</strong>${REASONS.B}</p>` : ""}`;
      if (retryBtn) retryBtn.hidden = false;
    }
  }

  opts.forEach((btn) => btn.addEventListener("click", () => {
    picked = btn.dataset.quizOpt;
    render();
  }));
  retryBtn?.addEventListener("click", () => {
    picked = null;
    render();
  });
  render();
}

// =========================================================================
// 07 节：原海报灯箱（点击放大、鼠标/触摸拖动、缩放、Esc 关，图带 draggable="false"）
// =========================================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const resetBtn = document.getElementById("lightbox-reset");
  const stage = document.getElementById("lightbox-stage");
  if (!posterImg || !dialog || !lbImg) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0;

  const applyTransform = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

  function openLightbox() {
    lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    closeBtn?.focus();
  }

  function closeLightbox() {
    dialog.hidden = true;
    trigger?.focus();
  }

  trigger?.addEventListener("click", openLightbox);
  posterImg.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3.2); applyTransform(); });
  zoomOutBtn?.addEventListener("click", () => { scale = clamp(scale - 0.35, 1, 3.2); if (scale === 1) { tx = 0; ty = 0; } applyTransform(); });
  resetBtn?.addEventListener("click", () => { scale = 1.25; tx = 0; ty = 0; applyTransform(); });

  lbImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbImg.setPointerCapture?.(e.pointerId);
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { dragging = false; });
  lbImg.addEventListener("pointercancel", () => { dragging = false; });
}
