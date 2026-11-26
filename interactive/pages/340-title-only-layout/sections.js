// 正文 01–07 节专属交互模块：相邻两节绝不用同一种控件做同一件事。

import { reducedMotion } from "../../lib/stage.js";

// ---------- 01 为什么少字反而更响：口播 vs 屏幕双通道同步演播器 ----------
export function initSec01Channels() {
  const btns = [...document.querySelectorAll("[data-ch-mode]")];
  const visualBar = document.getElementById("ch-visual-bar");
  const audioBar = document.getElementById("ch-audio-bar");
  const collisionZone = document.getElementById("ch-collision");
  const statusEl = document.getElementById("ch-status");
  const explainEl = document.getElementById("ch-explain");
  const previewSlide = document.getElementById("ch-slide-preview");
  if (!btns.length || !visualBar) return;

  const MODES = {
    dense: {
      vWidth: 82,
      aWidth: 86,
      collide: true,
      status: "语言通道冲突 · 观众读字漏听口播（示意）",
      explain:
        "屏幕列出 68 字完整要点，同时你在台上念类似的话。按梅耶（Richard E. Mayer, 2001）冗余原则，文字视觉输入与口播听觉输入挤进同一条语言工作记忆，观众默读速度比你说话快，读完走神或两头都记不牢。",
      slideHtml: `
        <div class="ch-mini-kicker">Q3 策略汇报 · 3/12</div>
        <div class="ch-mini-h dense">关于推进核心产品离线优先架构升级的实施路径</div>
        <ul class="ch-mini-ul">
          <li>第一阶段完成本地数据层迁移与弱网重试机制</li>
          <li>第二阶段实现多端增量合并与冲突自动消解</li>
          <li>第三阶段面向全部存量用户灰度开放离线访问</li>
        </ul>`,
    },
    titleOnly: {
      vWidth: 22,
      aWidth: 88,
      collide: false,
      status: "视觉 1 秒锁焦后退场 · 听觉通道全开（示意）",
      explain:
        "屏幕只亮出一句 8 字大标题。观众 1 秒内抓住方向锚点，视觉读写任务立刻结束，眼神自然回到演讲者身上——屏幕负责「定调」，声音负责「讲故事」，两条通道各司其职。",
      slideHtml: `
        <div class="ch-mini-solo">
          <div class="ch-mini-h solo">全线产品<br>默认离线</div>
          <span class="ch-mini-bar"></span>
        </div>`,
    },
  };

  function setMode(mode) {
    const cfg = MODES[mode] || MODES.dense;
    btns.forEach((b) => {
      const on = b.dataset.chMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    visualBar.style.width = `${cfg.vWidth}%`;
    visualBar.classList.toggle("is-warn", cfg.collide);
    audioBar.style.width = `${cfg.aWidth}%`;
    collisionZone.classList.toggle("is-show", cfg.collide);
    statusEl.textContent = cfg.status;
    statusEl.classList.toggle("is-warn", cfg.collide);
    explainEl.textContent = cfg.explain;
    previewSlide.innerHTML = cfg.slideHtml;
  }

  btns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.chMode)));
  setMode("dense");
}

// ---------- 02 留白与字阶的临界线：后排视距检验仪 + 二维甜点图 ----------
export function initSec02ScaleLab() {
  const distSlider = document.getElementById("sec02-dist");
  const distOut = document.getElementById("sec02-dist-out");
  const tierBtns = [...document.querySelectorAll("[data-scale-tier]")];
  const mockText = document.getElementById("sec02-mock-text");
  const mockFrame = document.getElementById("sec02-mock-frame");
  const mockNote = document.getElementById("sec02-verdict");
  const dot = document.getElementById("sec02-quad-dot");
  const dotLabel = document.getElementById("sec02-quad-label");
  if (!distSlider || !tierBtns.length) return;

  const TIERS = {
    timid: {
      label: "22px 怯弱",
      fs: 22,
      ws: 91,
      qx: 88, // SVG 坐标 x (0-320) 映射留白 35..95
      qy: 158, // SVG 坐标 y (0-190) 映射字阶 18..110
      scalePx: 14,
      verdict: (m) =>
        `距离 ${m}m：22px 字号只占屏约 3%，留白高达 91%。超过 8m 后排已显吃力——留白没有托住标题，反而显得漏排、怯场。`,
      ok: false,
    },
    light: {
      label: "38px 偏轻",
      fs: 38,
      ws: 83,
      qx: 256,
      qy: 128,
      scalePx: 23,
      verdict: (m) =>
        `距离 ${m}m：38px 在小会议室（≤6m）尚可读，但放进 12m 以上礼堂，字重与留白反差偏弱，压不住全场转折。`,
      ok: false,
    },
    balanced: {
      label: "64px 稳健",
      fs: 64,
      ws: 72,
      qx: 204,
      qy: 82,
      scalePx: 38,
      verdict: (m) =>
        `距离 ${m}m：64px 两行舒展、留白约 72%、四边安全距充足。即便退到 18m 后排仍轮廓分明，字有分量、空有呼吸（经验甜点区）。`,
      ok: true,
    },
    cramped: {
      label: "102px 爆框",
      fs: 102,
      ws: 45,
      qx: 72,
      qy: 24,
      scalePx: 54,
      verdict: (m) =>
        `距离 ${m}m：102px 虽远看醒目，却把留白挤剩 45%，文字逼近画框边界。从容气场变成压迫感，投影仪稍有裁边就会切字。`,
      ok: false,
    },
  };

  // 重新按真实线性映射计算坐标 (留白 35%->95% 映射到 x: 36..294；字号 18->110 映射到 y: 162..22)
  Object.values(TIERS).forEach((t) => {
    t.qx = Math.round(36 + ((t.ws - 35) / 60) * 258);
    t.qy = Math.round(162 - ((t.fs - 18) / 92) * 140);
  });

  let curTier = "timid";

  function update() {
    const dist = Number(distSlider.value);
    const t = TIERS[curTier];
    distOut.textContent = `${dist} 米`;
    tierBtns.forEach((b) => {
      const on = b.dataset.scaleTier === curTier;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    // 真实光学视角模拟：距离越远且字号越小，后排分辨越模糊
    const angularSize = t.fs / Math.max(3, dist);
    const blurPx = angularSize < 3.4 ? Math.min(3.4, (3.4 - angularSize) * 1.1) : 0;
    mockText.style.fontSize = `${t.scalePx}px`;
    mockText.style.filter = blurPx > 0.15 ? `blur(${blurPx.toFixed(2)}px)` : "none";
    mockFrame.classList.toggle("is-cramped", curTier === "cramped");
    mockFrame.classList.toggle("is-ok", t.ok);

    mockNote.textContent = t.verdict(dist);
    mockNote.classList.toggle("is-ok", t.ok);

    if (dot && dotLabel) {
      dot.setAttribute("cx", String(t.qx));
      dot.setAttribute("cy", String(t.qy));
      dot.setAttribute("fill", t.ok ? "#5AD1B0" : "#FF635B");
      const lx = t.qx > 200 ? t.qx - 12 : t.qx + 12;
      const ly = t.qy > 140 ? t.qy - 12 : Math.max(30, t.qy + 4);
      dotLabel.setAttribute("x", String(lx));
      dotLabel.setAttribute("y", String(ly));
      dotLabel.setAttribute("text-anchor", t.qx > 200 ? "end" : "start");
      dotLabel.textContent = `${t.fs}px · 留白 ${t.ws}%`;
    }
  }

  distSlider.addEventListener("input", update);
  tierBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curTier = b.dataset.scaleTier;
      update();
    })
  );
  update();
}

// ---------- 03 从高桥流到标准母版：四帧历史胶片标本 ----------
export function initSec03Timeline() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const titleEl = document.getElementById("era-title");
  const metaEl = document.getElementById("era-meta");
  const bodyEl = document.getElementById("era-body");
  const svgHost = document.getElementById("era-svg");
  if (!btns.length || !titleEl) return;

  const ERAS = {
    takahashi: {
      title: "高桥流：没有 PPT 逼出来的巨字 HTML",
      meta: "约 2001 · 高桥征义（Masayoshi Takahashi）· 日本 Ruby 社区",
      body: "日本程序员高桥征义在准备技术演讲时手头没有常规演示软件，索性用纯 HTML 写幻灯片：不放图片、不列要点，每页只有一两个巨大粗体词，像报纸头版一样随语速高频翻页。这种极端做法意外证明——当屏幕只给一个视觉节拍，听众反而全程盯着讲者。",
      svg: `<svg viewBox="0 0 320 180" role="img" aria-label="2001 高桥流巨字单页示意">
        <rect width="320" height="180" fill="#FAF9F6" stroke="#070908" stroke-width="1.5"/>
        <text x="160" y="106" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="68" fill="#070908">简明</text>
        <text x="20" y="24" font-family="IBM Plex Mono, monospace" font-size="10" fill="#52504D">SLIDE 14 / 88 · FAST PACE</text>
        <line x1="20" y1="158" x2="300" y2="158" stroke="#D2CFC8" stroke-width="1"/>
        <rect x="20" y="156" width="52" height="4" fill="#D6322B"/>
      </svg>`,
    },
    tufte: {
      title: "塔夫特炮轰：项目符号如何切碎思考",
      meta: "2003 · 爱德华·塔夫特（Edward Tufte）· 《The Cognitive Style of PowerPoint》",
      body: "信息设计学者爱德华·塔夫特在 2003 年出版小册子（Graphics Press），直指默认的多级项目符号模板把复杂论证切得支离破碎，既降低了纸面信息密度，又催生敷衍的「要点清单文化」。他的批评促使演讲界反思：要么发高密度书面讲义，要么把屏幕彻底留给精炼焦点。",
      svg: `<svg viewBox="0 0 320 180" role="img" aria-label="2003 塔夫特反多级符号批评示意">
        <rect width="320" height="180" fill="#FAF9F6" stroke="#070908" stroke-width="1.5"/>
        <rect x="22" y="22" width="132" height="12" fill="#070908" opacity="0.22"/>
        <circle cx="30" cy="54" r="3" fill="#B2231D"/><rect x="42" y="50" width="190" height="8" fill="#070908" opacity="0.22"/>
        <circle cx="48" cy="74" r="2.5" fill="#B2231D"/><rect x="60" y="70" width="150" height="7" fill="#070908" opacity="0.18"/>
        <circle cx="64" cy="92" r="2" fill="#B2231D"/><rect x="76" y="88" width="130" height="6" fill="#070908" opacity="0.15"/>
        <circle cx="30" cy="116" r="3" fill="#B2231D"/><rect x="42" y="112" width="174" height="8" fill="#070908" opacity="0.22"/>
        <line x1="20" y1="152" x2="296" y2="28" stroke="#D6322B" stroke-width="2.5"/>
        <text x="20" y="164" font-family="IBM Plex Mono, monospace" font-size="10" fill="#B2231D">ANTI-BULLET CRITIQUE · 2003</text>
      </svg>`,
    },
    ooxml: {
      title: "写进国际标准：PresentationML 的 titleOnly 母版",
      meta: "2006 · Ecma International · ECMA-376（Office Open XML）",
      body: "2006 年 12 月发布的 ECMA-376 标准（后成为 ISO/IEC 29500）在幻灯片版式枚举 ST_SlideLayoutType 中正式定义 titleOnly 类型：全页只声明一个标题占位符，刻意取消正文文本框。它既为自由视觉对象腾空舞台，也为纯标题宣言确立了标准骨架。",
      svg: `<svg viewBox="0 0 320 180" role="img" aria-label="2006 OOXML titleOnly 标准占位符骨架">
        <rect width="320" height="180" fill="#FAF9F6" stroke="#070908" stroke-width="1.5"/>
        <rect x="24" y="24" width="272" height="42" fill="#F3F2EF" stroke="#070908" stroke-width="1.5" stroke-dasharray="5 3"/>
        <text x="36" y="50" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="12" fill="#070908">&lt;p:sldLayout type="titleOnly"&gt;</text>
        <rect x="24" y="78" width="272" height="78" fill="none" stroke="#C6C3BC" stroke-width="1" stroke-dasharray="3 4"/>
        <text x="160" y="121" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#52504D">NO BODY PLACEHOLDER</text>
      </svg>`,
    },
    zen: {
      title: "禅意留白：从文字提词器转向视觉舞台",
      meta: "2008 · 加尔·雷诺兹（Garr Reynolds）· 《Presentation Zen》（New Riders）",
      body: "加尔·雷诺兹在 2008 年（初印 2007 年 12 月）出版的《Presentation Zen》里，借日本美学里的「间（Ma）」与克制原则，把「一页只讲一件事、大胆留白、拆掉装饰边框」推广成现代发布会与 TED 演讲的常态语言——仅标题页由此成为全场最锋利的停顿点。",
      svg: `<svg viewBox="0 0 320 180" role="img" aria-label="2008 禅意留白演示构图示意">
        <rect width="320" height="180" fill="#FAF9F6" stroke="#070908" stroke-width="1.5"/>
        <text x="34" y="96" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="24" fill="#070908">留白是节奏的停顿</text>
        <rect x="34" y="108" width="32" height="3" fill="#D6322B"/>
        <circle cx="266" cy="46" r="8" fill="#D6322B"/>
        <line x1="258" y1="54" x2="218" y2="94" stroke="#D6322B" stroke-width="1.5"/>
        <text x="34" y="160" font-family="IBM Plex Mono, monospace" font-size="10" fill="#52504D">ONE IDEA PER SLIDE · 2008</text>
      </svg>`,
    },
  };

  function pick(id) {
    const e = ERAS[id] || ERAS.takahashi;
    btns.forEach((b) => {
      const on = b.dataset.era === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    titleEl.textContent = e.title;
    metaEl.textContent = e.meta;
    bodyEl.textContent = e.body;
    svgHost.innerHTML = e.svg;
  }

  btns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.era)));
  pick("takahashi");
}

// ---------- 04 一句话压住全场四式：四格活体联动构图墙 ----------
export function initSec04FourWall() {
  const phraseBtns = [...document.querySelectorAll("[data-phrase]")];
  const customInput = document.getElementById("sec04-custom");
  const cards = {
    asym: document.getElementById("comp-asym"),
    center: document.getElementById("comp-center"),
    taka: document.getElementById("comp-taka"),
    bottom: document.getElementById("comp-bottom"),
  };
  if (!phraseBtns.length || !cards.asym) return;

  const PHRASES = {
    p1: { l1: "让标题独自发声", l2: "用留白传递重点" },
    p2: { l1: "今年起，全线", l2: "默认离线可用" },
    p3: { l1: "先减法，", l2: "再谈增长" },
    p4: { l1: "如果只留一页，", l2: "你会删掉什么？" },
  };

  function splitTwo(str) {
    const clean = str.trim() || "让标题独自发声";
    if (clean.length <= 6) return { l1: clean, l2: "" };
    const mid = Math.ceil(clean.length / 2);
    return { l1: clean.slice(0, mid), l2: clean.slice(mid) };
  }

  function escapeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderFour(l1, l2) {
    const a = escapeXml(l1);
    const b = escapeXml(l2);
    const single = !b;

    cards.asym.innerHTML = `
      <svg viewBox="0 0 320 180" role="img" aria-label="左齐非对称构图">
        <rect width="320" height="180" fill="#F3F2EF"/>
        <circle cx="268" cy="40" r="8" fill="#D6322B"/>
        <line x1="261" y1="47" x2="218" y2="90" stroke="#D6322B" stroke-width="1.5"/>
        <text x="28" y="${single ? 98 : 84}" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="${single ? 28 : 24}" fill="#070908">${a}</text>
        ${b ? `<text x="28" y="114" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="24" fill="#070908">${b}</text>` : ""}
        <rect x="28" y="${single ? 112 : 126}" width="26" height="3" fill="#D6322B"/>
      </svg>`;

    cards.center.innerHTML = `
      <svg viewBox="0 0 320 180" role="img" aria-label="光学居中构图">
        <rect width="320" height="180" fill="#F3F2EF"/>
        <line x1="160" y1="16" x2="160" y2="30" stroke="#C6C3BC" stroke-width="1"/>
        <line x1="20" y1="84" x2="34" y2="84" stroke="#D6322B" stroke-width="1.2"/>
        <text x="160" y="${single ? 90 : 78}" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="${single ? 26 : 23}" fill="#070908">${a}</text>
        ${b ? `<text x="160" y="108" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="23" fill="#070908">${b}</text>` : ""}
        <rect x="146" y="${single ? 104 : 120}" width="28" height="3" fill="#D6322B"/>
      </svg>`;

    cards.taka.innerHTML = `
      <svg viewBox="0 0 320 180" role="img" aria-label="高桥冲屏构图">
        <rect width="320" height="180" fill="#0B0D0C"/>
        <text x="160" y="${single ? 106 : 84}" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="${single ? 38 : 32}" fill="#FAF9F6">${a}</text>
        ${b ? `<text x="160" y="124" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="32" fill="#FF635B">${b}</text>` : ""}
      </svg>`;

    cards.bottom.innerHTML = `
      <svg viewBox="0 0 320 180" role="img" aria-label="压底留天构图">
        <rect width="320" height="180" fill="#F3F2EF"/>
        <text x="26" y="28" font-family="IBM Plex Mono, monospace" font-size="9" fill="#52504D">UPPER BREATHING FIELD · 62%</text>
        <line x1="26" y1="36" x2="294" y2="36" stroke="#D2CFC8" stroke-width="1" stroke-dasharray="3 3"/>
        <rect x="26" y="${single ? 124 : 108}" width="22" height="3" fill="#D6322B"/>
        <text x="26" y="${single ? 152 : 136}" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="21" fill="#070908">${a}</text>
        ${b ? `<text x="26" y="162" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="21" fill="#070908">${b}</text>` : ""}
      </svg>`;
  }

  phraseBtns.forEach((b) =>
    b.addEventListener("click", () => {
      phraseBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      const p = PHRASES[b.dataset.phrase];
      if (customInput) customInput.value = `${p.l1}${p.l2}`;
      renderFour(p.l1, p.l2);
    })
  );

  if (customInput) {
    customInput.addEventListener("input", () => {
      phraseBtns.forEach((x) => {
        x.classList.remove("is-active");
        x.setAttribute("aria-pressed", "false");
      });
      const { l1, l2 } = splitTwo(customInput.value);
      renderFour(l1, l2);
    });
  }

  renderFour(PHRASES.p1.l1, PHRASES.p1.l2);
}

// ---------- 05 何时该用，何时别用：职场 6 场景分诊翻牌台 ----------
export function initSec05Triage() {
  const cards = [...document.querySelectorAll("[data-triage]")];
  const counterEl = document.getElementById("triage-count");
  if (!cards.length) return;

  const revealed = new Set();
  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      if (open) revealed.add(btn.dataset.triage);
      if (counterEl) {
        counterEl.textContent = `已检视 ${revealed.size} / ${cards.length} 个场景`;
      }
    });
  });
}

// ---------- 06 练手：两道严格单变量盲测 ----------
export function initSec06Quiz() {
  const tabBtns = [...document.querySelectorAll("[data-quiz-tab]")];
  const promptEl = document.getElementById("quiz-prompt");
  const varEl = document.getElementById("quiz-var");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  if (!gridEl || !tabBtns.length) return;

  const QUESTIONS = [
    {
      id: "q1",
      variable: "严格单变量：仅改变字阶与留白比（文案、位置、配色、零冗余全部相同）",
      prompt:
        "200 人产品发布会讲完背景痛点后，你要切出一页仅标题抛出全场唯一核心结论「今年起，所有产品默认离线」。哪一张最能同时兼顾后排清晰度与留白气场？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A",
          metaAfter: "22px · 留白 90% · 偏怯弱",
          reason:
            "虽有 90% 留白，但 22px 字阶在大礼堂后排辨识困难，视觉体量太轻，留白没托住文字，反倒像忘了排完正文。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="34" y="88" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="11" fill="#070908">今年起，所有产品默认离线</text>
            <rect x="34" y="96" width="14" height="2" fill="#D6322B"/></svg>`,
        },
        {
          id: "B",
          label: "方案 B",
          metaAfter: "58px · 留白 72% · 边距 10%",
          reason:
            "答对了！两行断句利落、字高具备远距辨识度，四周留出约 72% 留白与 10% 安全边距，既一眼压场又呼吸从容。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="34" y="80" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="26" fill="#070908">今年起，</text>
            <text x="34" y="112" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="26" fill="#070908">所有产品默认离线</text>
            <rect x="34" y="124" width="28" height="3" fill="#D6322B"/></svg>`,
        },
        {
          id: "C",
          label: "方案 C",
          metaAfter: "92px · 留白 44% · 边距仅 3%",
          reason:
            "乍看最醒目，但字块逼近画框四边（边距仅 3%），留白被压缩到 44%，不仅压迫感强，投影仪稍有缩放偏移就会裁掉字脚。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="10" y="62" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="40" fill="#070908">今年起，所有</text>
            <text x="10" y="110" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="40" fill="#070908">产品默认离线</text>
            <rect x="10" y="128" width="46" height="4" fill="#D6322B"/></svg>`,
        },
        {
          id: "D",
          label: "方案 D",
          metaAfter: "34px · 留白 84% · 气场偏单薄",
          reason:
            "页面干净工整，小会议室还能勉强看清，但作为全场转折宣言页，34px 单行字阶缺乏重量感，镇不住 200 人会场。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="34" y="92" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="16" fill="#070908">今年起，所有产品默认离线</text>
            <rect x="34" y="102" width="20" height="2.5" fill="#D6322B"/></svg>`,
        },
      ],
    },
    {
      id: "q2",
      variable: "严格单变量：仅改变标题文字的提纯尺度（左齐、配色、零冗余全部相同）",
      prompt:
        "季度复盘会上，你要用一页仅标题打断漫长的流量讨论、把高管注意力拉回留存问题。哪一版文案既能一眼扫完，又有足够具体的主张？",
      answer: "C",
      options: [
        {
          id: "A",
          label: "方案 A",
          metaAfter: "27字公文句 · 折 3 行",
          reason:
            "虽没有要点，但把一整段结论塞进标题框仍需要默读 4 秒以上，观众忙着读字，根本无暇听你开口。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="32" y="68" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="16" fill="#070908">结合本季各渠道获客成本与回访</text>
            <text x="32" y="92" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="16" fill="#070908">数据来看当前增长放缓的首要</text>
            <text x="32" y="116" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="16" fill="#070908">瓶颈其实不在拉新而在首周激活</text>
            <rect x="32" y="128" width="24" height="3" fill="#D6322B"/></svg>`,
        },
        {
          id: "B",
          label: "方案 B",
          metaAfter: "17字解释句 · 从句拖尾",
          reason:
            "比公文好一些，但仍带着因果条件从句，读者眼睛要来回扫两遍才能提取主谓宾，冲击力被冲淡了。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="32" y="80" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="20" fill="#070908">我们并不缺新流量，真正拖慢</text>
            <text x="32" y="108" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="20" fill="#070908">增长的是首周流失的七成用户</text>
            <rect x="32" y="122" width="26" height="3" fill="#D6322B"/></svg>`,
        },
        {
          id: "C",
          label: "方案 C",
          metaAfter: "10字对比主张 · 1秒锁焦",
          reason:
            "答对了！保留「不在拉新 / 在首周留存」这一对鲜明判断，1 秒内信息完整落地，具体数字留给口播自然承接。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="32" y="80" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="28" fill="#070908">瓶颈不在拉新，</text>
            <text x="32" y="116" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="28" fill="#070908">在首周留存</text>
            <rect x="32" y="128" width="28" height="3" fill="#D6322B"/></svg>`,
        },
        {
          id: "D",
          label: "方案 D",
          metaAfter: "2字空洞口号 · 缺主语判断",
          reason:
            "削过了头！「留存」二字虽极短极快，却没有表达立场与冲突——走神三秒的听众抬头看屏幕，完全不知你要反驳什么。",
          svg: `<svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#F3F2EF"/>
            <text x="32" y="104" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="40" fill="#070908">留存</text>
            <rect x="32" y="118" width="28" height="3" fill="#D6322B"/></svg>`,
        },
      ],
    },
  ];

  let activeIdx = 0;
  const picked = {};

  function renderQ(idx) {
    activeIdx = idx;
    const q = QUESTIONS[idx];
    const choice = picked[q.id] || null;
    tabBtns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    promptEl.textContent = q.prompt;
    varEl.textContent = q.variable;

    gridEl.innerHTML = q.options
      .map((o) => {
        const isPicked = choice === o.id;
        const isCorrect = o.id === q.answer;
        let cls = "quiz-card";
        if (choice) {
          if (isCorrect) cls += " is-correct";
          else if (isPicked) cls += " is-wrong";
          else cls += " is-muted";
        }
        return `<button type="button" class="${cls}" data-opt="${o.id}" aria-pressed="${isPicked}">
          <span class="quiz-svg">${o.svg}</span>
          <span class="quiz-foot">
            <span class="quiz-opt-id">${o.label}</span>
            <span class="quiz-opt-meta">${choice ? o.metaAfter : "点击选择"}</span>
          </span>
        </button>`;
      })
      .join("");

    gridEl.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[q.id] = btn.dataset.opt;
        renderQ(activeIdx);
      });
    });

    if (!choice) {
      fbEl.className = "quiz-fb";
      fbEl.innerHTML = `<p>四张备选页均隐藏了参数标签，请单凭版式直觉点选一张，选后立即揭晓实测标尺与原因。</p>`;
    } else {
      const sel = q.options.find((o) => o.id === choice);
      const ok = choice === q.answer;
      const rightOpt = q.options.find((o) => o.id === q.answer);
      fbEl.className = `quiz-fb ${ok ? "is-ok" : "is-wrong"}`;
      fbEl.innerHTML = `
        <div class="quiz-fb-head">${ok ? `✓ 判断准确（${sel.label}）` : `× 你选了 ${sel.label} · 最佳为 ${rightOpt.label}`}</div>
        <p>${sel.reason}</p>
        ${!ok ? `<p class="quiz-fb-right"><strong>为什么选 ${rightOpt.label}：</strong>${rightOpt.reason}</p>` : ""}`;
    }
  }

  tabBtns.forEach((b, i) => b.addEventListener("click", () => renderQ(i)));
  renderQ(0);
}

// ---------- 07 原海报灯箱（放大、拖动、Esc 关闭） + 四竖线关键词解剖 ----------
export function initSec07Poster() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const zoomLabel = document.getElementById("lb-zoom-label");
  const kwBtns = [...document.querySelectorAll("[data-poster-kw]")];
  const kwNote = document.getElementById("poster-kw-note");

  // 四枚原海报关键词交互拆解
  const KW_NOTES = {
    minimal:
      "极简 MINIMAL：整张 340 原海报全幅只留冷米白纸面、纯黑字组与三处瑞士红（右上圆点斜线、短红杠、右下焦点圆心），砍掉所有装饰插画与多余说明，本身就是对「信息极简」的现场示范。",
    focus:
      "聚焦 FOCUS：主标「仅标题 / 幻灯片版式」采用极重黑体密排并占据视觉核心，右上 45° 红线像一只无形的手臂把视线斜引回标题左肩，确保第一眼零犹豫。",
    whitespace:
      "留白 WHITESPACE：标题上方、右侧与底部留出超过七成的冷米白宣纸场域，靠四条极细竖线隔开关键词而不画封闭方框，让空气穿过版面自由流动。",
    presence:
      "气场 PRESENCE：巨幅字阶与大面积安静白底形成强烈体量反差；右下角圆环配红心印记压住对角重心，哪怕整页只有寥寥数语，依然稳重、克制、不容忽视。",
  };

  if (kwBtns.length && kwNote) {
    kwBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        kwBtns.forEach((x) => {
          const on = x === btn;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-pressed", String(on));
        });
        kwNote.textContent = KW_NOTES[btn.dataset.posterKw] || "";
      })
    );
  }

  if (!posterImg || !modal || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    lbStage.style.cursor = scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in";
  }

  function openLightbox() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeLightbox() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  function setScale(next) {
    scale = Math.max(1, Math.min(3.5, Number(next.toFixed(2))));
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  }

  openBtn?.addEventListener("click", openLightbox);
  posterImg.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  zoomInBtn?.addEventListener("click", () => setScale(scale + 0.5));
  zoomOutBtn?.addEventListener("click", () => setScale(scale - 0.5));
  resetBtn?.addEventListener("click", () => setScale(1));

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === lbStage) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeLightbox();
  });

  lbStage.addEventListener(
    "wheel",
    (e) => {
      if (modal.hidden) return;
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.25 : -0.25));
    },
    { passive: false }
  );

  lbImg.addEventListener("pointerdown", (e) => {
    if (scale <= 1) {
      setScale(2);
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbImg.setPointerCapture?.(e.pointerId);
    applyTransform();
  });

  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });

  const endDrag = () => {
    dragging = false;
    applyTransform();
  };
  lbImg.addEventListener("pointerup", endDrag);
  lbImg.addEventListener("pointercancel", endDrag);

  if (reducedMotion.matches) {
    lbImg.style.transition = "none";
  }
}
