// 341 空白幻灯片版式 — 正文 01–07 节全部独立互动模块
// 每节使用截然不同的控件与视觉语言，相邻两节绝不重复同一种交互。

import { clamp } from "./model.js";

// =========================================================================
// Section 01：图底密度分屏拉帘对比（模板塞满版 ↔ 空白版式版）
// =========================================================================
export function initSplitCurtain() {
  const wrap = document.getElementById("curtain-stage");
  const clipEl = document.getElementById("curtain-before-clip");
  const handleEl = document.getElementById("curtain-divider");
  const rangeEl = document.getElementById("curtain-range");
  const outRatio = document.getElementById("curtain-ratio-val");
  const outNoise = document.getElementById("curtain-noise-val");
  const outSteps = document.getElementById("curtain-steps-val");
  const outVerdict = document.getElementById("curtain-verdict");
  if (!wrap || !clipEl || !handleEl || !rangeEl) return;

  let pct = 52;

  function render() {
    clipEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handleEl.style.left = `${pct}%`;
    rangeEl.value = String(Math.round(pct));

    const blankShare = Math.round(100 - pct);
    if (outRatio) outRatio.textContent = `${Math.round(28 + (78 - 28) * (blankShare / 100))}%`;
    if (outNoise) outNoise.textContent = blankShare >= 65 ? "0 处噪音" : blankShare <= 35 ? "5 处噪音" : "5 处 → 0 处";
    if (outSteps) outSteps.textContent = blankShare >= 65 ? "1 步锁焦" : blankShare <= 35 ? "4 步搜寻" : "4 → 1 步";
    if (outVerdict) {
      if (blankShare >= 75) {
        outVerdict.textContent = "右侧空白版式完全展开：撤掉顶栏、边框与说明框后，有效留白升至 78%，天蓝核心数据成为唯一图底主角。";
      } else if (blankShare <= 25) {
        outVerdict.textContent = "左侧传统模板占据画面：标题栏、装饰框、页脚和四条要点把页面切碎，文字和讲者口播互相抢通道（迈耶冗余原则）。";
      } else {
        outVerdict.textContent = "左右拖动中间拉帘：同一份「复购率 78%」内容，左侧塞满模板噪音，右侧只保留边距、留白与单一焦点。";
      }
    }
  }

  rangeEl.addEventListener("input", () => {
    pct = Number(rangeEl.value);
    render();
  });

  let dragging = false;
  function updateFromClientX(clientX) {
    const r = wrap.getBoundingClientRect();
    pct = clamp(((clientX - r.left) / Math.max(1, r.width)) * 100, 4, 96);
    render();
  }
  wrap.addEventListener("pointerdown", (ev) => {
    dragging = true;
    try { wrap.setPointerCapture(ev.pointerId); } catch {}
    updateFromClientX(ev.clientX);
  });
  wrap.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    if (ev.cancelable) ev.preventDefault();
    updateFromClientX(ev.clientX);
  });
  wrap.addEventListener("pointerup", (ev) => {
    dragging = false;
    try { wrap.releasePointerCapture(ev.pointerId); } catch {}
  });
  wrap.addEventListener("pointercancel", () => { dragging = false; });

  render();
}

// =========================================================================
// Section 02：百年留白演进时间轴（4 个核实历史节点 + 活体 SVG 架构图）
// =========================================================================
const ERAS = [
  {
    id: "rubin",
    year: "1915",
    place: "丹麦 · 哥本哈根",
    author: "埃德加·鲁宾（Edgar Rubin）",
    work: "《视觉经验中的图形》（Synsoplevede Figurer）",
    thesis: "轮廓只归属于「图」，周围安静的连续面退为「底」",
    detail: "鲁宾在博士论文中提出图—底组织原则：当背景均匀安静时，主体轮廓会自然向前浮起；一旦背景被花纹、边框和杂项占满，大脑就得花额外力气把主体从杂乱背景里抠出来。",
    svg: `
      <rect x="20" y="18" width="280" height="144" fill="#15202D" stroke="#364B63" stroke-dasharray="4 4"/>
      <rect x="44" y="34" width="232" height="112" fill="#1B2938" stroke="#4D6682" stroke-width="1"/>
      <circle cx="160" cy="92" r="28" fill="#8CC5FA"/>
      <circle cx="160" cy="92" r="3" fill="#101720"/>
      <line x1="108" y1="92" x2="212" y2="92" stroke="#4E6B8A" stroke-dasharray="3 3"/>
      <line x1="160" y1="54" x2="160" y2="128" stroke="#4E6B8A" stroke-dasharray="3 3"/>
      <text x="54" y="49" fill="#9BB3CC" font-size="9.5" font-family="Noto Sans SC, sans-serif">GROUND · 安静连续底面</text>
      <text x="160" y="139" text-anchor="middle" fill="#8CC5FA" font-size="9.5" font-family="Noto Sans SC, sans-serif">FIGURE · 轮廓唯一归属主体</text>
    `,
  },
  {
    id: "tschichold",
    year: "1928",
    place: "德国 · 柏林",
    author: "扬·奇肖尔德（Jan Tschichold）",
    work: "《新字体排印学》（Die neue Typographie）",
    thesis: "大片空白不是剩下的边角料，而是主动参与构成的力量",
    detail: "奇肖尔德打破对称填满的传统书版，明确指出「白色永远比灰色或黑色更有力」。341 原海报把标题偏置左上、把天蓝焦点放到右下，正是这种用非对称大片留白拉出张力的现代主义直系继承。",
    svg: `
      <rect x="20" y="18" width="280" height="144" fill="#15202D" stroke="#364B63" stroke-dasharray="4 4"/>
      <rect x="42" y="36" width="88" height="12" fill="#F4F6F9"/>
      <rect x="42" y="54" width="60" height="5" fill="#8CC5FA"/>
      <rect x="42" y="66" width="76" height="4" fill="#6F869F"/>
      <rect x="148" y="36" width="128" height="106" fill="rgba(140,197,250,0.08)" stroke="#8CC5FA" stroke-dasharray="3 3"/>
      <circle cx="212" cy="96" r="24" fill="#8CC5FA"/>
      <text x="212" y="54" text-anchor="middle" fill="#8CC5FA" font-size="10" font-family="DM Mono, monospace">ACTIVE WHITE SPACE</text>
      <text x="42" y="140" fill="#9BB3CC" font-size="10" font-family="DM Mono, monospace">ASYMMETRIC TENSION · 1928</text>
    `,
  },
  {
    id: "powerpoint",
    year: "1987",
    place: "美国 · 加州",
    author: "罗伯特·加斯金斯与丹尼斯·奥斯汀（R. Gaskins & D. Austin）",
    work: "Forethought PowerPoint 1.0 母版系统与「空白」版式",
    thesis: "全部内置母版里，唯一撤掉所有占位符的自由画布",
    detail: "PowerPoint 1.0 首创母版幻灯片（Master Slide），后来演化出标题页、标题与内容、比较页等固定占位符版式；唯独「空白（Blank）」保留零占位符——它的存在不是为了偷懒，而是为了在标准模板失效时把空间控制权还给设计者。",
    svg: `
      <rect x="20" y="18" width="126" height="144" fill="#15202D" stroke="#364B63"/>
      <rect x="30" y="34" width="106" height="20" fill="none" stroke="#6E849C" stroke-dasharray="3 3"/>
      <rect x="30" y="62" width="106" height="72" fill="none" stroke="#6E849C" stroke-dasharray="3 3"/>
      <text x="83" y="48" text-anchor="middle" fill="#9BB3CC" font-size="9" font-family="DM Mono, monospace">TITLE BOX</text>
      <text x="83" y="102" text-anchor="middle" fill="#9BB3CC" font-size="9" font-family="DM Mono, monospace">BULLET BOX</text>
      <text x="83" y="152" text-anchor="middle" fill="#8FA5BC" font-size="9" font-family="DM Mono, Noto Sans SC, monospace">固定占位符版式</text>
      <text x="160" y="94" text-anchor="middle" fill="#8CC5FA" font-size="14" font-family="DM Mono, Noto Sans SC, monospace">→</text>
      <rect x="174" y="18" width="126" height="144" fill="#182636" stroke="#8CC5FA" stroke-width="1.4"/>
      <rect x="188" y="32" width="98" height="106" fill="none" stroke="#4D6E91" stroke-dasharray="4 4"/>
      <circle cx="246" cy="92" r="18" fill="#8CC5FA"/>
      <text x="237" y="152" text-anchor="middle" fill="#8CC5FA" font-size="9" font-family="DM Mono, Noto Sans SC, monospace">BLANK · 0 占位符</text>
    `,
  },
  {
    id: "modern",
    year: "2003–2010",
    place: "美国 / 日本",
    author: "塔夫特 · 雷诺兹 · 杜阿尔特 · 原研哉",
    work: "《PowerPoint 的认知风格》《演讲之禅》《slide:ology》《白》",
    thesis: "把留白视作幻灯片的氧气与容纳想象力的「空容器」",
    detail: "2003 年塔夫特批判嵌套要点割裂思维；2008 年雷诺兹与杜阿尔特倡导大幅留白与「3 秒看懂」的视觉降噪；2010 年原研哉在《白》中指出，白不是一种颜料，而是让意义得以发生的空容器。",
    svg: `
      <rect x="20" y="18" width="280" height="144" fill="#15202D" stroke="#364B63" stroke-dasharray="4 4"/>
      <rect x="44" y="34" width="232" height="112" fill="#101822" stroke="#8CC5FA" stroke-dasharray="4 4"/>
      <circle cx="160" cy="84" r="24" fill="#8CC5FA"/>
      <circle cx="160" cy="84" r="36" fill="none" stroke="rgba(140,197,250,0.4)" stroke-dasharray="2 3"/>
      <text x="160" y="130" text-anchor="middle" fill="#F4F6F9" font-size="11" font-family="Noto Sans SC, sans-serif">空容器 · 3 秒一眼看懂</text>
      <text x="160" y="29" text-anchor="middle" fill="#9BB3CC" font-size="9" font-family="DM Mono, monospace">TUFTE 2003 · REYNOLDS & DUARTE 2008 · HARA 2010</text>
    `,
  },
];

export function initHistoryTimeline() {
  const btns = [...document.querySelectorAll("[data-era-btn]")];
  const svg = document.getElementById("era-svg");
  const yearEl = document.getElementById("era-year");
  const authorEl = document.getElementById("era-author");
  const workEl = document.getElementById("era-work");
  const thesisEl = document.getElementById("era-thesis");
  const detailEl = document.getElementById("era-detail");
  if (!btns.length || !svg) return;

  function selectEra(id) {
    const era = ERAS.find((e) => e.id === id) || ERAS[0];
    btns.forEach((b) => {
      const active = b.dataset.eraBtn === era.id;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    svg.innerHTML = era.svg;
    if (yearEl) yearEl.textContent = `${era.year} · ${era.place}`;
    if (authorEl) authorEl.textContent = era.author;
    if (workEl) workEl.textContent = era.work;
    if (thesisEl) thesisEl.textContent = era.thesis;
    if (detailEl) detailEl.textContent = era.detail;
  }

  btns.forEach((b) => b.addEventListener("click", () => selectEra(b.dataset.eraBtn)));
  selectEra("rubin");
}

// =========================================================================
// Section 03：四维独立故障开关矩（16 种实时空间组合，无滑块！）
// =========================================================================
export function initFourForcesLab() {
  const toggles = [...document.querySelectorAll("[data-force-toggle]")];
  const svg = document.getElementById("forces-svg");
  const scoreEl = document.getElementById("forces-score");
  const titleEl = document.getElementById("forces-diag-title");
  const bodyEl = document.getElementById("forces-diag-body");
  if (!toggles.length || !svg) return;

  const forces = { margin: true, whitespace: true, focus: true, breathing: true };

  function render() {
    toggles.forEach((btn) => {
      const k = btn.dataset.forceToggle;
      const ok = forces[k];
      btn.classList.toggle("is-broken", !ok);
      btn.setAttribute("aria-pressed", String(ok));
      const tag = btn.querySelector(".force-state-tag");
      if (tag) tag.textContent = ok ? "成立" : "失守";
    });

    const m = forces.margin ? 36 : 8;
    const fx = forces.margin ? (forces.breathing ? 234 : 184) : (forces.breathing ? 278 : 190);
    const fy = 104;
    const fr = forces.whitespace ? 34 : 42;
    const tx = forces.margin ? 50 : 14;
    const ty = 78;

    const brokenKeys = Object.entries(forces).filter(([, v]) => !v).map(([k]) => k);
    const okCount = 4 - brokenKeys.length;

    let extras = "";
    if (!forces.whitespace) {
      extras += `
        <rect x="${m + 2}" y="${m * 0.65 + 2}" width="${320 - m * 2 - 4}" height="17" fill="#E8E3D5" stroke="#B92B27" stroke-dasharray="3 2"/>
        <rect x="${m + 2}" y="${180 - m * 0.65 - 20}" width="${320 - m * 2 - 4}" height="18" fill="#E8E3D5" stroke="#B92B27" stroke-dasharray="3 2"/>
        <rect x="${tx}" y="128" width="110" height="20" fill="#ECE7DA" stroke="#B92B27" stroke-dasharray="3 2"/>
      `;
    }
    if (!forces.focus) {
      extras += `
        <rect x="${forces.margin ? 216 : 244}" y="${forces.margin ? 32 : 12}" width="66" height="30" rx="3" fill="#2E84DB" stroke="#B92B27" stroke-dasharray="3 2"/>
        <text x="${forces.margin ? 249 : 277}" y="${forces.margin ? 51 : 31}" text-anchor="middle" fill="#FFFFFF" font-size="9" font-family="Noto Sans SC, sans-serif">第二焦点</text>
      `;
    }

    const gapStroke = forces.breathing ? "#1668B8" : "#B92B27";
    const copyRight = tx + 100;
    const gapLine = `
      <line x1="${copyRight}" y1="${fy}" x2="${fx - fr}" y2="${fy}" stroke="${gapStroke}" stroke-width="1.3" stroke-dasharray="3 3"/>
      <text x="${(copyRight + fx - fr) / 2}" y="${fy - 7}" text-anchor="middle" fill="${gapStroke}" font-size="9" font-family="DM Mono, Noto Sans SC, monospace">${forces.breathing ? "净距 12%" : "紧贴 1%"}</text>
    `;

    svg.innerHTML = `
      <rect x="0" y="0" width="320" height="180" fill="#FAF7ED"/>
      <rect x="${m}" y="${m * 0.65}" width="${320 - m * 2}" height="${180 - m * 1.3}" fill="#FFFDF7" stroke="${forces.margin ? "#BDB7A9" : "#B92B27"}" stroke-width="${forces.margin ? 1 : 1.5}" stroke-dasharray="4 4"/>
      ${extras}
      <line x1="${fx - 60}" y1="${fy}" x2="${fx + 60}" y2="${fy}" stroke="#C8C3B7" stroke-dasharray="3 3"/>
      <line x1="${fx}" y1="${fy - 54}" x2="${fx}" y2="${fy + 54}" stroke="#C8C3B7" stroke-dasharray="3 3"/>
      <circle cx="${fx}" cy="${fy}" r="${fr}" fill="#A0CDF9"/>
      <circle cx="${fx}" cy="${fy}" r="3" fill="#0D0E0D"/>
      <rect x="${tx}" y="${ty}" width="40" height="4" fill="#1668B8"/>
      <rect x="${tx}" y="${ty + 12}" width="96" height="12" fill="#0D0E0D"/>
      <rect x="${tx}" y="${ty + 30}" width="80" height="6" fill="#706E66"/>
      ${gapLine}
    `;

    if (scoreEl) {
      scoreEl.textContent = `${okCount}/4 成立`;
      scoreEl.classList.toggle("is-pass", okCount === 4);
    }

    const NAMES = { margin: "边距", whitespace: "留白", focus: "焦点", breathing: "呼吸感" };
    if (okCount === 4) {
      titleEl.textContent = "四维齐备：每一条都在为其他三条托底";
      bodyEl.textContent = "外边距守住安全边界，大片暖白降噪，单一蓝圆吸引视线，适度间隙把图文分组——试着关掉任意 1 项，看整体秩序如何塌陷。";
    } else if (okCount === 3) {
      const k = brokenKeys[0];
      const oneBroken = {
        margin: ["只破「边距」：留白还在，但整页立刻发紧", "即便中间空着，内容一贴边就会让观众产生「马上要裁掉」的压迫感。"],
        whitespace: ["只破「留白」：杂物盒一进场，呼吸空间瞬间折半", "顶栏、页脚和补充框看似都「有用」，合在一起就把安静的底面切碎了。"],
        focus: ["只破「焦点」：多出一个等重蓝块，视线立刻左右摇摆", "留白再大，只要画面里存在两个视觉权重接近的主角，人眼就不知道先看谁。"],
        breathing: ["只破「呼吸感」：外围明明很空，字和图却粘成一团", "空白集中在画布外圈，元素彼此挤在一起——这是最容易被忽视的「假留白」。"],
      };
      titleEl.textContent = oneBroken[k][0];
      bodyEl.textContent = oneBroken[k][1];
    } else {
      const list = brokenKeys.map((k) => NAMES[k]).join("、");
      titleEl.textContent = `同时失去 ${brokenKeys.length} 维（${list}），空白版式退化失效`;
      bodyEl.textContent = `单独补救其中一项还不够，必须把 ${list} 逐一恢复，留白才能从「剩下的空地」变成主动的组织结构。`;
    }
  }

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.forceToggle;
      forces[k] = !forces[k];
      render();
    });
  });

  render();
}

// =========================================================================
// Section 04：5 幕汇报场景路由器（什么时候用 341，什么时候交给同类 8 页）
// =========================================================================
const ROUTES = [
  {
    id: "turn",
    label: "密集报表后的核心转折",
    pick: "341",
    pickName: "341 空白幻灯片版式（本页）",
    pickUrl: "#hero",
    badge: "首选本页",
    why: "连续看完五六页高密度表格后，观众的工作记忆已经饱和。这里最需要一页撤掉所有占位符的空白版式，用 75% 以上的开放留白制造一次深呼吸，把唯一转折数字或核心洞察托出来。",
    strip: ["336 密集指标页", "341 空白转折页 ★", "338 双列拆解页"],
    stripActive: 1,
  },
  {
    id: "product",
    label: "发布会单品外观首秀",
    pick: "341",
    pickName: "341 空白幻灯片版式（本页）",
    pickUrl: "#hero",
    badge: "首选本页",
    why: "单品特写最怕被固定标题框、页眉和参数表抢戏。空白版式允许把全部装饰归零，让大面积净纸衬托出产品轮廓与极短一句话。",
    strip: ["337 章节切幕页", "341 单物空白页 ★", "343 图片与说明页"],
    stripActive: 1,
  },
  {
    id: "slogan",
    label: "只要一句巨型口号宣言",
    pick: "340",
    pickName: "交给 340 仅标题幻灯片版式",
    pickUrl: "https://layout.xiaoxiaodong.ai/340/play/",
    badge: "转交同类",
    why: "如果你完全不需要自由图形或定制构图，只想让一句简短主张以极大字号震慑全场，直接用 340 仅标题版式效率更高、对齐更统一。",
    strip: ["335 标题封面", "340 仅标题宣言 ★", "336 正文展开"],
    stripActive: 1,
  },
  {
    id: "compare",
    label: "两套技术方案逐项对比",
    pick: "339",
    pickName: "交给 339 比较幻灯片版式",
    pickUrl: "https://layout.xiaoxiaodong.ai/339/play/",
    badge: "转交同类",
    why: "方案对比的核心是让观众横向扫读同一维度的优劣差异。硬放在空白页上会失去并列参照轴，应当使用内置双栏小标题的 339 比较版式。",
    strip: ["336 背景问题", "339 方案对比 ★", "341 最终拍板结论"],
    stripActive: 1,
  },
  {
    id: "weekly",
    label: "团队协作的常规周报",
    pick: "336",
    pickName: "交给 336 标题和内容幻灯片版式",
    pickUrl: "https://layout.xiaoxiaodong.ai/336/play/",
    badge: "转交同类",
    why: "多人合稿需要统一的标题基线和正文边界；空白版式没有预置占位符，每人手拖文本框只会导致翻页时版面乱跳。日常周报应交给 336 标题和内容版式。",
    strip: ["335 周报封面", "336 标准进展页 ★", "342 图表说明页"],
    stripActive: 1,
  },
];

export function initDeckRouter() {
  const btns = [...document.querySelectorAll("[data-route-btn]")];
  const badgeEl = document.getElementById("route-badge");
  const titleEl = document.getElementById("route-title");
  const whyEl = document.getElementById("route-why");
  const linkEl = document.getElementById("route-link");
  const stripEl = document.getElementById("route-strip");
  if (!btns.length || !stripEl) return;

  function selectRoute(id) {
    const r = ROUTES.find((x) => x.id === id) || ROUTES[0];
    btns.forEach((b) => {
      const on = b.dataset.routeBtn === r.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (badgeEl) {
      badgeEl.textContent = r.badge;
      badgeEl.classList.toggle("is-self", r.pick === "341");
    }
    if (titleEl) titleEl.textContent = r.pickName;
    if (whyEl) whyEl.textContent = r.why;
    if (linkEl) {
      if (r.pick === "341") {
        linkEl.textContent = "回到上方画布亲手排这一页 ↑";
        linkEl.setAttribute("href", "#hero");
        linkEl.removeAttribute("target");
        linkEl.removeAttribute("rel");
      } else {
        linkEl.textContent = `去读 ${r.pick} 互动页 →`;
        linkEl.setAttribute("href", r.pickUrl);
        linkEl.setAttribute("target", "_blank");
        linkEl.setAttribute("rel", "noopener");
      }
    }
    stripEl.innerHTML = r.strip
      .map(
        (name, idx) =>
          `<div class="route-film-cell ${idx === r.stripActive ? "is-picked" : ""}"><span class="film-num">0${idx + 1}</span><span>${name}</span></div>`
      )
      .join("");
  }

  btns.forEach((b) => b.addEventListener("click", () => selectRoute(b.dataset.routeBtn)));
  selectRoute("turn");
}

// =========================================================================
// Section 05：什么时候别用（4 张可展开病例对照签）
// =========================================================================
export function initCounterCases() {
  const cards = [...document.querySelectorAll("[data-case-btn]")];
  if (!cards.length) return;
  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".case-card");
      const open = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      const hint = btn.querySelector(".case-toggle-hint");
      if (hint) hint.textContent = open ? "收起对策 −" : "展开对策 +";
    });
  });
}

// =========================================================================
// Section 06：暗室单变量识图小练习（2 题，严格单变量 + 中性 A/B/C/D 标签）
// =========================================================================
const QUIZ_ROUNDS = [
  {
    id: 0,
    tag: "第 1 / 2 题 · 控制变量：安全边距 × 元素呼吸距",
    prompt: "在连续 6 页高密度财务报表之后，你要插入一页空白幻灯片公布「复购率 78%」。以下四版使用完全相同的天蓝圆大小、字号与色彩，只改变外边距与图字间距——哪一版最成立？",
    options: [
      {
        key: "A",
        correct: false,
        note: "边距 2.5% · 间距 28%",
        reason: "A 错在「贴边 + 孤岛散架」：说明文字和天蓝圆都被推到离幕布边缘只剩 2.5%，既让四周发紧，又在中间拉出过宽鸿沟，观众难以把字和图一眼归为一组。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="6" y="6" width="228" height="123" fill="none" stroke="${reveal ? "#B92B27" : "#D4CFC2"}" stroke-dasharray="3 3"/>
          <rect x="10" y="22" width="30" height="3" fill="#1668B8"/>
          <text x="10" y="40" fill="#0D0E0D" font-size="10" font-weight="800" font-family="Noto Sans SC, sans-serif">复购率站上新高</text>
          <text x="10" y="53" fill="#5C5B53" font-size="7" font-family="Noto Sans SC, sans-serif">大面积留白承托拐点</text>
          <circle cx="206" cy="98" r="23" fill="#A0CDF9"/>
          <text x="206" y="103" text-anchor="middle" fill="#0D0E0D" font-size="16" font-weight="400" letter-spacing="0.5" font-family="Bebas Neue, sans-serif">78%</text>
          ${reveal ? `<line x1="84" y1="68" x2="180" y2="92" stroke="#B92B27" stroke-dasharray="3 2"/><text x="120" y="124" text-anchor="middle" fill="#B92B27" font-size="8.5" font-family="Noto Sans SC, sans-serif">贴边 2.5% · 脱节</text>` : ""}
        `,
      },
      {
        key: "B",
        correct: false,
        note: "边距 12% · 间距 1%",
        reason: "B 错在「呼吸感粘连」：外边距虽然达到了舒适的 12%，但说明文字几乎紧贴在天蓝圆边沿（净距仅 1%），外围再空，核心区域依然显得拥挤发闷。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="28" y="16" width="184" height="103" fill="none" stroke="${reveal ? "#1668B8" : "#D4CFC2"}" stroke-dasharray="3 3"/>
          <rect x="54" y="49" width="30" height="3" fill="#1668B8"/>
          <text x="54" y="67" fill="#0D0E0D" font-size="10" font-weight="800" font-family="Noto Sans SC, sans-serif">复购率站上新高</text>
          <text x="54" y="80" fill="#5C5B53" font-size="7" font-family="Noto Sans SC, sans-serif">大面积留白承托拐点</text>
          <circle cx="152" cy="68" r="23" fill="#A0CDF9"/>
          <text x="152" y="73" text-anchor="middle" fill="#0D0E0D" font-size="16" font-weight="400" letter-spacing="0.5" font-family="Bebas Neue, sans-serif">78%</text>
          ${reveal ? `<rect x="125" y="44" width="5" height="48" fill="rgba(185,43,39,0.28)"/><text x="120" y="124" text-anchor="middle" fill="#B92B27" font-size="8.5" font-family="Noto Sans SC, sans-serif">字图净距 1% · 粘连</text>` : ""}
        `,
      },
      {
        key: "C",
        correct: true,
        note: "边距 12% · 间距 11%",
        reason: "C 正确：四边留出 12% 舒适边距，说明文案与天蓝 78% 焦点之间保持 11% 的呼吸通道，既不会互相粘连也不至于脱节散架，有效留白 77%，后排一眼锁定重点。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="28" y="16" width="184" height="103" fill="none" stroke="${reveal ? "#156F52" : "#D4CFC2"}" stroke-dasharray="3 3"/>
          <rect x="36" y="49" width="30" height="3" fill="#1668B8"/>
          <text x="36" y="67" fill="#0D0E0D" font-size="10" font-weight="800" font-family="Noto Sans SC, sans-serif">复购率站上新高</text>
          <text x="36" y="80" fill="#5C5B53" font-size="7" font-family="Noto Sans SC, sans-serif">大面积留白承托拐点</text>
          <circle cx="174" cy="68" r="23" fill="#A0CDF9"/>
          <text x="174" y="73" text-anchor="middle" fill="#0D0E0D" font-size="16" font-weight="400" letter-spacing="0.5" font-family="Bebas Neue, sans-serif">78%</text>
          ${reveal ? `<line x1="112" y1="68" x2="148" y2="68" stroke="#156F52" stroke-width="1.4" stroke-dasharray="2 2"/><text x="120" y="124" text-anchor="middle" fill="#156F52" font-size="8.5" font-family="Noto Sans SC, sans-serif">边距 12% · 净距 11% ✓</text>` : ""}
        `,
      },
      {
        key: "D",
        correct: false,
        note: "边距 25% · 间距 3%",
        reason: "D 错在「邮票内缩」：四周边距被盲目扩到 25%，有效工作区被挤成中间小小一格，文字与天蓝圆被迫互相贴近，四周剩下的只是僵硬的被动白框。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="52" y="32" width="136" height="71" fill="none" stroke="${reveal ? "#B92B27" : "#D4CFC2"}" stroke-dasharray="3 3"/>
          <rect x="58" y="49" width="30" height="3" fill="#1668B8"/>
          <text x="58" y="67" fill="#0D0E0D" font-size="10" font-weight="800" font-family="Noto Sans SC, sans-serif">复购率站上新高</text>
          <text x="58" y="80" fill="#5C5B53" font-size="7" font-family="Noto Sans SC, sans-serif">大面积留白承托拐点</text>
          <circle cx="158" cy="68" r="23" fill="#A0CDF9"/>
          <text x="158" y="73" text-anchor="middle" fill="#0D0E0D" font-size="16" font-weight="400" letter-spacing="0.5" font-family="Bebas Neue, sans-serif">78%</text>
          ${reveal ? `<text x="120" y="124" text-anchor="middle" fill="#B92B27" font-size="8.5" font-family="Noto Sans SC, sans-serif">内缩 25% · 邮票感</text>` : ""}
        `,
      },
    ],
  },
  {
    id: 1,
    tag: "第 2 / 2 题 · 控制变量：视觉焦点尺度与数量",
    prompt: "四张同边距、同文案的「新架构零停机」空白幻灯片，只改变天蓝视觉焦点的尺度或数量——哪一版最能发挥空白版式的单焦聚焦优势？",
    options: [
      {
        key: "A",
        correct: false,
        note: "极小焦点 4%",
        reason: "A 错在「空洞失焦」：主视觉圆被缩到仅占画宽 4%，整页留白超过 93%，后排观众会以为漏放了配图或卡在了未编辑完的母版。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="28" y="16" width="184" height="103" fill="none" stroke="#D4CFC2" stroke-dasharray="3 3"/>
          <text x="36" y="66" fill="#0D0E0D" font-size="10.5" font-weight="800" font-family="Noto Sans SC, sans-serif">新架构零停机</text>
          <circle cx="174" cy="66" r="6" fill="#A0CDF9"/>
          ${reveal ? `<text x="120" y="124" text-anchor="middle" fill="#B92B27" font-size="8.5" font-family="DM Mono, Noto Sans SC, monospace">焦点过弱 · 退化成空页</text>` : ""}
        `,
      },
      {
        key: "B",
        correct: false,
        note: "双等重焦点",
        reason: "B 错在「多焦抢戏」：右侧同时放置两个面积、色度完全相当的天蓝焦块，破坏了空白版式最核心的「单一视觉焦点」，眼睛不得不在两处来回切焦点。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="28" y="16" width="184" height="103" fill="none" stroke="#D4CFC2" stroke-dasharray="3 3"/>
          <text x="36" y="66" fill="#0D0E0D" font-size="10.5" font-weight="800" font-family="Noto Sans SC, sans-serif">新架构零停机</text>
          <circle cx="148" cy="48" r="20" fill="#A0CDF9"/>
          <circle cx="184" cy="86" r="20" fill="#A0CDF9"/>
          ${reveal ? `<line x1="148" y1="48" x2="184" y2="86" stroke="#B92B27" stroke-dasharray="2 2"/><text x="120" y="124" text-anchor="middle" fill="#B92B27" font-size="8.5" font-family="DM Mono, Noto Sans SC, monospace">双焦等重 · 视线拉扯</text>` : ""}
        `,
      },
      {
        key: "C",
        correct: true,
        note: "单焦 20% 宽",
        reason: "C 正确：单一占宽约 20% 的天蓝焦点圆自带细虚线坐标锚定，左侧说明文字保持克制体量，主次对比鲜明且主动留白达 76%，一秒建立稳定图—底关系。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="28" y="16" width="184" height="103" fill="none" stroke="${reveal ? "#156F52" : "#D4CFC2"}" stroke-dasharray="3 3"/>
          <text x="36" y="64" fill="#0D0E0D" font-size="10.5" font-weight="800" font-family="Noto Sans SC, sans-serif">新架构零停机</text>
          <text x="36" y="78" fill="#5C5B53" font-size="7.5" font-family="Noto Sans SC, sans-serif">单焦锚定核心结论</text>
          <line x1="138" y1="68" x2="210" y2="68" stroke="#C8C3B7" stroke-dasharray="3 3"/>
          <line x1="174" y1="34" x2="174" y2="102" stroke="#C8C3B7" stroke-dasharray="3 3"/>
          <circle cx="174" cy="68" r="24" fill="#A0CDF9"/>
          <circle cx="174" cy="68" r="2.6" fill="#0D0E0D"/>
          ${reveal ? `<text x="120" y="124" text-anchor="middle" fill="#156F52" font-size="8.5" font-family="DM Mono, Noto Sans SC, monospace">单一焦点 · 76% 留白 ✓</text>` : ""}
        `,
      },
      {
        key: "D",
        correct: false,
        note: "巨块占宽 58%",
        reason: "D 错在「色块压迫」：焦点圆膨胀到覆盖大半画布并顶撞文字与边框，原本托起主体的主动留白被彻底吞噬，页面从留白版式退化成满幅色卡。",
        svg: (reveal) => `
          <rect x="0" y="0" width="240" height="135" fill="#FAF7ED"/>
          <rect x="28" y="16" width="184" height="103" fill="none" stroke="#D4CFC2" stroke-dasharray="3 3"/>
          <circle cx="152" cy="68" r="54" fill="#A0CDF9"/>
          <text x="36" y="66" fill="#0D0E0D" font-size="10.5" font-weight="800" font-family="Noto Sans SC, sans-serif">新架构零停机</text>
          ${reveal ? `<text x="120" y="124" text-anchor="middle" fill="#B92B27" font-size="8.5" font-family="DM Mono, Noto Sans SC, monospace">色块吃掉留白 · 压迫</text>` : ""}
        `,
      },
    ],
  },
];

export function initPracticeQuiz() {
  const grid = document.getElementById("quiz-grid");
  const tagEl = document.getElementById("quiz-round-tag");
  const promptEl = document.getElementById("quiz-prompt");
  const fbEl = document.getElementById("quiz-feedback");
  const roundBtns = [...document.querySelectorAll("[data-quiz-round]")];
  if (!grid || !fbEl) return;

  let roundIdx = 0;
  let pickedKey = null;

  function render() {
    const round = QUIZ_ROUNDS[roundIdx];
    const revealed = pickedKey !== null;
    if (tagEl) tagEl.textContent = round.tag;
    if (promptEl) promptEl.textContent = round.prompt;
    roundBtns.forEach((b) => {
      const active = Number(b.dataset.quizRound) === roundIdx;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    grid.innerHTML = round.options
      .map((opt) => {
        const isPicked = pickedKey === opt.key;
        const cls = [
          "quiz-option",
          isPicked ? "is-picked" : "",
          revealed && opt.correct ? "is-correct" : "",
          revealed && isPicked && !opt.correct ? "is-wrong" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `
          <button type="button" class="${cls}" data-quiz-opt="${opt.key}" aria-pressed="${isPicked}">
            <div class="quiz-thumb">
              <svg viewBox="0 0 240 135" aria-hidden="true">${opt.svg(revealed)}</svg>
            </div>
            <div class="quiz-meta">
              <span class="quiz-letter">方案 ${opt.key}</span>
              <span class="quiz-neutral-tag">${revealed ? opt.note : "点击选择"}</span>
            </div>
          </button>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        pickedKey = btn.dataset.quizOpt;
        render();
      });
    });

    if (!revealed) {
      fbEl.className = "quiz-feedback";
      fbEl.innerHTML = `<p>点击上方任意一版查看叠加辅助线与原理解析。所有选项仅差一个空间变量，标签不透露好坏。</p>`;
    } else {
      const chosen = round.options.find((o) => o.key === pickedKey);
      const right = round.options.find((o) => o.correct);
      fbEl.className = `quiz-feedback ${chosen.correct ? "is-right" : "is-wrong"}`;
      fbEl.innerHTML = `
        <p class="quiz-fb-head">${chosen.correct ? `答对了 · 方案 ${chosen.key} 成立` : `再看一眼 · 方案 ${chosen.key} 失守，正确是方案 ${right.key}`}</p>
        <p class="quiz-fb-body">${chosen.reason}${chosen.correct ? "" : ` 对比方案 ${right.key}：${right.reason}`}</p>
      `;
    }
  }

  roundBtns.forEach((b) => {
    b.addEventListener("click", () => {
      roundIdx = Number(b.dataset.quizRound);
      pickedKey = null;
      render();
    });
  });

  render();
}

// =========================================================================
// Section 07：原海报灯箱（复用 #poster 单图 src，支持缩放、拖拽、Esc 关闭）
// =========================================================================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-zoom-btn");
  const modal = document.getElementById("poster-modal");
  const img = document.getElementById("poster-modal-img");
  const stage = document.getElementById("poster-modal-stage");
  const closeBtn = document.getElementById("poster-modal-close");
  const zoomIn = document.getElementById("poster-zoom-in");
  const zoomOut = document.getElementById("poster-zoom-out");
  const zoomReset = document.getElementById("poster-zoom-reset");
  const zoomRead = document.getElementById("poster-zoom-read");
  if (!poster || !modal || !img || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomRead) zoomRead.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    img.src = poster.src;
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
    openBtn?.focus();
  }

  poster.addEventListener("click", openModal);
  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal || ev.target === stage) closeModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.hidden) closeModal();
  });

  zoomIn?.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3); applyTransform(); });
  zoomOut?.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (ev) => {
    if (modal.hidden) return;
    ev.preventDefault();
    scale = clamp(scale + (ev.deltaY < 0 ? 0.2 : -0.2), 1, 3);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  img.addEventListener("pointerdown", (ev) => {
    pan = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, ox: tx, oy: ty };
    try { img.setPointerCapture(ev.pointerId); } catch {}
  });
  img.addEventListener("pointermove", (ev) => {
    if (!pan) return;
    if (ev.cancelable) ev.preventDefault();
    tx = pan.ox + (ev.clientX - pan.sx);
    ty = pan.oy + (ev.clientY - pan.sy);
    applyTransform();
  });
  img.addEventListener("pointerup", (ev) => {
    if (pan) try { img.releasePointerCapture(ev.pointerId); } catch {}
    pan = null;
  });
  img.addEventListener("pointercancel", () => { pan = null; });
}
