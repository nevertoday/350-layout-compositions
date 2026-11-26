// 220 双向文字排版 · 正文 01–07 节全部独立互动引擎（相邻两节绝不复用同一种控件）

export function mountSections() {
  mountSec01();
  mountSec02();
  mountSec03();
  mountSec04();
  mountSec05();
  mountSec06();
  mountSec07Lightbox();
}

/* -------------------- 01 节：阅读目标切换 + 活体 SVG 视线编号动线图 -------------------- */
function mountSec01() {
  const svg = document.getElementById("s01-svg");
  const readout = document.getElementById("s01-readout");
  const btns = [...document.querySelectorAll("[data-s01-goal]")];
  if (!svg || !readout) return;

  const GOALS = {
    overview: {
      text: "当前目标「全局速览」：眼睛沿水平主轨上沿导引线从左向右一次扫清「概览 → 分类 → 并列 → 扩展」，仅 2 次跳视即可掌握全页骨架，纵向脊柱静候随时下钻。",
      hOp: 1,
      vOp: 0.34,
      path: "M 54 134 L 252 134 L 388 134 L 586 134",
      pts: [
        [86, 134, "1"],
        [236, 134, "2"],
        [320, 134, "+"],
        [548, 134, "3"],
      ],
    },
    deep: {
      text: "当前目标「纵深精读」：跳过横向背景目录，直接顺着垂直脊柱右侧导引线自上而下切入「层级 → 节奏 → 节制 → 深化主题信息」，用单柱纵深锁住注意力。",
      hOp: 0.32,
      vOp: 1,
      path: "M 378 34 L 378 140 L 378 220 L 378 326",
      pts: [
        [378, 56, "1"],
        [378, 126, "2"],
        [378, 180, "+"],
        [378, 296, "3"],
      ],
    },
    dual: {
      text: "当前目标「双向切换」：先沿横向轨左臂扫清结构框架 ①→②，抵达中央电光青「+」枢纽完成 90° 转向 ③，随即顺纵轨垂直切入下半段主题深化 ④——这正是原海报所说的「信息切换」。",
      hOp: 1,
      vOp: 1,
      path: "M 64 134 L 378 134 L 378 320",
      pts: [
        [92, 134, "1"],
        [222, 134, "2"],
        [378, 134, "3"],
        [378, 298, "4"],
      ],
    },
  };

  function draw(goalKey) {
    const g = GOALS[goalKey] || GOALS.overview;
    svg.innerHTML = `
      <rect x="0" y="0" width="640" height="360" fill="#0F1214"/>
      <g stroke="rgba(255,255,255,0.06)" stroke-dasharray="3 4">
        <rect x="28" y="24" width="234" height="106" fill="none"/>
        <rect x="378" y="24" width="234" height="106" fill="none"/>
        <rect x="28" y="230" width="234" height="106" fill="none"/>
        <rect x="378" y="230" width="234" height="106" fill="none"/>
      </g>
      <g opacity="${g.vOp}">
        <rect x="274" y="20" width="92" height="320" fill="rgba(45,200,252,0.06)" stroke="rgba(255,255,255,0.42)"/>
        <text x="320" y="72" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">纵</text>
        <text x="320" y="96" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">向</text>
        <text x="320" y="120" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">路</text>
        <text x="320" y="144" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">径</text>
        <text x="320" y="244" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">深</text>
        <text x="320" y="268" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">化</text>
        <text x="320" y="292" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">主</text>
        <text x="320" y="316" text-anchor="middle" fill="#F4F8FA" font-size="14" font-weight="700">题</text>
      </g>
      <g opacity="${g.hOp}">
        <rect x="24" y="140" width="592" height="80" fill="rgba(45,200,252,0.09)" stroke="rgba(255,255,255,0.55)"/>
        <text x="150" y="176" text-anchor="middle" fill="#FFFFFF" font-size="20" font-weight="900">横向建立框架</text>
        <text x="150" y="202" text-anchor="middle" fill="#2DC8FC" font-size="12">概览 · 分类 · 并列 · 扩展</text>
        <text x="490" y="176" text-anchor="middle" fill="#FFFFFF" font-size="20" font-weight="900">拓展关键信息</text>
        <text x="490" y="202" text-anchor="middle" fill="#2DC8FC" font-size="12">理解 · 连接 · 延伸 · 转化</text>
      </g>
      <rect x="280" y="140" width="80" height="80" fill="#2DC8FC"/>
      <path d="M 304 180 H 336 M 320 164 V 196" stroke="#0B0E10" stroke-width="6"/>
      <path d="${g.path}" fill="none" stroke="#3BE8B0" stroke-width="3" stroke-dasharray="6 5"/>
      ${g.pts
        .map(
          ([x, y, label]) => `
        <g>
          <circle cx="${x}" cy="${y}" r="13" fill="#0B0E10" stroke="#3BE8B0" stroke-width="2.2"/>
          <text x="${x}" y="${y + 4.5}" text-anchor="middle" fill="#3BE8B0" font-size="12" font-weight="700" font-family="IBM Plex Mono, monospace">${label}</text>
        </g>`
        )
        .join("")}
    `;
    readout.textContent = g.text;
    btns.forEach((b) => {
      const active = b.dataset.s01Goal === goalKey;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => draw(b.dataset.s01Goal)));
  draw("overview");
}

/* -------------------- 02 节：可点击 2D 十字坐标板与四象限面积实时核算 -------------------- */
function mountSec02() {
  const pad = document.getElementById("s02-pad");
  const statusEl = document.getElementById("s02-status");
  const coordTag = document.getElementById("s02-coord-tag");
  const titleEl = document.getElementById("s02-verdict-title");
  const bodyEl = document.getElementById("s02-verdict-body");
  const lineH = document.getElementById("s02-line-h");
  const lineV = document.getElementById("s02-line-v");
  const hub = document.getElementById("s02-hub");
  const qEls = {
    nw: document.getElementById("s02-q-nw"),
    ne: document.getElementById("s02-q-ne"),
    sw: document.getElementById("s02-q-sw"),
    se: document.getElementById("s02-q-se"),
  };
  const pEls = {
    nw: document.getElementById("s02-p-nw"),
    ne: document.getElementById("s02-p-ne"),
    sw: document.getElementById("s02-p-sw"),
    se: document.getElementById("s02-p-se"),
  };
  const topoBtns = [...document.querySelectorAll("[data-s02-topo]")];
  if (!pad) return;

  const TOPOS = {
    center: { x: 50, y: 50 },
    golden: { x: 38, y: 58 },
    highbeam: { x: 52, y: 36 },
    crushed: { x: 18, y: 22 },
  };

  function update(xPct, yPct, activeKey = null) {
    const x = Math.max(14, Math.min(86, Math.round(xPct)));
    const y = Math.max(18, Math.min(82, Math.round(yPct)));
    const nwP = Math.round((x * y) / 100);
    const neP = Math.round(((100 - x) * y) / 100);
    const swP = Math.round((x * (100 - y)) / 100);
    const seP = Math.max(0, 100 - nwP - neP - swP);
    const minP = Math.min(nwP, neP, swP, seP);

    lineH.style.top = `${y}%`;
    lineV.style.left = `${x}%`;
    hub.style.left = `${x}%`;
    hub.style.top = `${y}%`;

    const gap = 3;
    Object.assign(qEls.nw.style, { left: "2%", top: "3%", width: `${Math.max(4, x - 2 - gap)}%`, height: `${Math.max(6, y - 3 - gap)}%` });
    Object.assign(qEls.ne.style, { left: `${x + gap}%`, top: "3%", width: `${Math.max(4, 98 - x - gap)}%`, height: `${Math.max(6, y - 3 - gap)}%` });
    Object.assign(qEls.sw.style, { left: "2%", top: `${y + gap}%`, width: `${Math.max(4, x - 2 - gap)}%`, height: `${Math.max(6, 97 - y - gap)}%` });
    Object.assign(qEls.se.style, { left: `${x + gap}%`, top: `${y + gap}%`, width: `${Math.max(4, 98 - x - gap)}%`, height: `${Math.max(6, 97 - y - gap)}%` });

    const vals = { nw: nwP, ne: neP, sw: swP, se: seP };
    for (const k of ["nw", "ne", "sw", "se"]) {
      pEls[k].textContent = `${vals[k]}%`;
      qEls[k].classList.toggle("is-tight", vals[k] < 10);
    }

    coordTag.textContent = `ANCHOR X ${x}% · Y ${y}%`;
    const isEdge = x < 34 || x > 66 || y < 34 || y > 68;
    statusEl.classList.toggle("is-err", isEdge);

    if (isEdge) {
      statusEl.textContent = `边缘挤压 · 最小区 ${minP}%`;
      titleEl.textContent = `交汇点过偏，最小象限塌缩到 ${minP}%，短臂文字空间告急`;
      bodyEl.textContent = `当交汇坐标落出 34%–66%（横）或 34%–68%（纵）的安全带时，相邻的一侧横臂或纵臂会严重缩短，文字被迫硬挤换行，而对角象限又会空出 ${Math.max(nwP, neP, swP, seP)}% 的大片失衡空白。`;
    } else if (Math.abs(x - 50) <= 5 && Math.abs(y - 50) <= 6) {
      statusEl.textContent = "中央均势 · 稳定";
      titleEl.textContent = "四象限等分稳定，适合概念宣言与对称总览页";
      bodyEl.textContent = `当前四区占比为 NW ${nwP}% / NE ${neP}% / SW ${swP}% / SE ${seP}%。四条轨道臂长度均衡，视觉重心最沉稳，适合像 220 原海报一样在四角均匀安放四组同等权重的要点说明。`;
    } else if (y <= 42) {
      statusEl.textContent = "高梁展板 · 宽阔下场";
      titleEl.textContent = "横轨上提，下方留出宽敞的纵深阐释空间";
      bodyEl.textContent = `横向框架高挂上方（SW ${swP}% + SE ${seP}% 合计占下方 ${swP + seP}% 面积），视觉重心略高而挺拔，非常适合建筑展板、画册扉页或带底部大图/摘要的发布页。`;
    } else {
      statusEl.textContent = "偏轴张力 · 平衡";
      titleEl.textContent = "非对称偏心交汇，制造灵动而可控的版面张力";
      bodyEl.textContent = `交汇点刻意偏离几何中心（四区 ${nwP}/${neP}/${swP}/${seP}%），既保留最小区 ${minP}% 的充足呼吸缝，又让最大象限承担主视觉或留白，比正中十字更有杂志编辑感。`;
    }

    topoBtns.forEach((b) => {
      const act = b.dataset.s02Topo === activeKey;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
  }

  pad.addEventListener("click", (ev) => {
    const r = pad.getBoundingClientRect();
    const xp = ((ev.clientX - r.left) / r.width) * 100;
    const yp = ((ev.clientY - r.top) / r.height) * 100;
    update(xp, yp, null);
  });

  topoBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const t = TOPOS[b.dataset.s02Topo];
      if (t) update(t.x, t.y, b.dataset.s02Topo);
    })
  );

  update(50, 50, "center");
}

/* -------------------- 03 节：历史时间轴 + 真浏览器 CSS Writing-Mode/BiDi 沙盒 -------------------- */
function mountSec03() {
  const eraBtns = [...document.querySelectorAll("[data-era]")];
  const yearEl = document.getElementById("s03-era-year");
  const badgeEl = document.getElementById("s03-era-badge");
  const titleEl = document.getElementById("s03-era-title");
  const bodyEl = document.getElementById("s03-era-body");
  const specEl = document.getElementById("s03-era-specimen");

  const ERAS = {
    1926: {
      year: "1926 · 上海",
      badge: "双语画报横竖并置",
      title: "《良友》画报：中英竖横同页共存",
      body: "1926 年 2 月由伍联德在上海创办的《良友》画报（The Young Companion）大量采用中英双语编排：中文正文与题记遵循传统竖排，英文标题与图注采取左起横排，并在跨页中与横竖错落的摄影画面协同构图，让现代东亚读者习惯在同一视野里流畅切换两种文字轴向。",
      vert: "良友画报",
      hTitle: "THE YOUNG COMPANION · SHANGHAI 1926",
      hDesc: "中文竖列承接书卷惯性，英文横栏构建现代画报坐标。",
    },
    1955: {
      year: "1955 · 北京",
      badge: "现代报刊横排确立",
      title: "《光明日报》改横排：横主纵辅的分工起点",
      body: "1955 年 1 月 1 日，《光明日报》率先由传统直排全面改为自左向右横排，成为中国首家全面改用横排的全国性报纸，此后全国主流报刊相继跟进。随着横排成为日常信息浏览主路径，竖排逐步在封面、标题与导视中承担起「视觉刹停与主题深化」的第二轴角色。",
      vert: "版面革新",
      hTitle: "HORIZONTAL READING STANDARD · 1955",
      hDesc: "横排接管高速信息扫视，竖排凝练为重点锚点与节奏变化。",
    },
    2009: {
      year: "2009 / 2015 / 2020 · W3C",
      badge: "东亚数字排版需求文档",
      title: "JLREQ 与 CLREQ：把横竖混排写进国际技术规范",
      body: "W3C 于 2009 年 6 月 4 日发布《日语排版需求》（JLREQ，2020 年 8 月 11 日发布第二版），并于 2015 年起持续起草《中文排版需求》（CLREQ），系统梳理了东亚出版物中横排（horizontal）、直排（vertical）以及两者在同一版面协同排布时的网格、标点与对齐规则。",
      vert: "东亚版面",
      hTitle: "W3C JLREQ & CLREQ SPECIFICATIONS",
      hDesc: "从传统铅排与写植经验提炼出可工程实现的数字排版规则。",
    },
    2019: {
      year: "2019-12-10 · W3C Recommendation",
      badge: "正交流成为网页原生标准",
      title: "CSS Writing Modes Level 3：浏览器原生支持正交双轴",
      body: "2019 年 12 月 10 日，由 Elika J. Etemad 与 Koji Ishii 编辑的 W3C《CSS Writing Modes Level 3》正式成为推荐标准。它明确定义了 horizontal-tb、vertical-rl、vertical-lr 以及它们交错形成「正交流（Orthogonal Flows）」时的尺寸与盒模型计算，让网页无需切图即可原生实现双向排版。",
      vert: "正交共生",
      hTitle: "CSS WRITING MODES LEVEL 3 · W3C REC",
      hDesc: "真实文本既可选中搜索，又能在同一网格内横纵交汇。",
    },
  };

  function showEra(key) {
    const e = ERAS[key] || ERAS["1926"];
    yearEl.textContent = e.year;
    badgeEl.textContent = e.badge;
    titleEl.textContent = e.title;
    bodyEl.textContent = e.body;
    specEl.innerHTML = `<div class="era-spec-vert">${e.vert}</div><div class="era-spec-horiz"><strong lang="en">${e.hTitle}</strong><span>${e.hDesc}</span></div>`;
    eraBtns.forEach((b) => {
      const act = b.dataset.era === key;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-selected", String(act));
    });
  }
  eraBtns.forEach((b) => b.addEventListener("click", () => showEra(b.dataset.era)));
  showEra("1926");

  // 真 CSS 沙盒切换
  const modeBtns = [...document.querySelectorAll("[data-s03-mode]")];
  const hBox = document.getElementById("s03-h-box");
  const vBox = document.getElementById("s03-v-box");
  const codeEl = document.getElementById("s03-css-code");
  if (!hBox || !vBox || !codeEl) return;

  function applyCssMode(mode) {
    if (mode === "ortho-rl") {
      hBox.removeAttribute("dir");
      hBox.textContent = "横向框架：建立整体浏览结构 2026";
      vBox.style.writingMode = "vertical-rl";
      vBox.style.display = "block";
      vBox.textContent = "纵向深化主题路径";
      codeEl.textContent = ".h-track { writing-mode: horizontal-tb; }\n.v-track { writing-mode: vertical-rl; } /* 东亚右起正交纵轴 */";
    } else if (mode === "ortho-lr") {
      hBox.removeAttribute("dir");
      hBox.textContent = "横向框架：现代左起网页与导视系统";
      vBox.style.writingMode = "vertical-lr";
      vBox.style.display = "block";
      vBox.textContent = "左起纵轴导览";
      codeEl.textContent = ".h-track { writing-mode: horizontal-tb; }\n.v-track { writing-mode: vertical-lr; } /* 现代左起正交纵轴 */";
    } else {
      hBox.setAttribute("dir", "rtl");
      hBox.textContent = "مرحبا بالعالم — Layout 220 (UAX #9 RTL + LTR 同行混排)";
      vBox.style.writingMode = "horizontal-tb";
      vBox.style.display = "none";
      codeEl.textContent = "/* Unicode UAX #9 严格定义的 Bidirectional (BiDi) */\n.bidi-line { direction: rtl; unicode-bidi: isolate; }";
    }
    modeBtns.forEach((b) => {
      const act = b.dataset.s03Mode === mode;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
  }
  modeBtns.forEach((b) => b.addEventListener("click", () => applyCssMode(b.dataset.s03Mode)));
  applyCssMode("ortho-rl");
}

/* -------------------- 04 节：四维独立开关驱动实时版面样卡 -------------------- */
function mountSec04() {
  const slide = document.getElementById("s04-slide");
  const verdict = document.getElementById("s04-verdict");
  const vBadge = document.getElementById("s04-verdict-badge");
  const vText = document.getElementById("s04-verdict-text");
  const btns = [...document.querySelectorAll("[data-s04-knob]")];
  if (!slide) return;

  const knobs = { weight: true, scale: true, density: true, unity: true };
  const LABELS = {
    weight: ["已拉开：极粗 / 中轻", "已拉平：两轴同粗"],
    scale: ["已拉开：1.7× 字阶", "已拉平：两轴同大"],
    density: ["已拉开：横舒 / 纵节制", "已拉平：同距挤排"],
    unity: ["统一：同系蓝图", "割裂：异色杂拼"],
  };

  function sync() {
    slide.classList.toggle("is-weight", knobs.weight);
    slide.classList.toggle("is-scale", knobs.scale);
    slide.classList.toggle("is-density", knobs.density);
    slide.classList.toggle("is-unity", knobs.unity);

    btns.forEach((b) => {
      const k = b.dataset.s04Knob;
      const on = knobs[k];
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? LABELS[k][0] : LABELS[k][1];
    });

    const count = Object.values(knobs).filter(Boolean).length;
    verdict.classList.toggle("is-err", count < 4);
    if (count === 4) {
      vBadge.textContent = "4/4 节奏鲜明且归属统一";
      vText.textContent = "粗细、大小、疏密三层对比全部成立，色彩与线框保持同一语言：一眼先抓横向大骨架，再自然顺着电光青枢纽切入纵向专题。";
    } else if (!knobs.unity) {
      vBadge.textContent = `${count}/4 色彩与元素归属割裂`;
      vText.textContent = "纵轴换成了暖橘圆角卡片且失去电光青枢纽，哪怕其他对比都在，人眼还是会把它当成硬贴上去的异物层。";
    } else {
      const missing = [
        !knobs.weight && "粗细",
        !knobs.scale && "大小",
        !knobs.density && "疏密",
      ].filter(Boolean);
      vBadge.textContent = `${count}/4 缺少${missing.join("与")}对比`;
      vText.textContent = `把${missing.join("、")}拉平后，横竖两条轨道的视觉节奏趋同，版面失去张力，退化成两根生硬交叉的同等字条。`;
    }
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.s04Knob;
      knobs[k] = !knobs[k];
      sync();
    })
  );
  sync();
}

/* -------------------- 05 节：什么时候别用（4 张独立翻转止损卡） -------------------- */
function mountSec05() {
  const ITEMS = {
    longtext: {
      badDesc: "失效原因：长段正文需要稳定的单一扫视节奏。把几百字强行劈成横竖交叉，读者每隔几行就得重新找起行点，阅读速度和理解率明显下降。",
      goodDesc: "恰当改法：正文全部回归舒适的单向横排阅读流（配合 25–35 字行宽），只把竖排收回到章节页眉编号或书签装饰，不打断连续阅读。",
      badSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="14" y="12" width="142" height="80" fill="none" stroke="#FF6B6B" stroke-dasharray="3 3"/><line x1="22" y1="26" x2="146" y2="26" stroke="#B8C5CD" stroke-width="4"/><line x1="22" y1="40" x2="146" y2="40" stroke="#B8C5CD" stroke-width="4"/><line x1="22" y1="54" x2="146" y2="54" stroke="#B8C5CD" stroke-width="4"/><line x1="22" y1="68" x2="112" y2="68" stroke="#B8C5CD" stroke-width="4"/><rect x="164" y="10" width="98" height="84" fill="rgba(255,107,107,0.12)" stroke="#FF6B6B"/><line x1="184" y1="18" x2="184" y2="86" stroke="#FF6B6B" stroke-width="4"/><line x1="204" y1="18" x2="204" y2="86" stroke="#FF6B6B" stroke-width="4"/><line x1="224" y1="18" x2="224" y2="86" stroke="#FF6B6B" stroke-width="4"/><line x1="244" y1="18" x2="244" y2="70" stroke="#FF6B6B" stroke-width="4"/></svg>`,
      goodSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="14" y="14" width="252" height="76" fill="rgba(59,232,176,0.08)" stroke="#3BE8B0"/><line x1="28" y1="30" x2="140" y2="30" stroke="#3BE8B0" stroke-width="6"/><line x1="28" y1="48" x2="246" y2="48" stroke="#E4EDF2" stroke-width="4"/><line x1="28" y1="62" x2="246" y2="62" stroke="#E4EDF2" stroke-width="4"/><line x1="28" y1="76" x2="196" y2="76" stroke="#E4EDF2" stroke-width="4"/></svg>`,
    },
    dashboard: {
      badDesc: "失效原因：数字对比高度依赖同向对齐（小数点、列头、时间轴）。强插竖排文字柱不仅浪费屏幕宽度，还打断横向行扫核对。",
      goodDesc: "恰当改法：全部采用左起横排配合等宽数字（tabular-nums）与清晰的列对齐，让多行指标一眼纵向比大小、横向看趋势。",
      badSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="116" y="8" width="44" height="88" fill="rgba(255,107,107,0.2)" stroke="#FF6B6B"/><text x="138" y="34" text-anchor="middle" fill="#FF6B6B" font-size="11">指</text><text x="138" y="54" text-anchor="middle" fill="#FF6B6B" font-size="11">标</text><text x="138" y="74" text-anchor="middle" fill="#FF6B6B" font-size="11">阻</text><text x="138" y="90" text-anchor="middle" fill="#FF6B6B" font-size="11">断</text><line x1="16" y1="30" x2="108" y2="30" stroke="#8F9EA8" stroke-width="5"/><line x1="170" y1="30" x2="262" y2="30" stroke="#8F9EA8" stroke-width="5"/><line x1="16" y1="54" x2="108" y2="54" stroke="#8F9EA8" stroke-width="5"/><line x1="170" y1="54" x2="262" y2="54" stroke="#8F9EA8" stroke-width="5"/><line x1="16" y1="78" x2="108" y2="78" stroke="#8F9EA8" stroke-width="5"/><line x1="170" y1="78" x2="262" y2="78" stroke="#8F9EA8" stroke-width="5"/></svg>`,
      goodSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="14" y="12" width="252" height="80" fill="none" stroke="#3BE8B0"/><line x1="14" y1="34" x2="266" y2="34" stroke="#3BE8B0"/><text x="26" y="27" fill="#3BE8B0" font-size="11" font-family="IBM Plex Mono, monospace">ITEM       Q1      Q2      DIFF</text><text x="26" y="54" fill="#F4F8FA" font-size="11" font-family="IBM Plex Mono, monospace">Active   12.4k   15.8k   +27.4%</text><text x="26" y="78" fill="#F4F8FA" font-size="11" font-family="IBM Plex Mono, monospace">Retain   64.2%   71.0%    +6.8%</text></svg>`,
    },
    narrow: {
      badDesc: "失效原因：在 360px 窄卡里再劈出一条竖轨，横向剩余行宽往往只剩五六个字，频繁换行会把完整语义切碎。",
      goodDesc: "恰当改法：窄屏卡片老老实实走「上标签 → 中标题 → 下摘要」的单一纵向卡片堆叠，每行文字保持横排完整舒展。",
      badSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="86" y="8" width="108" height="88" fill="#151A1D" stroke="#FF6B6B"/><rect x="92" y="14" width="28" height="76" fill="rgba(255,107,107,0.22)" stroke="#FF6B6B"/><line x1="128" y1="28" x2="184" y2="28" stroke="#E4EDF2" stroke-width="4"/><line x1="128" y1="42" x2="178" y2="42" stroke="#E4EDF2" stroke-width="4"/><line x1="128" y1="56" x2="182" y2="56" stroke="#E4EDF2" stroke-width="4"/><line x1="128" y1="70" x2="162" y2="70" stroke="#E4EDF2" stroke-width="4"/></svg>`,
      goodSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="78" y="8" width="124" height="88" fill="#151A1D" stroke="#3BE8B0"/><rect x="88" y="18" width="44" height="10" fill="#3BE8B0"/><line x1="88" y1="44" x2="190" y2="44" stroke="#FFFFFF" stroke-width="6"/><line x1="88" y1="62" x2="186" y2="62" stroke="#B8C5CD" stroke-width="4"/><line x1="88" y1="76" x2="166" y2="76" stroke="#B8C5CD" stroke-width="4"/></svg>`,
    },
    latin: {
      badDesc: "失效原因：拉丁字母靠词形轮廓连读，长英文逐字竖叠几乎无法辨认，侧转 90° 又迫使读者歪头（西文竖排边界详见 218 与 219）。",
      goodDesc: "恰当改法：把英文长句留给横向轨道，纵轨改用简短有力的中文核心词组（4–8 字），或者仅在端角配极短全大写英文标签。",
      badSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="114" y="6" width="52" height="92" fill="rgba(255,107,107,0.14)" stroke="#FF6B6B"/><text x="140" y="20" text-anchor="middle" fill="#FF6B6B" font-size="10" font-family="IBM Plex Mono, monospace">b i d i</text><text x="140" y="36" text-anchor="middle" fill="#FF6B6B" font-size="10" font-family="IBM Plex Mono, monospace">r e c t</text><text x="140" y="52" text-anchor="middle" fill="#FF6B6B" font-size="10" font-family="IBM Plex Mono, monospace">i o n a</text><text x="140" y="68" text-anchor="middle" fill="#FF6B6B" font-size="10" font-family="IBM Plex Mono, monospace">l t e x</text><text x="140" y="84" text-anchor="middle" fill="#FF6B6B" font-size="10" font-family="IBM Plex Mono, monospace">t . . .</text></svg>`,
      goodSvg: `<svg viewBox="0 0 280 104"><rect width="280" height="104" fill="#0E1113"/><rect x="18" y="34" width="244" height="36" fill="rgba(45,200,252,0.1)" stroke="#3BE8B0"/><text x="80" y="56" text-anchor="middle" fill="#FFFFFF" font-size="11" font-family="Space Grotesk, sans-serif">SYSTEM OVERVIEW</text><rect x="150" y="8" width="44" height="88" fill="#151A1D" stroke="#3BE8B0"/><text x="172" y="32" text-anchor="middle" fill="#3BE8B0" font-size="12" font-weight="700">纵</text><text x="172" y="50" text-anchor="middle" fill="#3BE8B0" font-size="12" font-weight="700">深</text><text x="172" y="68" text-anchor="middle" fill="#3BE8B0" font-size="12" font-weight="700">主</text><text x="172" y="86" text-anchor="middle" fill="#3BE8B0" font-size="12" font-weight="700">题</text></svg>`,
    },
  };

  for (const key of Object.keys(ITEMS)) {
    const card = document.querySelector(`[data-avoid="${key}"]`);
    const btn = document.querySelector(`[data-avoid-btn="${key}"]`);
    const vis = document.getElementById(`avoid-vis-${key}`);
    const desc = document.getElementById(`avoid-desc-${key}`);
    if (!card || !btn || !vis || !desc) continue;

    let fixed = false;
    const render = () => {
      card.classList.toggle("is-bad", !fixed);
      card.classList.toggle("is-fixed", fixed);
      btn.setAttribute("aria-pressed", String(fixed));
      btn.textContent = fixed ? "回看失效现场" : "改为恰当排法";
      vis.innerHTML = fixed ? ITEMS[key].goodSvg : ITEMS[key].badSvg;
      desc.textContent = fixed ? ITEMS[key].goodDesc : ITEMS[key].badDesc;
    };
    btn.addEventListener("click", () => {
      fixed = !fixed;
      render();
    });
    render();
  }
}

/* -------------------- 06 节：两轮单变量盲测小练习（中性标签 A/B/C/D） -------------------- */
function mountSec06() {
  const grid = document.getElementById("s06-grid");
  const promptEl = document.getElementById("s06-prompt");
  const roundTag = document.getElementById("s06-round-tag");
  const fbBox = document.getElementById("s06-feedback");
  const fbTitle = document.getElementById("s06-fb-title");
  const fbBody = document.getElementById("s06-fb-body");
  const nextBtn = document.getElementById("s06-next");
  const resetBtn = document.getElementById("s06-reset");
  if (!grid) return;

  function makeMiniCrossSvg({ cx = 120, cy = 90, hH = 34, vW = 36, hubS = 32, flat = false, split = false, hTxt = "建筑双年展", vTxt = "深港策展" }) {
    const vFill = split ? "rgba(245,158,61,0.28)" : "rgba(45,200,252,0.06)";
    const vStroke = split ? "#F59E3D" : "rgba(255,255,255,0.42)";
    const hubFill = split ? "#29221D" : "#2DC8FC";
    const plusCol = split ? "#F59E3D" : "#0B0E10";
    const hFs = flat ? 11 : 14.5;
    const vFs = flat ? 11 : 10;
    const hFw = flat ? 500 : 900;
    const vFw = flat ? 500 : 400;
    const lx = cx - hubS / 2;
    const rx = cx + hubS / 2;
    const ty = cy - hubS / 2;
    const by = cy + hubS / 2;
    const leftCenter = (10 + lx) / 2;
    const rightCenter = (rx + 230) / 2;
    const vChars = [...vTxt];
    const vTopY = (12 + ty) / 2;
    const vBotY = (by + 168) / 2;
    const subTag = flat
      ? ""
      : `<text x="${leftCenter}" y="${cy + 14}" text-anchor="middle" fill="#2DC8FC" font-size="7.5">结构 · 索引</text><text x="${rightCenter}" y="${cy + 14}" text-anchor="middle" fill="#2DC8FC" font-size="7.5">延伸 · 展开</text>`;

    return `
      <svg class="quiz-svg" viewBox="0 0 240 180" aria-hidden="true">
        <rect width="240" height="180" fill="#0D1012"/>
        <rect x="${cx - vW / 2}" y="10" width="${vW}" height="160" fill="${vFill}" stroke="${vStroke}" stroke-width="${split ? 1.8 : 1}"/>
        <rect x="10" y="${cy - hH / 2}" width="220" height="${hH}" fill="rgba(45,200,252,0.09)" stroke="rgba(255,255,255,0.52)"/>
        <clipPath id="cl-${cx}-${cy}-${hH}"><rect x="12" y="${cy - hH / 2}" width="${Math.max(4, lx - 14)}" height="${hH}"/></clipPath>
        <text x="${leftCenter}" y="${cy + (flat ? 4 : 1)}" text-anchor="middle" fill="#FFFFFF" font-size="${hFs}" font-weight="${hFw}" clip-path="url(#cl-${cx}-${cy}-${hH})">${hTxt}</text>
        <text x="${rightCenter}" y="${cy + (flat ? 4 : 1)}" text-anchor="middle" fill="#FFFFFF" font-size="${hFs}" font-weight="${hFw}">空间叙事</text>
        ${subTag}
        <text x="${cx}" y="${vTopY - 4}" text-anchor="middle" fill="${split ? "#FFD29E" : "#D4E4EC"}" font-size="${vFs}" font-weight="${vFw}">${vChars[0] || ""}</text>
        <text x="${cx}" y="${vTopY + 10}" text-anchor="middle" fill="${split ? "#FFD29E" : "#D4E4EC"}" font-size="${vFs}" font-weight="${vFw}">${vChars[1] || ""}</text>
        <text x="${cx}" y="${vBotY - 4}" text-anchor="middle" fill="${split ? "#FFD29E" : "#D4E4EC"}" font-size="${vFs}" font-weight="${vFw}">${vChars[2] || ""}</text>
        <text x="${cx}" y="${vBotY + 10}" text-anchor="middle" fill="${split ? "#FFD29E" : "#D4E4EC"}" font-size="${vFs}" font-weight="${vFw}">${vChars[3] || ""}</text>
        <rect x="${lx}" y="${ty}" width="${hubS}" height="${hubS}" fill="${hubFill}"/>
        <path d="M ${cx - hubS * 0.24} ${cy} H ${cx + hubS * 0.24} M ${cx} ${cy - hubS * 0.24} V ${cy + hubS * 0.24}" stroke="${plusCol}" stroke-width="3.2"/>
      </svg>`;
  }

  const ROUNDS = [
    {
      prompt: "第 1 / 2 题：《深港建筑双年展》主视觉页。四版文字一字不差，每版只差一个关键结构变量——选出横纵真正共生、读起来最顺的那一版。",
      answer: "C",
      options: [
        {
          id: "A",
          svg: makeMiniCrossSvg({ cx: 110, cy: 90, hH: 34, vW: 36, hubS: 30, flat: true }),
          reason: "方案 A 把横纵字号与字重完全拉平（节奏对比缺失），虽然交汇点居中，但两轴像机械转了 90° 的同等字条，缺乏主次张力。",
        },
        {
          id: "B",
          svg: makeMiniCrossSvg({ cx: 52, cy: 48, hH: 36, vW: 32, hubS: 30 }),
          reason: "方案 B 的交汇点被硬推到左上角（交汇偏隅挤臂），左横臂与上纵臂严重缩水，标题直接被裁切挤压。",
        },
        {
          id: "C",
          svg: makeMiniCrossSvg({ cx: 108, cy: 90, hH: 40, vW: 32, hubS: 32 }),
          reason: "判断准确！方案 C 同时满足四项要点：交汇稳落黄金偏中区、横主纵辅主次清晰、字号粗细拉开节奏反差，且通篇共用统一电光青蓝图语法。",
        },
        {
          id: "D",
          svg: makeMiniCrossSvg({ cx: 110, cy: 90, hH: 38, vW: 34, hubS: 32, split: true }),
          reason: "方案 D 纵轴突兀改用暖橘实心框并弱化了电光青交汇锚点（归属割裂），看起来像两套无关视觉语言拼在一起。",
        },
      ],
    },
    {
      prompt: "第 2 / 2 题：《年度产品架构总览》幻灯片。同样只差一个变量——这次请注意反向过头的错态，选出真正平衡的那一版。",
      answer: "B",
      options: [
        {
          id: "A",
          svg: makeMiniCrossSvg({ cx: 120, cy: 90, hH: 20, vW: 86, hubS: 28, hTxt: "架构总览", vTxt: "深度重构" }),
          reason: "方案 A 属于反向过头的「副轴吞没」：纵轨膨胀成宽墙，把横向主轨挤成细弱一行，双向共生退化成单向压制。",
        },
        {
          id: "B",
          svg: makeMiniCrossSvg({ cx: 120, cy: 90, hH: 42, vW: 34, hubS: 34, hTxt: "架构总览", vTxt: "深度重构" }),
          reason: "判断准确！方案 B 横向框架厚实稳健、纵向专题轻快节制、电光青「+」枢纽与轨宽精准咬合，观众可轻松在全局与纵深间自由切换。",
        },
        {
          id: "C",
          svg: makeMiniCrossSvg({ cx: 120, cy: 90, hH: 44, vW: 44, hubS: 36, flat: true, hTxt: "架构总览", vTxt: "深度重构" }),
          reason: "方案 C 横纵轨宽和字重几乎一比一五五开（主次未分），第一眼入口互相抢戏，难以判断先扫横轴还是先看纵轴。",
        },
        {
          id: "D",
          svg: makeMiniCrossSvg({ cx: 120, cy: 90, hH: 38, vW: 34, hubS: 68, hTxt: "架构总览", vTxt: "深度重构" }),
          reason: "方案 D 属于反向过头的「枢纽压字」：中央电光青方块放大到侵占相邻轨道字距，直接阻断两侧文字呼吸缝。",
        },
      ],
    },
  ];

  let roundIdx = 0;
  let picked = null;

  function render() {
    const r = ROUNDS[roundIdx];
    roundTag.textContent = `ROUND 0${roundIdx + 1} / 0${ROUNDS.length} · 单变量盲测`;
    promptEl.textContent = r.prompt;
    nextBtn.textContent = roundIdx === ROUNDS.length - 1 ? "回到第 1 题" : "下一题 →";

    grid.innerHTML = r.options
      .map((opt) => {
        const isPicked = picked === opt.id;
        const isRight = picked && opt.id === r.answer;
        const cls = isRight ? "is-correct" : isPicked ? "is-wrong" : "";
        const resTxt = isRight ? "✓ 正确答案" : isPicked ? "× 有缺陷" : "";
        return `
          <button type="button" class="quiz-card ${cls}" data-opt="${opt.id}" aria-pressed="${isPicked}">
            <span class="quiz-card-head">
              <span class="quiz-opt-label">方案 ${opt.id}</span>
              <span class="quiz-opt-res">${resTxt}</span>
            </span>
            ${opt.svg}
          </button>`;
      })
      .join("");

    grid.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.opt;
        const chosen = r.options.find((o) => o.id === picked);
        const ok = picked === r.answer;
        fbBox.classList.toggle("is-ok", ok);
        fbBox.classList.toggle("is-err", !ok);
        fbTitle.textContent = ok
          ? `答对了！方案 ${r.answer} 真正实现了双向共生`
          : `方案 ${picked} 有单变量缺陷，正确答案是方案 ${r.answer}`;
        fbBody.textContent = chosen.reason + (ok ? "" : ` 对比看方案 ${r.answer}：${r.options.find((o) => o.id === r.answer).reason}`);
        render();
      });
    });

    if (!picked) {
      fbBox.classList.remove("is-ok", "is-err");
      fbTitle.textContent = "点击上方任意一张方案卡（方案 A / B / C / D）查看单变量解析";
      fbBody.textContent = "观察四个关键点：交汇点有没有把某条臂挤断、横纵主次是否分明、粗细大小疏密有无对比、色彩元素是否归属同一体系。";
    }
  }

  nextBtn.addEventListener("click", () => {
    roundIdx = (roundIdx + 1) % ROUNDS.length;
    picked = null;
    render();
  });
  resetBtn.addEventListener("click", () => {
    picked = null;
    render();
  });
  render();
}

/* -------------------- 07 节：原海报点击放大、拖拽与 Esc 灯箱 -------------------- */
function mountSec07Lightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbStage = document.getElementById("lightbox-stage");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const btnClose = document.getElementById("lb-close");
  if (!poster || !openBtn || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = Math.min(3, Number((scale + 0.35).toFixed(2)));
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.7, Number((scale - 0.35).toFixed(2)));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("pointerdown", (ev) => {
    if (ev.target === lbStage) {
      close();
      return;
    }
    dragging = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, tx, ty };
    lbStage.classList.add("is-dragging");
    try {
      lbStage.setPointerCapture(ev.pointerId);
    } catch {}
  });
  lbStage.addEventListener("pointermove", (ev) => {
    if (!dragging || dragging.id !== ev.pointerId) return;
    tx = dragging.tx + (ev.clientX - dragging.x);
    ty = dragging.ty + (ev.clientY - dragging.y);
    applyTransform();
  });
  const endDrag = (ev) => {
    if (!dragging || dragging.id !== ev.pointerId) return;
    dragging = null;
    lbStage.classList.remove("is-dragging");
    try {
      lbStage.releasePointerCapture(ev.pointerId);
    } catch {}
  };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !lb.hidden) {
      ev.preventDefault();
      close();
    }
  });
}
