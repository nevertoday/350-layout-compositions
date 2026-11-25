// 157 边注版式 — 正文 01–07 节六套独立微交互与原海报灯箱
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

// ============================================================
// 01 节：脚注 / 尾注 / 平齐边注 视线往返跳距对比器
// ============================================================
export function initEyePathLab() {
  const root = document.getElementById("eye-lab");
  if (!root) return;
  const modeBtns = [...root.querySelectorAll("[data-eye-mode]")];
  const anchorBtns = [...root.querySelectorAll("[data-eye-anchor]")];
  const svg = root.querySelector("#eye-svg");
  const readoutTitle = root.querySelector("#eye-readout-title");
  const readoutBody = root.querySelector("#eye-readout-body");
  const statJump = root.querySelector("#eye-stat-jump");
  const statBreak = root.querySelector("#eye-stat-break");
  const statCost = root.querySelector("#eye-stat-cost");

  const MODES = {
    footnote: {
      name: "页底脚注",
      jumpLines: "下行 14 行再折返",
      breaks: "离开当前段落视野",
      cost: "较高（需重新定位断行）",
      title: "视线被迫垂直坠落到底栏，再折返寻行",
      body: "读到句中数字上标时，眼球不得不跳出当前段落直奔页脚；读完那句解释后，再凭记忆爬回刚才中断的那一行，顺畅的思考节奏被切成两半。",
    },
    endnote: {
      name: "文末尾注",
      jumpLines: "翻页 / 跨屏跳离",
      breaks: "彻底离开当前书页",
      cost: "极高（多数读者直接放弃）",
      title: "翻去章末或书尾，几乎必然打断阅读流",
      body: "尾注对排版者最省事，却把全部检索成本转嫁给了读者。纸书要两手夹页来回翻，网页要跨屏滚动——结果就是大多数人干脆不再点开。",
    },
    sidenote: {
      name: "平齐边注",
      jumpLines: "水平余光 0 行落差",
      breaks: "不离开当前阅读行",
      cost: "极低（可读可跳）",
      title: "视线横向一扫即得，不读也能直接滑过",
      body: "注释就立在所指句子的同一水平线上。想深究时眼睛横向略偏即可读完、自然回正；若已熟悉该词，余光掠过完全不打断主线叙事。",
    },
  };

  const ANCHORS = [
    { id: 0, label: "① 视觉层级", ax: 196, ay: 82, note: "大号主文配轻声边注，天然建立两级阅读频道。" },
    { id: 1, label: "② 视线停顿", ax: 242, ay: 146, note: "边白不是空地，而是给眼睛喘息和转折的缓冲带。" },
    { id: 2, label: "③ 关联层次", ax: 164, ay: 208, note: "靠水平平齐或细折线把旁注与锚词牢牢锁成一对。" },
  ];

  let mode = "footnote";
  let active = 0;

  function render() {
    modeBtns.forEach((b) => {
      const on = b.dataset.eyeMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    anchorBtns.forEach((b) => {
      const on = Number(b.dataset.eyeAnchor) === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const m = MODES[mode];
    const a = ANCHORS[active];
    readoutTitle.textContent = m.title;
    readoutBody.textContent = m.body;
    statJump.textContent = m.jumpLines;
    statBreak.textContent = m.breaks;
    statCost.textContent = m.cost;

    // 绘制模拟书页与动态红色视线跳线
    const target =
      mode === "sidenote"
        ? { x: 406, y: a.ay }
        : mode === "footnote"
        ? { x: 168, y: 294 }
        : { x: 520, y: 318 };

    const pathD =
      mode === "sidenote"
        ? `M ${a.ax} ${a.ay} L ${target.x - 16} ${target.y}`
        : mode === "footnote"
        ? `M ${a.ax} ${a.ay} C ${a.ax + 70} ${a.ay + 65}, ${target.x + 88} ${target.y - 45}, ${target.x} ${target.y}`
        : `M ${a.ax} ${a.ay} C ${a.ax + 140} ${a.ay - 30}, 470 ${a.ay + 40}, ${target.x} ${target.y}`;

    const returnD =
      mode === "sidenote"
        ? `M ${target.x - 16} ${target.y + 8} L ${a.ax + 8} ${a.ay + 8}`
        : mode === "footnote"
        ? `M ${target.x - 18} ${target.y - 4} C ${target.x - 90} ${target.y - 70}, ${a.ax - 70} ${a.ay + 40}, ${a.ax - 8} ${a.ay + 6}`
        : `M ${target.x - 10} ${target.y - 12} C 430 285, 310 240, ${a.ax} ${a.ay + 10}`;

    const noteY = mode === "sidenote" ? a.ay - 20 : 274;
    const isGood = mode === "sidenote";
    const strokeCol = isGood ? "#1B6247" : "#B62020";

    svg.innerHTML = `
      <rect x="20" y="18" width="520" height="316" fill="#F3E6D6" stroke="#8C7263" stroke-width="1"/>
      <line x1="364" y1="18" x2="364" y2="334" stroke="#8C7263" stroke-dasharray="3 4" opacity="0.5"/>
      <text x="42" y="44" fill="#5F0E12" font-size="13" font-weight="700" font-family="Noto Serif SC, serif">正文主栏</text>
      <text x="380" y="44" fill="#7A6A5F" font-size="11" font-family="Chivo, sans-serif">MARGIN ZONE</text>
      ${[66, 82, 98, 130, 146, 162, 194, 210, 226]
        .map(
          (y, idx) =>
            `<rect x="42" y="${y}" width="${idx % 3 === 2 ? 225 : 292}" height="7" rx="1" fill="${
              idx === 1 || idx === 4 || idx === 7 ? "#CBB9A5" : "#DFD0BE"
            }"/>`
        )
        .join("")}
      ${ANCHORS.map(
        (pt) => `
        <g>
          <circle cx="${pt.ax}" cy="${pt.ay}" r="${pt.id === active ? 7 : 4.5}" fill="${
          pt.id === active ? strokeCol : "#5F0E12"
        }" opacity="${pt.id === active ? 1 : 0.45}"/>
          <text x="${pt.ax}" y="${pt.ay + 3.5}" text-anchor="middle" fill="#FAF2E6" font-size="9" font-weight="700" font-family="DM Mono, monospace">${
          pt.id + 1
        }</text>
        </g>`
      ).join("")}
      ${
        mode === "sidenote"
          ? `<g>
               <rect x="380" y="${noteY}" width="144" height="58" fill="#FAF2E6" stroke="#1B6247" stroke-width="1.4"/>
               <text x="390" y="${noteY + 18}" fill="#1B6247" font-size="11" font-weight="700" font-family="Noto Serif SC, serif">${a.label}</text>
               <text x="390" y="${noteY + 35}" fill="#4A3F39" font-size="10.5" font-family="LXGW WenKai, serif">${a.note.slice(0, 11)}</text>
               <text x="390" y="${noteY + 49}" fill="#4A3F39" font-size="10.5" font-family="LXGW WenKai, serif">${a.note.slice(11)}</text>
             </g>`
          : mode === "footnote"
          ? `<g>
               <line x1="42" y1="262" x2="334" y2="262" stroke="#5F0E12" stroke-width="1"/>
               <rect x="42" y="272" width="292" height="48" fill="#F0DBC4" stroke="#B62020" stroke-width="1.3"/>
               <text x="52" y="290" fill="#B62020" font-size="11" font-weight="700" font-family="Noto Serif SC, serif">页底脚注 · ${a.label}</text>
               <text x="52" y="308" fill="#4A3F39" font-size="10.5" font-family="LXGW WenKai, serif">${a.note}</text>
             </g>`
          : `<g>
               <rect x="404" y="264" width="126" height="60" fill="#F0DBC4" stroke="#B62020" stroke-dasharray="4 3" stroke-width="1.3"/>
               <text x="414" y="286" fill="#B62020" font-size="11" font-weight="700" font-family="Noto Serif SC, serif">→ 翻往第 248 页</text>
               <text x="414" y="306" fill="#4A3F39" font-size="10" font-family="LXGW WenKai, serif">书末尾注区 · 离页检索</text>
             </g>`
      }
      <path d="${pathD}" fill="none" stroke="${strokeCol}" stroke-width="2.2" stroke-dasharray="${
      isGood ? "none" : "6 4"
    }"/>
      <path d="${returnD}" fill="none" stroke="${strokeCol}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.55"/>
      <circle cx="${target.x}" cy="${target.y}" r="4.5" fill="${strokeCol}"/>
    `;
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.eyeMode;
      render();
    })
  );
  anchorBtns.forEach((b) =>
    b.addEventListener("click", () => {
      active = Number(b.dataset.eyeAnchor);
      render();
    })
  );
  render();
}

// ============================================================
// 02 节：五种边注分工解剖器（得体示范 vs 越界错例）
// ============================================================
export function initRoleAnatomy() {
  const root = document.getElementById("roles-lab");
  if (!root) return;
  const roleBtns = [...root.querySelectorAll("[data-role-idx]")];
  const stateBtns = [...root.querySelectorAll("[data-role-state]")];
  const titleEl = root.querySelector("#role-detail-title");
  const enEl = root.querySelector("#role-detail-en");
  const posterQuoteEl = root.querySelector("#role-poster-quote");
  const specLimitEl = root.querySelector("#role-spec-limit");
  const specLinkEl = root.querySelector("#role-spec-link");
  const previewCard = root.querySelector("#role-preview-card");
  const previewLabel = root.querySelector("#role-preview-label");
  const previewText = root.querySelector("#role-preview-text");
  const previewWhy = root.querySelector("#role-preview-why");

  const ROLES = [
    {
      zh: "注释",
      en: "ANNOTATION",
      quote: "补充说明、解释概念，帮助读者深化理解。",
      limit: "建议 12–35 字，浅撕纸或无底轻字",
      link: "上标编号或平齐虚折线",
      good: {
        label: "得体示范 · 浅纸撕边贴片",
        text: "版心（Type Area）：书页除去上下左右白边后实际排字的区域。",
        why: "一行讲透术语定义，不熟悉的读者瞥一眼就懂，懂行的人直接滑过。",
        cls: "is-torn",
      },
      bad: {
        label: "越界错例 · 塞进整段背景史",
        text: "关于版心一词的由来，须追溯至中世纪手抄本的维拉尔·德·奥内库尔比例画法，再经文艺复兴活字印刷与扬·奇肖尔德的页面黄金比例复原……（以下省略 120 字）",
        why: "注释膨胀成小作文，纵向高度远超所指段落，直接把下方的边注撞飞。",
        cls: "is-bad",
      },
    },
    {
      zh: "指示",
      en: "POINTER",
      quote: "使用符号或连线，引导视线，关联内容。",
      limit: "建议 6–18 字，细框短签 + 折线",
      link: "必须有清晰单线指向目标点，严禁交叉",
      good: {
        label: "得体示范 · 透明细框折线",
        text: "焦琥珀点：波浪导引线穿过三角中轴的交汇锚点。",
        why: "折线精准落回几何图节点，文字简短，读者零猜想即可对号入座。",
        cls: "is-framed",
      },
      bad: {
        label: "越界错例 · 无指向又写模糊方位",
        text: "参见左上方靠里边那块颜色稍深的几何图形（具体位置随屏幕变化）。",
        why: "没有引线与符号，单靠文字描述方位，既费脑又在窄屏重排后立刻失效。",
        cls: "is-bad",
      },
    },
    {
      zh: "补充",
      en: "SUPPLEMENT",
      quote: "提供背景信息或扩展阅读，拓展知识边界。",
      limit: "建议 15–40 字，微暖牛皮纸轻底区分",
      link: "虚线折角或段落齐头",
      good: {
        label: "得体示范 · 暖牛皮轻底卡片",
        text: "延伸：罗伯特·布林赫斯特在 1992 年《字体排印风格要素》4.3 节专论边注。",
        why: "提供可进一步查阅的书目线索，略暖一阶的纸色告诉眼睛「这是可选读支线」。",
        cls: "is-kraft",
      },
      bad: {
        label: "越界错例 · 把主线前提藏进边注",
        text: "注意：如果不先配置环境变量，正文里的全部三个步骤都会报错失败。",
        why: "必读前提绝对不能放进「可选读」的边注！跳过边注的读者会直接踩坑。",
        cls: "is-bad",
      },
    },
    {
      zh: "引导",
      en: "GUIDANCE",
      quote: "给出阅读建议或思考方向，帮助读者聚焦重点。",
      limit: "建议 10–24 字，水平细框 + 轻箭头",
      link: "水平虚线箭头对齐摘句或转折句",
      good: {
        label: "得体示范 · 轻箭水平提示",
        text: "思考：把这页缩到 390px 宽时，哪条边注最该折叠？",
        why: "以一个短问题轻轻托住读者的停顿，强化思考记忆而不抢主文声量。",
        cls: "is-framed",
      },
      bad: {
        label: "越界错例 · 感叹号营销式呼喊",
        text: "！！！必看重点！！这里超级关键一定要背下来！！！",
        why: "过度情绪化的粗框标语破坏了出版级的克制感，整页只剩噪声。",
        cls: "is-bad",
      },
    },
    {
      zh: "语境",
      en: "CONTEXT",
      quote: "提供场景、来源或应用，建立更完整的理解。",
      limit: "建议 12–30 字，清淡细线框标注出处",
      link: "齐底或紧贴引用段落外缘",
      good: {
        label: "得体示范 · 出处语境细框",
        text: "适用：学术专著、长篇深度报道与技术规范文档。",
        why: "用极省墨的细框交代场景与来源，把正文从括号与出处堆砌中解放出来。",
        cls: "is-framed",
      },
      bad: {
        label: "越界错例 · 贴满无关标签与推广",
        text: "推荐阅读 12 篇热门榜单 · 点击领取模板礼包 · 关注专栏不迷路。",
        why: "一旦边注区沦为广告与无关推荐位，读者的大脑会立刻学会自动屏蔽整个页边。",
        cls: "is-bad",
      },
    },
  ];

  let idx = 0;
  let showGood = true;

  function render() {
    const r = ROLES[idx];
    roleBtns.forEach((b) => {
      const on = Number(b.dataset.roleIdx) === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stateBtns.forEach((b) => {
      const on = (b.dataset.roleState === "good") === showGood;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    titleEl.textContent = r.zh;
    enEl.textContent = r.en;
    posterQuoteEl.textContent = `原海报：「${r.quote}」`;
    specLimitEl.textContent = r.limit;
    specLinkEl.textContent = r.link;

    const sample = showGood ? r.good : r.bad;
    previewCard.className = `role-sample-card ${sample.cls}`;
    previewLabel.textContent = sample.label;
    previewText.textContent = sample.text;
    previewWhy.textContent = sample.why;
  }

  roleBtns.forEach((b) =>
    b.addEventListener("click", () => {
      idx = Number(b.dataset.roleIdx);
      render();
    })
  );
  stateBtns.forEach((b) =>
    b.addEventListener("click", () => {
      showGood = b.dataset.roleState === "good";
      render();
    })
  );
  render();
}

// ============================================================
// 03 节：深绛藏书暗室 · 四代书页断代透视 2D Canvas
// ============================================================
export function initHistoryStage() {
  const canvas = document.getElementById("history-canvas");
  const btns = [...document.querySelectorAll("[data-era]")];
  const eraTitle = document.getElementById("era-title");
  const eraMeta = document.getElementById("era-meta");
  const eraBody = document.getElementById("era-body");
  const eraRatio = document.getElementById("era-ratio");
  if (!canvas || !btns.length) return;

  const ERAS = [
    {
      id: "glossa",
      year: "12 世纪",
      title: "拉昂学派《普通注疏》Glossa Ordinaria",
      meta: "中世纪拉丁圣经手抄本 · 大英图书馆与博德利图书馆多有藏本",
      ratio: "中央大字经文 + 行间短注 + 四周宽边注疏",
      body: "抄书人用大幅宽边和行间空隙构成三层阅读建筑：中央写大号经文，行间夹写词义短注（glossa interlinearis），四周宽边排满小号教父评注（glossa marginalis）。后世读者又在羊皮纸上补加朱红记号与细线，把注疏精准拴回词根。",
    },
    {
      id: "min",
      year: "1616 年",
      title: "明万历 · 闵齐伋朱墨套印《春秋左传》",
      meta: "湖州乌程闵氏刻本 · 孙鑛评点 · 墨印正文 × 朱印眉批",
      ratio: "下方墨印经传版心 + 上方天头朱印眉批与行旁朱圈",
      body: "明万历四十四年（1616 年）闵齐伋刊刻朱墨套印本，把原典与批评用双色彻底分层：经文传文一律用墨色刊印，天头宽栏的眉批和字旁圈点则全部以朱红套印。眼睛只需辨色，即可在原文与评点间自由切频。",
    },
    {
      id: "feynman",
      year: "1963 年",
      title: "《费曼物理学讲义》Addison-Wesley 四开本",
      meta: "合著者马修·桑兹记述 · 宽单栏正文 × 外侧宽边栏",
      ratio: "单栏正文约 65% + 外侧宽边栏约 35%（盛放黑板图与边注）",
      body: "为了赶上 1963 年秋季学期出版进度，出版社设计了单栏宽正文配超宽边栏的四开本版式，把大量黑板草图、公式图示和旁注直接排入侧边，免去了反复绕排正文的繁琐工序，意外成就了科学教材的视觉典范。",
    },
    {
      id: "tufte",
      year: "1983–2006 & 1992",
      title: "塔夫特出版系统 × 布林赫斯特排印原则",
      meta: "Edward Tufte（Graphics Press）& Robert Bringhurst（Hartley & Marks, 1992）",
      ratio: "桌面宽外边栏平齐边注 · 网页端由 Tufte CSS 演进为 ⊕ 响应式折叠",
      body: "塔夫特在《定量信息的视觉展示》（1983）、《设想信息》（1990）与《美丽的证据》（2006）中用宽边栏取代脚注；布林赫斯特在 1992 年《字体排印风格要素》4.3 节论证边注凭空间邻近即可免去繁复翻查，并提出正文用上标、注释用正字号的分工。当代网页的 Tufte CSS 进一步解决了小屏折叠难题。",
    },
  ];

  const ctx = canvas.getContext("2d");
  let activeIdx = 0;
  let anim = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let W = 520, H = 340;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = pixelRatio(2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function drawPageLines(x, y, w, h, count, color, lh = 5) {
    ctx.fillStyle = color;
    const gap = (h - count * lh) / Math.max(1, count - 1);
    for (let i = 0; i < count; i++) {
      const lw = i === count - 1 ? w * 0.68 : w;
      ctx.fillRect(x, y + i * (lh + gap), lw, lh);
    }
  }

  function frame(t, dt, { still }) {
    if (still) anim = 1;
    else if (anim < 1) {
      anim = Math.min(1, anim + Math.max(dt, 0.016) * 2.6);
      dirty = true;
    }
    if (!dirty && !still) return;
    dirty = false;

    const ease = 1 - Math.pow(1 - anim, 3);
    ctx.fillStyle = "#1D0709";
    ctx.fillRect(0, 0, W, H);

    // 居中羊皮纸书页底
    const ph = H * 0.84;
    const pw = Math.min(W * 0.86, ph * 1.18);
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#F4E4CE";
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();

    const era = ERAS[activeIdx].id;
    const pad = pw * 0.06;

    if (era === "glossa") {
      // 12 世纪 Glossa Ordinaria：中央大号经文 + 行间短注 + 四周宽边注
      const cx = px + pw * 0.30;
      const cw = pw * 0.40;
      const cy = py + ph * 0.22;
      const ch = ph * 0.56;
      // 四周细小边注（随 ease 淡入）
      ctx.globalAlpha = 0.25 + 0.75 * ease;
      drawPageLines(px + pad, py + pad, pw - pad * 2, ph * 0.12, 3, "#8C6E58", 3.5);
      drawPageLines(px + pad, cy, pw * 0.20, ch, 12, "#8C6E58", 3.2);
      drawPageLines(cx + cw + pw * 0.04, cy, pw * 0.20, ch, 12, "#8C6E58", 3.2);
      drawPageLines(px + pad, cy + ch + ph * 0.05, pw - pad * 2, ph * 0.11, 3, "#8C6E58", 3.5);

      // 中央大号经文
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FBF3E7";
      ctx.fillRect(cx - 4, cy - 4, cw + 8, ch + 8);
      ctx.strokeStyle = "rgba(95, 14, 18, 0.35)";
      ctx.strokeRect(cx - 4, cy - 4, cw + 8, ch + 8);
      for (let i = 0; i < 6; i++) {
        const ly = cy + 6 + i * ((ch - 14) / 5.4);
        ctx.fillStyle = "#1E1714";
        ctx.fillRect(cx + 4, ly, cw - 8, 6.5);
        // 行间短注（朱褐）
        if (i < 5) {
          ctx.fillStyle = "#9C2C24";
          ctx.fillRect(cx + 12, ly + 11, (cw - 24) * 0.58 * ease, 2.5);
        }
      }
      // 标注词
      ctx.fillStyle = "#5F0E12";
      ctx.font = `700 10.5px "Noto Serif SC", serif`;
      ctx.fillText("四周小号边注 · 中央大字经文 · 行间朱注", px + pad, py + ph - 10);
    } else if (era === "min") {
      // 1616 明万历闵齐伋朱墨套印：上方宽天头朱红眉批 + 下方乌丝栏竖排墨印正文 + 行旁朱圈
      const headerH = ph * 0.27;
      // 乌丝栏外框
      ctx.strokeStyle = "#2A201D";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(px + pad, py + headerH, pw - pad * 2, ph - headerH - pad);
      // 天头横界线
      ctx.strokeStyle = "rgba(182, 32, 32, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + pad, py + headerH - 4);
      ctx.lineTo(px + pw - pad, py + headerH - 4);
      ctx.stroke();

      // 天头朱印眉批（竖短行）
      ctx.globalAlpha = 0.25 + 0.75 * ease;
      const cols = 10;
      const colSpan = (pw - pad * 2) / cols;
      for (let c = 0; c < cols; c++) {
        const bx = px + pw - pad - (c + 0.5) * colSpan;
        ctx.fillStyle = "#A81C1C";
        const bh = (headerH - pad * 1.4) * (c % 3 === 0 ? 0.65 : 0.9);
        ctx.fillRect(bx - 2, py + pad * 0.8, 3.6, bh * ease);
      }

      // 正文乌丝栏竖行墨印 + 行旁朱圈
      ctx.globalAlpha = 1;
      for (let c = 0; c < cols; c++) {
        const bx = px + pad + c * colSpan;
        ctx.strokeStyle = "rgba(42, 32, 29, 0.24)";
        ctx.beginPath();
        ctx.moveTo(bx, py + headerH);
        ctx.lineTo(bx, py + ph - pad);
        ctx.stroke();

        // 墨印竖文条
        ctx.fillStyle = "#1B1614";
        ctx.fillRect(bx + colSpan * 0.36, py + headerH + 10, 5.5, (ph - headerH - pad - 22) * (c === 0 ? 0.72 : 0.94));
        // 旁圈朱点
        if (c === 2 || c === 5 || c === 8) {
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.arc(bx + colSpan * 0.78, py + headerH + 22 + k * 20, 2.4 * ease, 0, Math.PI * 2);
            ctx.strokeStyle = "#B62020";
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "#A81C1C";
      ctx.font = `700 10.5px "Noto Serif SC", serif`;
      ctx.fillText("天头朱印眉批 × 下栏墨印经传（1616 朱墨套印）", px + pad, py + ph - 8);
    } else if (era === "feynman") {
      // 1963 费曼讲义：左 64% 单栏正文公式 + 右 36% 宽边栏黑板草图与短注
      const splitX = px + pw * 0.64;
      ctx.strokeStyle = "rgba(95, 14, 18, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(splitX, py + pad);
      ctx.lineTo(splitX, py + ph - pad);
      ctx.stroke();
      ctx.setLineDash([]);

      drawPageLines(px + pad, py + pad + 10, splitX - px - pad * 1.6, ph * 0.30, 6, "#2A221E", 4.5);
      // 居中物理公式块
      ctx.fillStyle = "#EFE0CB";
      ctx.fillRect(px + pad + 12, py + ph * 0.44, splitX - px - pad * 2.3, 26);
      ctx.fillStyle = "#5F0E12";
      ctx.font = `600 11px "DM Mono", monospace`;
      ctx.fillText("F = dp / dt", px + pad + 32, py + ph * 0.44 + 17);
      drawPageLines(px + pad, py + ph * 0.58, splitX - px - pad * 1.6, ph * 0.26, 5, "#2A221E", 4.5);

      // 右侧宽边栏：图示 + 边注（滑入）
      const mx = splitX + 12 + (1 - ease) * 14;
      const mw = px + pw - pad - mx;
      ctx.globalAlpha = 0.25 + 0.75 * ease;
      ctx.strokeStyle = "#5F0E12";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(mx, py + pad + 14, mw, ph * 0.28);
      // 黑板小图：坐标系与抛物线
      ctx.beginPath();
      ctx.moveTo(mx + 10, py + pad + ph * 0.24);
      ctx.quadraticCurveTo(mx + mw * 0.5, py + pad + 22, mx + mw - 10, py + pad + ph * 0.24);
      ctx.strokeStyle = "#DE820B";
      ctx.lineWidth = 2;
      ctx.stroke();

      drawPageLines(mx, py + ph * 0.46, mw, 36, 3, "#6B5648", 3.5);
      drawPageLines(mx, py + ph * 0.65, mw, 36, 3, "#6B5648", 3.5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#5F0E12";
      ctx.font = `700 10.5px "Noto Serif SC", serif`;
      ctx.fillText("64% 推导正文 × 36% 宽边栏图示与边注", px + pad, py + ph - 8);
    } else {
      // 1983–2006 塔夫特 + 1992 布林赫斯特 + Tufte CSS
      const splitX = px + pw * 0.66;
      const anchorYs = [py + ph * 0.22, py + ph * 0.48, py + ph * 0.72];
      drawPageLines(px + pad, py + pad + 10, splitX - px - pad * 1.7, ph * 0.72, 14, "#2B221E", 4.2);

      anchorYs.forEach((ay, k) => {
        // 正文上标朱红数字
        ctx.fillStyle = "#B62020";
        ctx.font = `700 10px "DM Mono", monospace`;
        ctx.fillText(String(k + 1), splitX - pad * 0.9, ay);

        // 平齐水平微标线
        ctx.strokeStyle = "rgba(27, 98, 71, 0.45)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(splitX - pad * 0.5, ay - 2);
        ctx.lineTo(splitX + 8, ay - 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 边注正字号编号 + 轻字
        const mx = splitX + 12;
        const mw = px + pw - pad - mx;
        ctx.globalAlpha = 0.2 + 0.8 * ease;
        ctx.fillStyle = "#5F0E12";
        ctx.font = `700 10.5px "DM Mono", monospace`;
        ctx.fillText(`${k + 1}.`, mx, ay + 1);
        drawPageLines(mx + 16, ay - 6, mw - 18, 22, 2, "#6E5A4E", 3.2);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#1B6247";
      ctx.font = `700 10.5px "Noto Serif SC", serif`;
      ctx.fillText("正文上标 × 边注正号平齐 · 宽屏并肩 / 窄屏 ⊕ 展开", px + pad, py + ph - 8);
    }
  }

  function syncText() {
    const e = ERAS[activeIdx];
    eraTitle.textContent = e.title;
    eraMeta.textContent = `${e.year} · ${e.meta}`;
    eraBody.textContent = e.body;
    eraRatio.textContent = e.ratio;
    btns.forEach((b, i) => {
      const on = i === activeIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();
  const ctl = loop(canvas, frame);

  btns.forEach((b, i) =>
    b.addEventListener("click", () => {
      activeIdx = i;
      anim = reducedMotion.matches ? 1 : 0;
      dirty = true;
      syncText();
      ctl.draw();
    })
  );

  syncText();
  ctl.draw();
}

// ============================================================
// 04 节：320–1440px 活体屏幕拉宽器与 4 种窄屏折返策略
// ============================================================
export function initResponsiveLab() {
  const root = document.getElementById("resp-lab");
  if (!root) return;
  const slider = root.querySelector("#resp-width");
  const widthVal = root.querySelector("#resp-width-val");
  const stratBtns = [...root.querySelectorAll("[data-resp-strat]")];
  const frame = root.querySelector("#resp-frame");
  const statusEl = root.querySelector("#resp-status");
  const toggles = [...root.querySelectorAll("[data-inline-toggle]")];

  let vpWidth = 390;
  let strat = "inline"; // squeeze | inline | below | hide

  function render() {
    widthVal.textContent = `${vpWidth}px`;
    slider.value = String(vpWidth);
    const isNarrow = vpWidth < 760;

    stratBtns.forEach((b) => {
      const on = b.dataset.respStrat === strat;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    // 真实按比例映射模拟阅读框宽度（绝不超出外容器）
    const pct = Math.max(38, Math.min(100, Math.round((vpWidth / 1280) * 100)));
    frame.style.setProperty("--sim-w", `${pct}%`);
    frame.dataset.narrow = String(isNarrow);
    frame.dataset.strat = strat;

    if (!isNarrow) {
      statusEl.className = "resp-status is-ok";
      statusEl.textContent = `${vpWidth}px 宽屏：空间充足，自动展开为「左正文 + 右平齐边注」双频道阅读。`;
    } else if (strat === "squeeze") {
      const bodyW = Math.round(vpWidth * 0.64 - 24);
      const noteW = Math.round(vpWidth * 0.36 - 16);
      statusEl.className = "resp-status is-bad";
      statusEl.textContent = `${vpWidth}px 硬挤双栏（翻车）：正文仅剩约 ${bodyW}px、边注仅剩 ${noteW}px，两栏同时高频断行。`;
    } else if (strat === "inline") {
      statusEl.className = "resp-status is-ok";
      statusEl.textContent = `${vpWidth}px ⊕ 行内折叠（Tufte CSS 做法）：正文占满全宽，点击文内「⊕」即可就地展开或收起边注。`;
    } else if (strat === "below") {
      statusEl.className = "resp-status is-ok";
      statusEl.textContent = `${vpWidth}px 段下轻注卡：边注退到对应段落正下方，以浅纸细竖线承接，不用点击也能顺读。`;
    } else {
      statusEl.className = "resp-status is-bad";
      statusEl.textContent = `${vpWidth}px 直接隐藏（翻车）：表面干净，实则把术语解释与来源信息对全部手机读者一刀切删掉了。`;
    }
  }

  slider.addEventListener("input", () => {
    vpWidth = Number(slider.value);
    render();
  });
  stratBtns.forEach((b) =>
    b.addEventListener("click", () => {
      strat = b.dataset.respStrat;
      render();
    })
  );
  toggles.forEach((btn) =>
    btn.addEventListener("click", () => {
      const target = root.querySelector(`#${btn.dataset.inlineToggle}`);
      if (!target) return;
      const open = target.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "⊖" : "⊕";
    })
  );

  render();
}

// ============================================================
// 05 节：四特征决策问诊矩阵（边注 vs 邻居编号 153–159）
// ============================================================
export function initAvoidMatrix() {
  const root = document.getElementById("avoid-lab");
  if (!root) return;
  const groups = [...root.querySelectorAll("[data-q]")];
  const verdictTag = root.querySelector("#avoid-verdict-tag");
  const verdictTitle = root.querySelector("#avoid-verdict-title");
  const verdictBody = root.querySelector("#avoid-verdict-body");

  const ans = {
    canvas: "wide", // wide | tight
    required: "optional", // optional | must
    density: "sparse", // sparse | dense
    role: "notes", // notes | nav | visual
  };

  function evaluateDecision() {
    if (ans.required === "must") {
      verdictTag.className = "verdict-tag is-warn";
      verdictTag.textContent = "别放边注 · 必读主线信息";
      verdictTitle.textContent = "请留在正文主线，或用 155 插页式版式刻意打断";
      verdictBody.innerHTML =
        '边注的契约是「可选读、可跳过」。安全警示、前置步骤或核心转折放进页边，很容易被快速阅读者略过。若需要强制制造阅读停顿，请看 <a href="https://layout.xiaoxiaodong.ai/155/play/" target="_blank" rel="noopener">155 插页式版式</a>。';
      return;
    }
    if (ans.role === "nav") {
      verdictTag.className = "verdict-tag is-warn";
      verdictTag.textContent = "别用边注 · 应换固定侧栏";
      verdictTitle.textContent = "全站目录、筛选器与跨页工具交给 156 侧栏版式";
      verdictBody.innerHTML =
        '边注和正文是「逐句平齐、局部绑定」的；如果你要在边缘放整页目录、固定导航或长期工具面板，直接采用 <a href="https://layout.xiaoxiaodong.ai/156/play/" target="_blank" rel="noopener">156 侧栏版式</a> 更稳妥。';
      return;
    }
    if (ans.role === "visual") {
      verdictTag.className = "verdict-tag is-warn";
      verdictTag.textContent = "图文穿插 · 看 158 / 159";
      verdictTitle.textContent = "不规则插图绕排或独立悬块，不必硬塞边注栏";
      verdictBody.innerHTML =
        '想让文字紧贴轮廓流动请看 <a href="https://layout.xiaoxiaodong.ai/158/play/" target="_blank" rel="noopener">158 环绕图版式</a>；想让独立信息块浮于主版面之上请看 <a href="https://layout.xiaoxiaodong.ai/159/play/" target="_blank" rel="noopener">159 浮动块版式</a>。';
      return;
    }
    if (ans.canvas === "tight") {
      verdictTag.className = "verdict-tag is-warn";
      verdictTag.textContent = "画幅过窄 · 改用行内折叠或区块";
      verdictTitle.textContent = "弹窗、小卡片或纯窄屏页面不要硬开边注栏";
      verdictBody.innerHTML =
        '页面本身没有 22% 以上的外余白时，硬切边注只会两头挤碎。建议直接采用行内 ⊕ 折叠，或按独立信息块改用 <a href="https://layout.xiaoxiaodong.ai/154/play/" target="_blank" rel="noopener">154 区块式版式</a> / <a href="https://layout.xiaoxiaodong.ai/153/play/" target="_blank" rel="noopener">153 模块化页面</a>。';
      return;
    }
    if (ans.density === "dense") {
      verdictTag.className = "verdict-tag is-warn";
      verdictTag.textContent = "注解过密 · 容易撞车塌陷";
      verdictTitle.textContent = "每行都带长注时，页边会堆成第二堵字墙";
      verdictBody.textContent =
        "如果几乎每两三句就要塞进五六十字长注解，边注卡会连续纵向叠压并被迫顺延出本页。请先砍掉冗余批语，或把长考据归入独立附录。";
      return;
    }
    verdictTag.className = "verdict-tag is-ok";
    verdictTag.textContent = "绝佳匹配 · 推荐使用边注版式";
    verdictTitle.textContent = "宽幅纸面 / 桌面 + 稀疏可选读短注：正是边注主场";
    verdictBody.textContent =
      "你的项目同时具备充裕外余白、适度注解密度与可选读属性。桌面端按 22%–36% 留出边注栏与锚点平齐，移动端提前定好 ⊕ 行内展开或段下轻注卡，即可获得极佳阅读节奏。";
  }

  groups.forEach((btn) =>
    btn.addEventListener("click", () => {
      const q = btn.dataset.q;
      const val = btn.dataset.val;
      ans[q] = val;
      groups
        .filter((x) => x.dataset.q === q)
        .forEach((x) => {
          const on = x.dataset.val === val;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-pressed", String(on));
        });
      evaluateDecision();
    })
  );
  evaluateDecision();
}

// ============================================================
// 06 节：两题单变量小练习（A/B/C/D 中性选项）
// ============================================================
export function initQuiz() {
  const root = document.getElementById("quiz-lab");
  if (!root) return;
  const qBtns = [...root.querySelectorAll("[data-quiz-idx]")];
  const promptEl = root.querySelector("#quiz-prompt");
  const gridEl = root.querySelector("#quiz-grid");
  const fbEl = root.querySelector("#quiz-feedback");
  const retryBtn = root.querySelector("#quiz-retry");

  const QUESTIONS = [
    {
      prompt:
        "第 1 题（宽屏桌面 68:32 暖纸书页）：四张样张使用同一篇短文与同样的 3 条边注，每次只改动一个版面变量。哪一张最符合边注版式？",
      answer: "A",
      options: [
        {
          id: "A",
          label: "方案 A",
          reason:
            "正确。三条边注均与对应正文锚点水平平齐、折线无交叉，且字阶轻于正文、材质统一，视线横扫即得又不喧宾夺主。",
          svg: `
            <rect x="8" y="8" width="120" height="128" fill="#F3E6D6" stroke="#8C7263" stroke-width="0.9"/>
            ${[24, 34, 44, 62, 72, 82, 100, 110, 120].map((y) => `<rect x="16" y="${y}" width="100" height="4.5" fill="#C9B7A3"/>`).join("")}
            <circle cx="122" cy="34" r="3" fill="#5F0E12"/><circle cx="122" cy="72" r="3" fill="#5F0E12"/><circle cx="122" cy="110" r="3" fill="#5F0E12"/>
            <path d="M125 34 L144 34 M125 72 L144 72 M125 110 L144 110" stroke="#5F0E12" stroke-width="1" stroke-dasharray="3 2"/>
            <rect x="145" y="22" width="66" height="24" fill="#FAF2E6" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="151" y="29" width="48" height="3.2" fill="#6B5648"/><rect x="151" y="36" width="36" height="3.2" fill="#9A8577"/>
            <rect x="145" y="60" width="66" height="24" fill="#E6CAA8" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="151" y="67" width="46" height="3.2" fill="#6B5648"/><rect x="151" y="74" width="38" height="3.2" fill="#9A8577"/>
            <rect x="145" y="98" width="66" height="24" fill="#FAF2E6" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="151" y="105" width="44" height="3.2" fill="#6B5648"/><rect x="151" y="112" width="32" height="3.2" fill="#9A8577"/>
          `,
        },
        {
          id: "B",
          label: "方案 B",
          reason:
            "不稳。它与方案 A 位置、连线全同，只改了一个变量——把边注放大加黑成重色实底厚块，视觉权重反压主文，读者视线会被边缘硬生生吸走。",
          svg: `
            <rect x="8" y="8" width="120" height="128" fill="#F3E6D6" stroke="#8C7263" stroke-width="0.9"/>
            ${[24, 34, 44, 62, 72, 82, 100, 110, 120].map((y) => `<rect x="16" y="${y}" width="100" height="4.5" fill="#C9B7A3"/>`).join("")}
            <circle cx="122" cy="34" r="3" fill="#5F0E12"/><circle cx="122" cy="72" r="3" fill="#5F0E12"/><circle cx="122" cy="110" r="3" fill="#5F0E12"/>
            <path d="M125 34 L144 34 M125 72 L144 72 M125 110 L144 110" stroke="#5F0E12" stroke-width="1" stroke-dasharray="3 2"/>
            <rect x="145" y="18" width="66" height="32" fill="#5F0E12"/>
            <rect x="151" y="27" width="52" height="6" fill="#FAF2E6"/><rect x="151" y="38" width="42" height="6" fill="#F0DBC4"/>
            <rect x="145" y="56" width="66" height="32" fill="#5F0E12"/>
            <rect x="151" y="65" width="52" height="6" fill="#FAF2E6"/><rect x="151" y="76" width="40" height="6" fill="#F0DBC4"/>
            <rect x="145" y="94" width="66" height="32" fill="#5F0E12"/>
            <rect x="151" y="103" width="52" height="6" fill="#FAF2E6"/><rect x="151" y="114" width="44" height="6" fill="#F0DBC4"/>
          `,
        },
        {
          id: "C",
          label: "方案 C",
          reason:
            "不稳。它与方案 A 字阶、材质全同，只改了一个变量——把边注上下错序堆到页底且引线交叉，眼睛必须沿乱线长距离爬坡寻注，失去平视即得的意义。",
          svg: `
            <rect x="8" y="8" width="120" height="128" fill="#F3E6D6" stroke="#8C7263" stroke-width="0.9"/>
            ${[24, 34, 44, 62, 72, 82, 100, 110, 120].map((y) => `<rect x="16" y="${y}" width="100" height="4.5" fill="#C9B7A3"/>`).join("")}
            <circle cx="122" cy="34" r="3" fill="#5F0E12"/><circle cx="122" cy="72" r="3" fill="#5F0E12"/><circle cx="122" cy="110" r="3" fill="#5F0E12"/>
            <path d="M125 34 L134 34 L134 114 L144 114" fill="none" stroke="#5F0E12" stroke-width="1" stroke-dasharray="3 2"/>
            <path d="M125 72 L138 72 L138 66 L144 66" fill="none" stroke="#5F0E12" stroke-width="1" stroke-dasharray="3 2"/>
            <path d="M125 110 L130 110 L130 90 L144 90" fill="none" stroke="#5F0E12" stroke-width="1" stroke-dasharray="3 2"/>
            <rect x="145" y="56" width="66" height="22" fill="#E6CAA8" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="151" y="63" width="44" height="3.2" fill="#6B5648"/>
            <rect x="145" y="80" width="66" height="22" fill="#FAF2E6" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="151" y="87" width="46" height="3.2" fill="#6B5648"/>
            <rect x="145" y="104" width="66" height="22" fill="#FAF2E6" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="151" y="111" width="42" height="3.2" fill="#6B5648"/>
          `,
        },
        {
          id: "D",
          label: "方案 D",
          reason:
            "不稳。它删掉了全部引线与注号，同时在正文与边注之间拉开了大段孤立空白，边注悬空漂浮，读者无从判断每一条对应正文哪一句。",
          svg: `
            <rect x="8" y="8" width="102" height="128" fill="#F3E6D6" stroke="#8C7263" stroke-width="0.9"/>
            ${[24, 34, 44, 62, 72, 82, 100, 110, 120].map((y) => `<rect x="16" y="${y}" width="84" height="4.5" fill="#C9B7A3"/>`).join("")}
            <rect x="152" y="22" width="59" height="24" fill="#FAF2E6" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="158" y="29" width="40" height="3.2" fill="#6B5648"/><rect x="158" y="36" width="30" height="3.2" fill="#9A8577"/>
            <rect x="152" y="60" width="59" height="24" fill="#E6CAA8" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="158" y="67" width="38" height="3.2" fill="#6B5648"/><rect x="158" y="74" width="28" height="3.2" fill="#9A8577"/>
            <rect x="152" y="98" width="59" height="24" fill="#FAF2E6" stroke="#8C7263" stroke-width="0.9"/>
            <rect x="158" y="105" width="36" height="3.2" fill="#6B5648"/><rect x="158" y="112" width="26" height="3.2" fill="#9A8577"/>
          `,
        },
      ],
    },
    {
      prompt:
        "第 2 题（390px 手机竖屏重排）：同一篇带 2 条术语边注的科普短文迁到手机端，只改变窄屏处理策略。哪一种方案最稳妥？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A",
          reason:
            "不稳。390px 手机上硬塞左右双栏，正文和边注同时被压成细条，每行只容几个字，上下滚动成本翻倍。",
          svg: `
            <rect x="64" y="8" width="92" height="128" rx="6" fill="#F3E6D6" stroke="#5F0E12" stroke-width="1.2"/>
            ${[24, 34, 44, 54, 68, 78, 88, 98, 112].map((y) => `<rect x="71" y="${y}" width="44" height="4" fill="#C9B7A3"/>`).join("")}
            <rect x="120" y="22" width="29" height="38" fill="#E6CAA8" stroke="#8C7263" stroke-width="0.8"/>
            <rect x="124" y="28" width="20" height="3" fill="#6B5648"/><rect x="124" y="35" width="18" height="3" fill="#6B5648"/><rect x="124" y="42" width="16" height="3" fill="#6B5648"/><rect x="124" y="49" width="14" height="3" fill="#6B5648"/>
            <rect x="120" y="70" width="29" height="38" fill="#FAF2E6" stroke="#8C7263" stroke-width="0.8"/>
            <rect x="124" y="76" width="20" height="3" fill="#6B5648"/><rect x="124" y="83" width="18" height="3" fill="#6B5648"/><rect x="124" y="90" width="16" height="3" fill="#6B5648"/>
          `,
        },
        {
          id: "B",
          label: "方案 B",
          reason:
            "正确。手机端先把正文还给满宽单栏，在术语旁放一枚柔和的 ⊕ 触发印记；读者需要时点一下即可在当段正下方轻柔展开，既保流畅又不丢信息。",
          svg: `
            <rect x="64" y="8" width="92" height="128" rx="6" fill="#F3E6D6" stroke="#5F0E12" stroke-width="1.2"/>
            <rect x="72" y="22" width="76" height="4.5" fill="#C9B7A3"/>
            <rect x="72" y="32" width="58" height="4.5" fill="#C9B7A3"/>
            <circle cx="138" cy="34" r="5" fill="#5F0E12"/><text x="138" y="37" text-anchor="middle" fill="#FAF2E6" font-size="8">+</text>
            <rect x="72" y="44" width="76" height="24" fill="#FAF2E6" stroke="#5F0E12" stroke-width="0.8"/>
            <rect x="72" y="44" width="2.5" height="24" fill="#5F0E12"/>
            <rect x="80" y="51" width="58" height="3.2" fill="#6B5648"/><rect x="80" y="59" width="44" height="3.2" fill="#9A8577"/>
            <rect x="72" y="78" width="76" height="4.5" fill="#C9B7A3"/>
            <rect x="72" y="88" width="76" height="4.5" fill="#C9B7A3"/>
            <rect x="72" y="98" width="60" height="4.5" fill="#C9B7A3"/>
            <circle cx="139" cy="100" r="5" fill="#5F0E12"/><text x="139" y="103" text-anchor="middle" fill="#FAF2E6" font-size="8">+</text>
          `,
        },
        {
          id: "C",
          label: "方案 C",
          reason:
            "不稳。虽然正文满宽很干净，但把全部术语边注直接删除隐藏，手机读者失去解释与来源信息，属于牺牲内容换省事。",
          svg: `
            <rect x="64" y="8" width="92" height="128" rx="6" fill="#F3E6D6" stroke="#5F0E12" stroke-width="1.2"/>
            ${[24, 34, 44, 54, 70, 80, 90, 100, 114].map((y) => `<rect x="72" y="${y}" width="76" height="4.5" fill="#C9B7A3"/>`).join("")}
            <line x1="164" y1="36" x2="206" y2="62" stroke="#8C7263" stroke-dasharray="3 2"/>
            <rect x="166" y="34" width="38" height="30" fill="none" stroke="#8C7263" stroke-dasharray="3 2"/>
          `,
        },
        {
          id: "D",
          label: "方案 D",
          reason:
            "不稳。把长达 40 字的边注用与正文一样粗重的黑字硬插进句子正中，把主句劈成两截，读者连主语和谓语都接不上。",
          svg: `
            <rect x="64" y="8" width="92" height="128" rx="6" fill="#F3E6D6" stroke="#5F0E12" stroke-width="1.2"/>
            <rect x="72" y="22" width="76" height="4.5" fill="#C9B7A3"/>
            <rect x="72" y="32" width="76" height="6.5" fill="#2E2B28"/>
            <rect x="72" y="42" width="76" height="6.5" fill="#2E2B28"/>
            <rect x="72" y="52" width="60" height="6.5" fill="#2E2B28"/>
            <rect x="72" y="66" width="76" height="4.5" fill="#C9B7A3"/>
            <rect x="72" y="76" width="76" height="6.5" fill="#2E2B28"/>
            <rect x="72" y="86" width="76" height="6.5" fill="#2E2B28"/>
            <rect x="72" y="100" width="76" height="4.5" fill="#C9B7A3"/>
          `,
        },
      ],
    },
  ];

  let qIdx = 0;
  let picked = null;

  function render() {
    const q = QUESTIONS[qIdx];
    qBtns.forEach((b, i) => {
      const on = i === qIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    promptEl.textContent = q.prompt;
    gridEl.innerHTML = q.options
      .map((opt) => {
        let cls = "quiz-opt";
        if (picked) {
          if (opt.id === q.answer) cls += " is-correct";
          else if (opt.id === picked) cls += " is-wrong";
        }
        return `
          <button type="button" class="${cls}" data-opt="${opt.id}" aria-pressed="${picked === opt.id}">
            <svg viewBox="0 0 220 144" aria-hidden="true">${opt.svg}</svg>
            <span class="quiz-opt-label">${opt.label}</span>
          </button>`;
      })
      .join("");

    gridEl.querySelectorAll("[data-opt]").forEach((btn) =>
      btn.addEventListener("click", () => {
        picked = btn.dataset.opt;
        render();
      })
    );

    if (!picked) {
      fbEl.className = "quiz-feedback";
      fbEl.textContent = "点击上方 A / B / C / D 任意一张缩略样张作答，选完立即揭示单变量差异。";
      retryBtn.hidden = true;
    } else {
      const chosen = q.options.find((o) => o.id === picked);
      const right = picked === q.answer;
      fbEl.className = `quiz-feedback ${right ? "is-ok" : "is-bad"}`;
      fbEl.textContent = `${right ? "✓ 选对了" : `× 选的是 ${picked}，最稳的是 ${q.answer}`} — ${chosen.reason}`;
      retryBtn.hidden = false;
    }
  }

  qBtns.forEach((b, i) =>
    b.addEventListener("click", () => {
      qIdx = i;
      picked = null;
      render();
    })
  );
  retryBtn.addEventListener("click", () => {
    picked = null;
    render();
  });
  render();
}

// ============================================================
// 07 节：原海报灯箱（复用 #poster 的 src，支持缩放、拖拽、Esc 关闭）
// ============================================================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  if (!poster || !dialog) return;

  const img = dialog.querySelector("#lb-img");
  const closeBtn = dialog.querySelector("#lb-close");
  const zoomInBtn = dialog.querySelector("#lb-zin");
  const zoomOutBtn = dialog.querySelector("#lb-zout");
  const resetBtn = dialog.querySelector("#lb-reset");
  const stage = dialog.querySelector("#lb-stage");

  let scale = 1, tx = 0, ty = 0;
  let dragging = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    if (!img.src) img.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    closeBtn.focus();
  }

  function close() {
    dialog.hidden = true;
    openBtn?.focus();
  }

  poster.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") close();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.4).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.7, +(scale - 0.4).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  img.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
    img.setPointerCapture?.(e.pointerId);
  });
  img.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = dragging.ox + (e.clientX - dragging.sx);
    ty = dragging.oy + (e.clientY - dragging.sy);
    applyTransform();
  });
  img.addEventListener("pointerup", () => (dragging = null));
  img.addEventListener("pointercancel", () => (dragging = null));
}
