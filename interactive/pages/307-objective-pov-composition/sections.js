// 307 客观视角构图 · 正文 01–07 节独立交互模块
// 每节采用不同交互机制，绝不在相邻两节重复同一种控件。

import { PALETTE, evaluate, makeCamera, clamp } from "./model.js";
import { renderHeroStage, drawSilhouetteActor } from "./stage-hero.js";
import { pixelRatio } from "../../lib/stage.js";

// =========================================================================
// 01 节：同一事件「广场重逢」· 四视角切镜对照台（客观 vs 主观 vs 过肩 vs 单人）
// =========================================================================
const VIEWPOINT_CASES = {
  objective: {
    id: "objective",
    label: "307 客观旁观",
    badge: "本页重点 · 旁观全场",
    title: "摄影机退到场外 18 m，平视装下两人、台阶与整座广场",
    why: "观众不被强行塞进任何一方的情绪里，而是同时看见抵达者的迟疑、台阶前等待者的站姿、以及两人之间那段还没走完的距离。真实的关系不用台词就成立了。",
    camNote: "机位站在事件圆圈之外，平视 0°，35mm 深焦，全员与环境同时清晰。",
    link: null,
  },
  subjective: {
    id: "subjective",
    label: "306 主观视角",
    badge: "第一人称入眼",
    title: "摄影机钻进抵达者的眼睛，只看见眼前走向的台阶与人影",
    why: "代入感极强，观众直接变成当事人，但也彻底失去了「看见自己站在广场何处、显得多渺小」的全局视野。",
    camNote: "机位贴合角色视线，省略角色自身，只保留 TA 此刻看到的一切。",
    link: { text: "详看 306 主观视角构图 →", href: "https://layout.xiaoxiaodong.ai/306/play/" },
  },
  ots: {
    id: "ots",
    label: "305 过肩构图",
    badge: "对话关系介入",
    title: "摄影机架在抵达者左肩后方，借肩线把视线指向台阶上的人",
    why: "画面立刻带上了立场倾向：观众站在前景这位的身后替他看对方，适合双人对话交锋，但已退出完全中立的旁观席。",
    camNote: "前景深色肩头占去一角作画框，引导视线直指对话目标。",
    link: { text: "详看 305 过肩构图 →", href: "https://layout.xiaoxiaodong.ai/305/play/" },
  },
  single: {
    id: "single",
    label: "308 / 309 单人近景",
    badge: "剥离环境 · 聚焦单人",
    title: "推进到单人中近景（净单人清空干扰，或脏单人留一角遮挡）",
    why: "全神贯注放大一个人的神情或心理重量，却主动舍弃了广场全貌和两人相隔的真实距离——适合情绪爆发，不适合先交代全局。",
    camNote: "85mm 浅景深压缩后景，画幅只为单人情绪服务。",
    link: {
      text: "详看 308 净单人镜头",
      href: "https://layout.xiaoxiaodong.ai/308/play/",
      link2Text: "与 309 脏单人镜头 →",
      link2Href: "https://layout.xiaoxiaodong.ai/309/play/",
    },
  },
};

export function initSection01Compare() {
  const buttons = [...document.querySelectorAll("[data-vp-tab]")];
  const frameCanvas = document.getElementById("vp-frame-canvas");
  const planSvg = document.getElementById("vp-plan-svg");
  const badgeEl = document.getElementById("vp-badge");
  const titleEl = document.getElementById("vp-title");
  const whyEl = document.getElementById("vp-why");
  const camNoteEl = document.getElementById("vp-cam-note");
  const linkEl = document.getElementById("vp-link");
  if (!frameCanvas || !buttons.length) return;

  let active = "objective";

  function drawViewFrame(id) {
    const dpr = pixelRatio(2);
    const rect = frameCanvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width || 560));
    const h = Math.max(170, Math.round(rect.height || 260));
    frameCanvas.width = Math.round(w * dpr);
    frameCanvas.height = Math.round(h * dpr);
    const ctx = frameCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (id === "objective") {
      const st = { scene: "plaza", distance: 18.0, pitch: 0, tilt: 0, focal: 35, leadX: 0.0, peek: false, playing: false, playTime: 0, highlightCard: null };
      const ev = evaluate(st, w, h);
      renderHeroStage(ctx, w, h, st, ev, { compact: true });
    } else if (id === "subjective") {
      // 第一人称看台阶与远处等待者（无自身背影，微晃手持感边界线）
      const st = { scene: "plaza", distance: 8.8, pitch: 1, tilt: 0, focal: 35, leadX: 9.5, peek: false, playing: false, playTime: 0, highlightCard: null };
      const ev = evaluate(st, w, h);
      renderHeroStage(ctx, w, h, st, ev, { compact: true });
      // 画底部第一人称视野双侧微暗晕影与手举车票剪影
      ctx.fillStyle = "rgba(2, 32, 55, 0.14)";
      ctx.fillRect(0, 0, w * 0.06, h);
      ctx.fillRect(w * 0.94, 0, w * 0.06, h);
      // 右下前景手持纸笺示意第一人称身体锚点
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.moveTo(w * 0.72, h);
      ctx.lineTo(w * 0.77, h * 0.77);
      ctx.lineTo(w * 0.87, h * 0.80);
      ctx.lineTo(w * 0.84, h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(w * 0.785, h * 0.70, w * 0.065, h * 0.13);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(w * 0.785, h * 0.70, w * 0.065, h * 0.13);
    } else if (id === "ots") {
      // 过肩构图：左前景大块深靛肩背作画框，右中对焦等待者
      const st = { scene: "plaza", distance: 9.8, pitch: 0, tilt: 0, focal: 50, leadX: 9.5, peek: false, playing: false, playTime: 0, highlightCard: null };
      const ev = evaluate(st, w, h);
      renderHeroStage(ctx, w, h, st, ev, { compact: true });
      // 左前景虚化肩头剪影
      ctx.save();
      ctx.fillStyle = "rgba(2, 32, 55, 0.94)";
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.24);
      ctx.quadraticCurveTo(w * 0.19, h * 0.22, w * 0.23, h * 0.44);
      ctx.quadraticCurveTo(w * 0.34, h * 0.56, w * 0.35, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.23, h * 0.44);
      ctx.quadraticCurveTo(w * 0.34, h * 0.56, w * 0.35, h);
      ctx.stroke();
      ctx.restore();
    } else {
      // 308/309 单人近景：105mm 浅景深完全虚化广场，只剩单人半身剪影
      const st = { scene: "plaza", distance: 4.5, pitch: 0, tilt: 0, focal: 105, leadX: 0.0, peek: false, playing: false, playTime: 0, highlightCard: null };
      const ev = evaluate(st, w, h);
      renderHeroStage(ctx, w, h, st, ev, { compact: true });
    }
  }

  function renderPlan(id) {
    if (!planSvg) return;
    // 用清晰的俯拍建筑平面图展示相机在事件中的物理位置
    const configs = {
      objective: { cx: 110, cy: 146, cone: "110,146 28,28 192,28", label: "场外 18m 客观机位" },
      subjective: { cx: 110, cy: 100, cone: "110,100 58,28 162,28", label: "角色眼位（替代 A）" },
      ots: { cx: 88, cy: 116, cone: "88,116 92,28 176,34", label: "左肩后方过肩位" },
      single: { cx: 110, cy: 120, cone: "110,120 90,74 130,74", label: "长焦单人紧贴位" },
    };
    const c = configs[id] || configs.objective;
    planSvg.innerHTML = `
      <rect x="6" y="6" width="208" height="164" fill="#FAF0DC" stroke="#022037" stroke-width="1.5" />
      <rect x="34" y="16" width="152" height="16" fill="#E7DACA" stroke="#022037" stroke-width="1" />
      <rect x="92" y="16" width="36" height="10" fill="#2B4256" />
      <circle cx="176" cy="48" r="11" fill="#E4AD33" opacity="0.9" />
      <polygon points="${c.cone}" fill="rgba(230, 168, 38, 0.25)" stroke="#855300" stroke-width="1.2" stroke-dasharray="4 3" />
      <circle cx="110" cy="42" r="5" fill="#022037" />
      <text x="120" y="45" font-size="10" fill="#022037" font-family="Noto Sans SC, sans-serif">B 等待者</text>
      <circle cx="110" cy="100" r="6" fill="#022037" />
      <text x="122" y="103" font-size="10" fill="#022037" font-family="Noto Sans SC, sans-serif">A 抵达者</text>
      <circle cx="62" cy="68" r="4" fill="#84929F" />
      <circle cx="152" cy="76" r="4" fill="#84929F" />
      <rect x="${c.cx - 8}" y="${c.cy - 6}" width="16" height="12" fill="#022037" />
      <circle cx="${c.cx}" cy="${c.cy}" r="3" fill="#E6A826" />
      <text x="110" y="164" text-anchor="middle" font-size="10.5" font-weight="700" fill="#022037" font-family="Noto Sans SC, sans-serif">${c.label}</text>
    `;
  }

  function update(id) {
    active = id;
    const item = VIEWPOINT_CASES[id];
    buttons.forEach((b) => {
      const on = b.dataset.vpTab === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    badgeEl.textContent = item.badge;
    titleEl.textContent = item.title;
    whyEl.textContent = item.why;
    camNoteEl.textContent = item.camNote;
    if (item.link) {
      linkEl.innerHTML = item.link.link2Text
        ? `<a href="${item.link.href}" target="_blank" rel="noopener">${item.link.text}</a> · <a href="${item.link.link2Href}" target="_blank" rel="noopener">${item.link.link2Text}</a>`
        : `<a href="${item.link.href}" target="_blank" rel="noopener">${item.link.text}</a>`;
      linkEl.hidden = false;
    } else {
      linkEl.innerHTML = "";
      linkEl.hidden = true;
    }
    drawViewFrame(id);
    renderPlan(id);
  }

  buttons.forEach((b) => b.addEventListener("click", () => update(b.dataset.vpTab)));
  window.addEventListener("resize", () => drawViewFrame(active));
  update("objective");
}

// =========================================================================
// 02 节：电影史五节点建筑档案轨（全部史实已核实，可点看构图示意图）
// =========================================================================
const HISTORY_ITEMS = [
  {
    id: "ozu",
    year: "1953",
    who: "小津安二郎 ·《东京物语》",
    book: "David Bordwell, Ozu and the Poetics of Cinema (1988)",
    quote: "摄影机停在榻榻米低平视角，不随人物摇移，让走廊门框与人物间距自己说话。",
    detail: "小津极少使用情绪化推拉或炫技剪辑。摄影机像坐在屋角的一位安静客人，平视且克制地框住家庭成员在长廊、门槛间的聚散。正因机位不替观众煽情，空房间与微小的背影转折才格外令人动容。",
    diagram: "ozu",
  },
  {
    id: "bazin",
    year: "1958",
    who: "安德烈·巴赞 ·《电影是什么？》",
    book: "Qu'est-ce que le cinéma? (1958) / What Is Cinema? Vol. I (1967)",
    quote: "深焦与长镜头保留了物理空间的完整性，把「看哪里」的自由交还给观众。",
    detail: "在收录于 1958 年《电影是什么？》的《电影语言的演变》一文中，巴赞将依赖剪辑制造唯一解读的蒙太奇，与依赖深焦和客观空间调度的现实主义传统对照：后者让前景与后景同时清晰，由观众自己建立因果与关系。",
    diagram: "bazin",
  },
  {
    id: "mascelli",
    year: "1965",
    who: "约瑟夫·马斯切利 ·《电影摄影的五个 C》",
    book: "The Five C's of Cinematography (Cine/Grafic Publications, 1965)",
    quote: "首章将机位明确划分为客观（Objective）、主观（Subjective）与视点（POV）三类。",
    detail: "马斯切利在第一章「Camera Angles」把客观视角定义为「场外看不见的旁观者（sideline observer）」：它不替代角色眼睛，而是最常用、最稳固的叙事地基，让观众清醒观察动作、肢体与环境全貌。",
    diagram: "mascelli",
  },
  {
    id: "tati",
    year: "1967",
    who: "雅克·塔蒂 ·《玩乐时间》",
    book: "PlayTime (1967, 70mm) — The Criterion Collection",
    quote: "70mm 远距离客观大全景配透明玻璃办公楼，多条动作线在同一画幅里并行展开。",
    detail: "塔蒂拒绝用特写指着观众鼻子讲笑话，而是把摄影机退到足够远，让整座现代玻璃城市成为一张巨型舞台。前景警卫、中景旅客与玻璃后的倒影同时发生喜剧，影评界称之为「民主的场面调度」。",
    diagram: "tati",
  },
  {
    id: "bordwell",
    year: "2005",
    who: "大卫·波德维尔 ·《光影中的人物》",
    book: "Figures Traced in Light: On Cinematic Staging (UC Press, 2005)",
    quote: "区分「纵深空间调度（Deep Space）」与「深焦摄影（Deep Focus）」，揭示单镜头调度史。",
    detail: "波德维尔追踪从路易·费雅德、沟口健二到侯孝贤的百年实践，指出优秀导演不靠频繁切镜也能精准引导视线——靠的是人物走位、门洞遮挡开合、前后层次与冷静机位的严密配合。",
    diagram: "bordwell",
  },
];

export function initSection02History() {
  const tabs = [...document.querySelectorAll("[data-hist-id]")];
  const yearEl = document.getElementById("hist-year");
  const whoEl = document.getElementById("hist-who");
  const bookEl = document.getElementById("hist-book");
  const quoteEl = document.getElementById("hist-quote");
  const detailEl = document.getElementById("hist-detail");
  const svgEl = document.getElementById("hist-svg");
  if (!tabs.length || !svgEl) return;

  const diagrams = {
    ozu: `
      <rect x="8" y="8" width="284" height="154" fill="#FAE9D1" stroke="#022037" stroke-width="1.6"/>
      <rect x="28" y="18" width="244" height="124" fill="#E7DACA" stroke="#022037" stroke-width="1.2"/>
      <rect x="78" y="34" width="144" height="108" fill="#FDEDD2" stroke="#022037" stroke-width="1.2"/>
      <line x1="8" y1="112" x2="292" y2="112" stroke="#E6A826" stroke-width="1.4" stroke-dasharray="5 4"/>
      <circle cx="118" cy="106" r="7" fill="#022037"/><rect x="108" y="114" width="20" height="24" fill="#022037"/>
      <circle cx="182" cy="108" r="7" fill="#022037"/><rect x="172" y="116" width="20" height="22" fill="#022037"/>
      <text x="150" y="156" text-anchor="middle" font-size="10.5" fill="#022037" font-family="Noto Sans SC, sans-serif">低平视静态框 · 门廊框中框 · 留白对称</text>
    `,
    bazin: `
      <rect x="8" y="8" width="284" height="154" fill="#FAE9D1" stroke="#022037" stroke-width="1.6"/>
      <line x1="20" y1="142" x2="150" y2="66" stroke="#8694A2" stroke-width="1"/><line x1="280" y1="142" x2="150" y2="66" stroke="#8694A2" stroke-width="1"/>
      <rect x="132" y="42" width="36" height="44" fill="#2B4256"/>
      <circle cx="150" cy="60" r="4" fill="#E6A826"/><rect x="146" y="65" width="8" height="15" fill="#E6A826"/>
      <circle cx="96" cy="78" r="7" fill="#022037"/><rect x="88" y="86" width="16" height="32" fill="#022037"/>
      <circle cx="218" cy="64" r="11" fill="#022037"/><rect x="202" y="77" width="32" height="58" fill="#022037"/>
      <line x1="96" y1="92" x2="150" y2="68" stroke="#E6A826" stroke-width="1.3" stroke-dasharray="4 3"/>
      <line x1="218" y1="88" x2="150" y2="68" stroke="#E6A826" stroke-width="1.3" stroke-dasharray="4 3"/>
      <text x="150" y="156" text-anchor="middle" font-size="10.5" fill="#022037" font-family="Noto Sans SC, sans-serif">前·中·远三层同时合焦 · 自由扫视关系</text>
    `,
    mascelli: `
      <rect x="8" y="8" width="284" height="154" fill="#FAE9D1" stroke="#022037" stroke-width="1.6"/>
      <circle cx="150" cy="68" r="36" fill="none" stroke="#8694A2" stroke-width="1.2" stroke-dasharray="4 4"/>
      <circle cx="134" cy="68" r="6" fill="#022037"/><circle cx="166" cy="68" r="6" fill="#022037"/>
      <line x1="140" y1="68" x2="160" y2="68" stroke="#022037" stroke-width="1.2"/>
      <polygon points="150,130 112,72 188,72" fill="rgba(230,168,38,0.28)" stroke="#855300" stroke-width="1.2"/>
      <rect x="140" y="124" width="20" height="14" fill="#022037"/><circle cx="150" cy="131" r="3.5" fill="#E6A826"/>
      <text x="150" y="156" text-anchor="middle" font-size="10.5" fill="#022037" font-family="Noto Sans SC, sans-serif">场外旁观圆外机位（Sideline Observer）</text>
    `,
    tati: `
      <rect x="8" y="8" width="284" height="154" fill="#FAE9D1" stroke="#022037" stroke-width="1.6"/>
      <rect x="18" y="22" width="264" height="114" fill="#E7DACA" stroke="#84929F" stroke-width="1"/>
      <line x1="84" y1="22" x2="84" y2="136" stroke="#84929F" stroke-width="1"/><line x1="150" y1="22" x2="150" y2="136" stroke="#84929F" stroke-width="1"/><line x1="216" y1="22" x2="216" y2="136" stroke="#84929F" stroke-width="1"/>
      <line x1="18" y1="78" x2="282" y2="78" stroke="#84929F" stroke-width="1"/>
      <circle cx="50" cy="96" r="5" fill="#022037"/><rect x="45" y="102" width="10" height="22" fill="#022037"/>
      <circle cx="118" cy="100" r="4.5" fill="#022037"/><rect x="114" y="105" width="8" height="20" fill="#022037"/>
      <circle cx="184" cy="94" r="5.5" fill="#E6A826"/><rect x="178" y="101" width="12" height="24" fill="#022037"/>
      <circle cx="246" cy="98" r="5" fill="#022037"/><rect x="241" y="104" width="10" height="20" fill="#022037"/>
      <text x="150" y="156" text-anchor="middle" font-size="10.5" fill="#022037" font-family="Noto Sans SC, sans-serif">70mm 宽画幅 · 多组动作同步展开</text>
    `,
    bordwell: `
      <rect x="8" y="8" width="284" height="154" fill="#FAE9D1" stroke="#022037" stroke-width="1.6"/>
      <path d="M56 126 Q118 96 156 84 T244 48" fill="none" stroke="#E6A826" stroke-width="2" stroke-dasharray="5 3"/>
      <circle cx="56" cy="126" r="8" fill="#022037"/>
      <circle cx="156" cy="84" r="6" fill="#2B4256"/>
      <circle cx="244" cy="48" r="4.5" fill="#84929F"/>
      <rect x="228" y="28" width="32" height="36" fill="none" stroke="#022037" stroke-width="1.3"/>
      <text x="150" y="156" text-anchor="middle" font-size="10.5" fill="#022037" font-family="Noto Sans SC, sans-serif">斜向纵深走位 · 单镜头自然移交焦点</text>
    `,
  };

  function select(id) {
    const item = HISTORY_ITEMS.find((x) => x.id === id) || HISTORY_ITEMS[0];
    tabs.forEach((t) => {
      const on = t.dataset.histId === item.id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    yearEl.textContent = item.year;
    whoEl.textContent = item.who;
    bookEl.textContent = item.book;
    quoteEl.textContent = item.quote;
    detailEl.textContent = item.detail;
    svgEl.innerHTML = diagrams[item.diagram] || diagrams.mascelli;
  }

  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.histId)));
  select("mascelli");
}

// =========================================================================
// 03 节（深海蓝暗室）：俯拍走位蓝图 × 正面实时银幕双联动排演桌
// 区别于开场（开场调机位），这里机位固定客观 18m，专门拖动 3 位演员的 3D 走位与光圈景深！
// =========================================================================
export function initSection03StagingLab() {
  const planCanvas = document.getElementById("lab-plan-canvas");
  const viewCanvas = document.getElementById("lab-view-canvas");
  const fstopInput = document.getElementById("lab-fstop");
  const fstopOut = document.getElementById("lab-fstop-out");
  const readoutEl = document.getElementById("lab-readout");
  const presetBtns = [...document.querySelectorAll("[data-lab-preset]")];
  if (!planCanvas || !viewCanvas || !fstopInput) return;

  const actors = [
    { id: "A", name: "甲 · 前景", x: -2.2, z: 4.4, h: 1.78, pose: "back", color: "#E6A826" },
    { id: "B", name: "乙 · 中景", x: 1.9, z: 8.6, h: 1.73, pose: "stand", color: "#5ED4B4" },
    { id: "C", name: "丙 · 远景", x: -0.4, z: 12.6, h: 1.69, pose: "walkR", color: "#CBD7E3" },
  ];

  const PRESETS = {
    triangle: { fstop: 11, pos: [[-2.2, 4.4], [1.9, 8.6], [-0.4, 12.6]] },
    flatLine: { fstop: 11, pos: [[-3.1, 7.6], [0.0, 7.6], [3.1, 7.6]] },
    blocked: { fstop: 11, pos: [[0.0, 4.2], [0.15, 8.5], [-0.1, 12.6]] },
    shallow: { fstop: 1.8, pos: [[-2.2, 4.4], [1.9, 8.6], [-0.4, 12.6]] },
  };

  let fstop = 11;
  let draggingIdx = -1;

  // 俯拍蓝图坐标转换：x ∈ [-6, 6], z ∈ [2.5, 14.5]
  const xToPx = (x, w) => ((x + 6.5) / 13) * w;
  const zToPx = (z, h) => h - ((z - 1.5) / 14.5) * h;
  const pxToX = (px, w) => clamp((px / w) * 13 - 6.5, -5.2, 5.2);
  const pxToZ = (py, h) => clamp(1.5 + ((h - py) / h) * 14.5, 3.2, 13.8);

  function drawAll() {
    const dpr = pixelRatio(2);
    // 1. 俯拍蓝图
    const pr = planCanvas.getBoundingClientRect();
    const pw = Math.max(240, Math.round(pr.width || 360));
    const ph = Math.max(220, Math.round(pr.height || 300));
    planCanvas.width = Math.round(pw * dpr);
    planCanvas.height = Math.round(ph * dpr);
    const pctx = planCanvas.getContext("2d");
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    pctx.fillStyle = "#0B1E30";
    pctx.fillRect(0, 0, pw, ph);

    // 工程坐标网
    pctx.strokeStyle = "rgba(134, 148, 162, 0.2)";
    pctx.lineWidth = 1;
    for (let gx = -6; gx <= 6; gx += 2) {
      const x = xToPx(gx, pw);
      pctx.beginPath(); pctx.moveTo(x, 0); pctx.lineTo(x, ph); pctx.stroke();
    }
    for (let gz = 4; gz <= 14; gz += 2) {
      const y = zToPx(gz, ph);
      pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(pw, y); pctx.stroke();
    }

    // 景深清晰带（按光圈真实变化：f/1.8 窄清晰带，f/11 全场深焦）
    const focusZ = actors[0].z;
    const halfSpan = fstop <= 2.4 ? 1.5 : fstop <= 4.5 ? 3.5 : fstop <= 7.5 ? 6.8 : 13.0;
    const yTop = zToPx(clamp(focusZ + halfSpan, 2, 15.2), ph);
    const yBot = zToPx(clamp(focusZ - halfSpan * 0.65, 2, 15.2), ph);
    pctx.fillStyle = fstop >= 8 ? "rgba(94, 212, 180, 0.14)" : "rgba(230, 168, 38, 0.16)";
    pctx.fillRect(0, yTop, pw, Math.max(10, yBot - yTop));

    // 主馆大门位置
    const doorY = zToPx(15.0, ph);
    pctx.fillStyle = "#E7DACA";
    pctx.fillRect(xToPx(-4.5, pw), doorY - 6, xToPx(4.5, pw) - xToPx(-4.5, pw), 8);
    pctx.fillStyle = "#2B4256";
    pctx.fillRect(xToPx(-1.5, pw), doorY - 6, xToPx(1.5, pw) - xToPx(-1.5, pw), 8);

    // 相机视锥
    const camX = xToPx(0, pw);
    const camY = ph - 14;
    pctx.strokeStyle = "rgba(230, 168, 38, 0.45)";
    pctx.setLineDash([4, 4]);
    pctx.beginPath();
    pctx.moveTo(camX, camY); pctx.lineTo(xToPx(-6.2, pw), 8);
    pctx.moveTo(camX, camY); pctx.lineTo(xToPx(6.2, pw), 8);
    pctx.stroke();
    pctx.setLineDash([]);

    // 三人连线（展示空间调度几何）
    pctx.strokeStyle = "rgba(253, 237, 210, 0.45)";
    pctx.lineWidth = 1.2;
    pctx.beginPath();
    pctx.moveTo(xToPx(actors[0].x, pw), zToPx(actors[0].z, ph));
    pctx.lineTo(xToPx(actors[1].x, pw), zToPx(actors[1].z, ph));
    pctx.lineTo(xToPx(actors[2].x, pw), zToPx(actors[2].z, ph));
    pctx.closePath();
    pctx.stroke();

    // 相机图标
    pctx.fillStyle = PALETTE.gold;
    pctx.fillRect(camX - 10, camY - 6, 20, 11);
    pctx.fillStyle = PALETTE.ink;
    pctx.beginPath();
    pctx.arc(camX, camY - 0.5, 3, 0, Math.PI * 2);
    pctx.fill();

    // 三枚可拖动磁钉
    actors.forEach((a, idx) => {
      const ax = xToPx(a.x, pw);
      const ay = zToPx(a.z, ph);
      pctx.fillStyle = a.color;
      pctx.beginPath();
      pctx.arc(ax, ay, draggingIdx === idx ? 12 : 10, 0, Math.PI * 2);
      pctx.fill();
      pctx.strokeStyle = "#071726";
      pctx.lineWidth = 2;
      pctx.stroke();
      pctx.fillStyle = "#022037";
      pctx.font = '700 11px "Outfit", sans-serif';
      pctx.textAlign = "center";
      pctx.textBaseline = "middle";
      pctx.fillText(a.id, ax, ay + 0.5);
    });
    pctx.textAlign = "left";

    // 2. 正面银幕实时投影
    const vr = viewCanvas.getBoundingClientRect();
    const vw = Math.max(240, Math.round(vr.width || 480));
    const vh = Math.max(200, Math.round(vr.height || 300));
    viewCanvas.width = Math.round(vw * dpr);
    viewCanvas.height = Math.round(vh * dpr);
    const vctx = viewCanvas.getContext("2d");
    vctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mockState = {
      scene: "plaza",
      distance: 17.5,
      pitch: 0,
      tilt: 0,
      focal: 35,
      leadX: 0,
      peek: false,
      playing: false,
      playTime: 0,
      highlightCard: null,
    };
    const cam = makeCamera(mockState, vw, vh);

    // 简易清晰背景（石阶广场建筑，浅景深时后景淡化柔化）
    vctx.fillStyle = PALETTE.paper;
    vctx.fillRect(0, 0, vw, vh);
    const bgAlpha = fstop <= 2.8 ? 0.42 : fstop <= 5.6 ? 0.7 : 1.0;
    vctx.save();
    vctx.globalAlpha = bgAlpha;
    // 石板地
    const g0 = cam.project(-14, 0, 0.5), g1 = cam.project(14, 0, 0.5), g2 = cam.project(14, 0, 15.5), g3 = cam.project(-14, 0, 15.5);
    if (g0.visible && g1.visible && g2.visible && g3.visible) {
      vctx.fillStyle = PALETTE.plaza;
      vctx.beginPath();
      vctx.moveTo(g0.sx, g0.sy); vctx.lineTo(g1.sx, g1.sy); vctx.lineTo(g2.sx, g2.sy); vctx.lineTo(g3.sx, g3.sy);
      vctx.closePath(); vctx.fill();
    }
    // 中馆与大门
    const m0 = cam.project(-6.2, 0, 15.4), m1 = cam.project(6.2, 0, 15.4), m2 = cam.project(6.2, 6.2, 15.4), m3 = cam.project(-6.2, 6.2, 15.4);
    if (m0.visible && m2.visible) {
      vctx.fillStyle = PALETTE.stone;
      vctx.fillRect(m0.sx, m2.sy, m1.sx - m0.sx, m0.sy - m2.sy);
    }
    const d0 = cam.project(-1.6, 0, 15.2), d1 = cam.project(1.6, 0, 15.2), d2 = cam.project(1.6, 3.2, 15.2);
    if (d0.visible && d2.visible) {
      vctx.fillStyle = PALETTE.door;
      vctx.fillRect(d0.sx, d2.sy, d1.sx - d0.sx, d0.sy - d2.sy);
    }
    // 左建筑与右建筑
    const lb0 = cam.project(-13, 0, 7.2), lb1 = cam.project(-6.8, 0, 7.2), lb2 = cam.project(-6.8, 5.8, 7.2);
    if (lb0.visible && lb2.visible) {
      vctx.fillStyle = PALETTE.inkDeep;
      vctx.fillRect(lb0.sx, lb2.sy, lb1.sx - lb0.sx, lb0.sy - lb2.sy);
    }
    const rb0 = cam.project(7.2, 0, 9.0), rb1 = cam.project(13.5, 0, 7.0), rb2 = cam.project(13.5, 6.6, 7.0);
    if (rb0.visible && rb2.visible) {
      vctx.fillStyle = PALETTE.slateRight;
      vctx.fillRect(rb0.sx, rb2.sy, rb1.sx - rb0.sx, rb0.sy - rb2.sy);
    }
    vctx.restore();

    // 投影并按从远到近绘制 3 位演员
    const proj = actors.map((a) => {
      const foot = cam.project(a.x, 0, a.z);
      const head = cam.project(a.x, a.h, a.z);
      const mid = cam.project(a.x, a.h * 0.55, a.z);
      const hPx = foot.visible && head.visible ? Math.abs(foot.sy - head.sy) : 0;
      const inFocus = Math.abs(a.z - focusZ) <= halfSpan;
      return { ...a, foot, head, mid, hPx, inFocus };
    });

    const sorted = [...proj].sort((a, b) => b.z - a.z);
    for (const p of sorted) {
      const alpha = p.inFocus ? 1 : 0.34;
      drawSilhouetteActor(vctx, p, { alpha, isLead: p.id === "A" });
      // 头顶色点标记对应俯拍磁钉
      if (p.head.visible) {
        vctx.fillStyle = p.color;
        vctx.beginPath();
        vctx.arc(p.head.sx, p.head.sy - 11, 5.5, 0, Math.PI * 2);
        vctx.fill();
        vctx.fillStyle = "#022037";
        vctx.font = '700 9.5px "Outfit", sans-serif';
        vctx.textAlign = "center";
        vctx.textBaseline = "middle";
        vctx.fillText(p.id, p.head.sx, p.head.sy - 10.5);
        vctx.textAlign = "left";
      }
    }

    // 边框与景深标牌
    vctx.strokeStyle = PALETTE.ink;
    vctx.lineWidth = 2;
    vctx.strokeRect(1, 1, vw - 2, vh - 2);
    vctx.fillStyle = "rgba(2, 32, 55, 0.9)";
    vctx.fillRect(10, 10, 196, 24);
    vctx.fillStyle = PALETTE.paperLight;
    vctx.font = '500 11px "JetBrains Mono", monospace';
    vctx.textBaseline = "middle";
    vctx.fillText(`f/${fstop.toFixed(1)} · ${fstop >= 8 ? "深焦全景" : "浅景深虚化"}`, 18, 22);

    // 单真源诊断读数：实测深度跨度、遮挡重叠与清晰人数
    const zs = actors.map((a) => a.z);
    const zSpan = +(Math.max(...zs) - Math.min(...zs)).toFixed(1);
    const sharpCount = proj.filter((p) => p.inFocus).length;
    let blocked = false;
    for (let i = 0; i < proj.length; i++) {
      for (let j = i + 1; j < proj.length; j++) {
        if (Math.abs(proj[i].mid.sx - proj[j].mid.sx) < Math.max(16, (proj[i].hPx + proj[j].hPx) * 0.14)) {
          blocked = true;
        }
      }
    }

    fstopOut.textContent = `f/${fstop.toFixed(1)}`;
    let msg = "";
    if (blocked) {
      msg = `【人物互相挡线】纵深跨度 ${zSpan} m，但在镜头轴线上前后重合，后排人物被前排挡死。把俯拍磁钉横向错开，形成三角纵深通道。`;
    } else if (zSpan < 2.2) {
      msg = `【退化成平面排排站】纵深跨度仅 ${zSpan} m，三人挤在同一深度平面，丢失了纵深空间调度（Deep Space）的层次感。试着把乙、丙拉开前后距离。`;
    } else if (sharpCount < 3) {
      msg = `【有纵深空间，缺深焦清晰】三人的纵深跨度达 ${zSpan} m（Deep Space 成立），但 f/${fstop.toFixed(1)} 大光圈只合焦 ${sharpCount}/3 人，后排人物变虚脱离了叙事现场。把光圈收小到 f/8–f/11 即可找回完整关系。`;
    } else {
      msg = `【纵深调度 + 深焦同时成立】纵深跨度 ${zSpan} m、三人横向错落互不遮挡，且 f/${fstop.toFixed(1)} 让 3/3 人物同时清晰锐利——这就是巴赞与波德维尔推崇的客观单镜头叙事。`;
    }
    readoutEl.textContent = msg;
  }

  function findHit(e) {
    const r = planCanvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    for (let i = 0; i < actors.length; i++) {
      const dx = xToPx(actors[i].x, r.width) - px;
      const dy = zToPx(actors[i].z, r.height) - py;
      if (Math.hypot(dx, dy) < 22) return i;
    }
    return -1;
  }

  planCanvas.addEventListener("pointerdown", (e) => {
    const idx = findHit(e);
    if (idx < 0) return;
    draggingIdx = idx;
    planCanvas.setPointerCapture(e.pointerId);
    drawAll();
  });

  planCanvas.addEventListener("pointermove", (e) => {
    if (draggingIdx < 0) return;
    const r = planCanvas.getBoundingClientRect();
    actors[draggingIdx].x = pxToX(e.clientX - r.left, r.width);
    actors[draggingIdx].z = pxToZ(e.clientY - r.top, r.height);
    drawAll();
  });

  const endDrag = () => {
    if (draggingIdx >= 0) {
      draggingIdx = -1;
      drawAll();
    }
  };
  planCanvas.addEventListener("pointerup", endDrag);
  planCanvas.addEventListener("pointercancel", endDrag);

  fstopInput.addEventListener("input", () => {
    fstop = Number(fstopInput.value);
    drawAll();
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.labPreset];
      if (!p) return;
      fstop = p.fstop;
      fstopInput.value = String(fstop);
      p.pos.forEach(([x, z], i) => {
        actors[i].x = x;
        actors[i].z = z;
      });
      presetBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      drawAll();
    });
  });

  window.addEventListener("resize", drawAll);
  drawAll();
}

// =========================================================================
// 04 节：四种实战场景处方笺（明确标注经验值，点击切看）
// =========================================================================
export function initSection04Scenarios() {
  const btns = [...document.querySelectorAll("[data-use-btn]")];
  const panels = [...document.querySelectorAll("[data-use-panel]")];
  if (!btns.length) return;
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.useBtn;
      btns.forEach((b) => {
        const on = b.dataset.useBtn === id;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      panels.forEach((p) => {
        p.hidden = p.dataset.usePanel !== id;
      });
    });
  });
}

// =========================================================================
// 05 节：什么时候别用 —— 4 组正反翻牌对比
// =========================================================================
export function initSection05Avoid() {
  const cards = [...document.querySelectorAll("[data-avoid-card]")];
  cards.forEach((card) => {
    const toggle = card.querySelector("[data-avoid-toggle]");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const flipped = card.classList.toggle("is-fixed");
      toggle.textContent = flipped ? "看回「误用客观」" : "切换「对症改拍」";
      toggle.setAttribute("aria-pressed", String(flipped));
    });
  });
}

// =========================================================================
// 06 节（深海蓝暗室）：客观取景小练习（严格单变量：锁定 35mm 平视 0° 水平 0°，仅变观察距离；答题前绝不剧透参数）
// =========================================================================
const QUIZ_OPTIONS = [
  {
    key: "A",
    label: "机位 A",
    promptTag: "方案 01 · 点击判定",
    state: { scene: "plaza", distance: 5.0, pitch: 0, tilt: 0, focal: 35, leadX: 0.0, peek: false, playing: false, playTime: 0, highlightCard: null },
    correct: false,
    reason: "距离贴得太近（5.0 m），前景抵达者双腿被底框裁断，左侧暗靛大楼与右侧金黄秋树大半出画，丢掉了「信息完整」与广场语境。",
  },
  {
    key: "B",
    label: "机位 B",
    promptTag: "方案 02 · 点击判定",
    state: { scene: "plaza", distance: 9.6, pitch: 0, tilt: 0, focal: 35, leadX: 0.0, peek: false, playing: false, playTime: 0, highlightCard: null },
    correct: false,
    reason: "看似拍进了人物全身，但 9.6 m 仍未退到客观安全带（推荐 11–26.5 m）：左侧窗楼已被挤出画面、右侧秋树紧贴裁边，观众仍感到镜头贴身逼近。",
  },
  {
    key: "C",
    label: "机位 C",
    promptTag: "方案 03 · 点击判定",
    state: { scene: "plaza", distance: 18.0, pitch: 0, tilt: 0, focal: 35, leadX: 0.0, peek: false, playing: false, playTime: 0, highlightCard: null },
    correct: true,
    reason: "回答正确！18.0 m 恰好处在克制的旁观距离：前景抵达者、远景等待者、左右建筑、石阶大门与秋树完整同框且比例舒展，空间关系一目了然。",
  },
  {
    key: "D",
    label: "机位 D",
    promptTag: "方案 04 · 点击判定",
    state: { scene: "plaza", distance: 32.0, pitch: 0, tilt: 0, focal: 35, leadX: 0.0, peek: false, playing: false, playTime: 0, highlightCard: null },
    correct: false,
    reason: "「保持距离」不是越远越好：退到 32.0 m 后，虽然整座广场全装进画幅，但前景人物已缩成约 9% 高的小黑点，动作朝向模糊，滑向冷漠监控图。",
  },
];

export function initSection06Quiz() {
  const buttons = [...document.querySelectorAll("[data-quiz-key]")];
  const resultBox = document.getElementById("quiz-result");
  const resultTitle = document.getElementById("quiz-result-title");
  const resultBody = document.getElementById("quiz-result-body");
  const resultList = document.getElementById("quiz-result-list");
  const resetBtn = document.getElementById("quiz-reset");
  if (!buttons.length || !resultBox) return;

  const evalByKey = new Map();

  function drawQuizThumbs() {
    const dpr = pixelRatio(2);
    buttons.forEach((btn) => {
      const opt = QUIZ_OPTIONS.find((o) => o.key === btn.dataset.quizKey);
      const canvas = btn.querySelector("canvas");
      if (!opt || !canvas) return;
      const r = canvas.getBoundingClientRect();
      const w = Math.max(160, Math.round(r.width || 280));
      const h = Math.max(100, Math.round(r.height || 156));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ev = evaluate(opt.state, w, h);
      evalByKey.set(opt.key, ev);
      renderHeroStage(ctx, w, h, opt.state, ev, { compact: true });
    });
  }

  function revealSpecs(show) {
    QUIZ_OPTIONS.forEach((opt) => {
      const specEl = document.querySelector(`[data-quiz-spec="${opt.key}"]`);
      if (!specEl) return;
      if (!show) {
        specEl.textContent = opt.promptTag;
      } else {
        const ev = evalByKey.get(opt.key) || evaluate(opt.state, 320, 180);
        specEl.textContent = `距 ${opt.state.distance.toFixed(1)} m · 主体占画高 ${ev.leadHeightPct}%`;
      }
    });
  }

  function pick(key) {
    const picked = QUIZ_OPTIONS.find((o) => o.key === key);
    if (!picked) return;
    buttons.forEach((btn) => {
      const k = btn.dataset.quizKey;
      const opt = QUIZ_OPTIONS.find((o) => o.key === k);
      btn.classList.toggle("is-selected", k === key);
      btn.classList.toggle("is-correct", opt.correct);
      btn.classList.toggle("is-wrong", k === key && !opt.correct);
      btn.setAttribute("aria-pressed", String(k === key));
    });
    revealSpecs(true);
    resultBox.hidden = false;
    resultBox.classList.toggle("is-pass", picked.correct);
    resultTitle.textContent = picked.correct
      ? "选择准确：机位 C 守住了恰当的旁观距离（18.0 m）"
      : `你选了机位 ${picked.key} —— 差在观察距离（正确答案是机位 C）`;
    resultBody.textContent = picked.reason;
    resultList.innerHTML = QUIZ_OPTIONS.map((o) => {
      const ev = evalByKey.get(o.key) || evaluate(o.state, 320, 180);
      return `<li><strong>${o.label}（距 ${o.state.distance.toFixed(1)} m · 主体占画高 ${ev.leadHeightPct}%）</strong>：${o.reason}</li>`;
    }).join("");
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => pick(btn.dataset.quizKey)));
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.remove("is-selected", "is-correct", "is-wrong");
        b.setAttribute("aria-pressed", "false");
      });
      revealSpecs(false);
      resultBox.hidden = true;
    });
  }

  window.addEventListener("resize", drawQuizThumbs);
  drawQuizThumbs();
  revealSpecs(false);
}

// =========================================================================
// 07 节：原海报灯箱（可放大、拖动、滚轮缩放、Esc 关，图加 draggable="false"）
// =========================================================================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("lightbox");
  const stage = document.getElementById("lightbox-stage");
  const img = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lightbox-in");
  const zoomOutBtn = document.getElementById("lightbox-out");
  const zoomResetBtn = document.getElementById("lightbox-reset");
  const scaleOut = document.getElementById("lightbox-scale");
  if (!thumb || !modal || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseTx = 0;
  let baseTy = 0;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (scaleOut) scaleOut.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    img.src = thumb.src; // 只复用已内联的原海报，绝不二次内联
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  thumb.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 1, 4);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 4);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  stage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 4);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  img.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    baseTx = tx;
    baseTy = ty;
    img.setPointerCapture(e.pointerId);
  });
  img.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = baseTx + (e.clientX - startX);
    ty = baseTy + (e.clientY - startY);
    applyTransform();
  });
  const stop = () => { dragging = false; };
  img.addEventListener("pointerup", stop);
  img.addEventListener("pointercancel", stop);

  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") { scale = clamp(scale + 0.3, 1, 4); applyTransform(); }
    else if (e.key === "-") { scale = clamp(scale - 0.3, 1, 4); if (scale === 1) { tx = 0; ty = 0; } applyTransform(); }
  });
}
