// 245 居中器 CENTERER · 主交互与全页模块挂载
import {
  INITIAL_STATE,
  PRESETS,
  evaluate,
  clamp,
} from "./model.js";
import { createAxialStage } from "./stage-canvas.js";

// ============================================================
// 1. 开场：活体居中器视口伸缩台（单真源）
// ============================================================
let state = { ...INITIAL_STATE };
let model = evaluate(state);

const dom = {
  canvas: document.getElementById("axial-stage"),
  statusPill: document.getElementById("hero-status-pill"),
  titleCore: document.getElementById("title-demo-core"),
  wingL: document.getElementById("title-wing-l-val"),
  wingR: document.getElementById("title-wing-r-val"),
  tagAlign: document.getElementById("tag-align"),
  tagCenter: document.getElementById("tag-center"),
  tagFocus: document.getElementById("tag-focus"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagNext: document.getElementById("diag-next"),
  liveCss: document.getElementById("live-css"),
  ctrlMax: document.getElementById("ctrl-max"),
  outMax: document.getElementById("out-max"),
  ctrlGutter: document.getElementById("ctrl-gutter"),
  outGutter: document.getElementById("out-gutter"),
  ctrlVpH: document.getElementById("ctrl-vph"),
  outVpH: document.getElementById("out-vph"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  xModeBtns: [...document.querySelectorAll("[data-xmode]")],
  yModeBtns: [...document.querySelectorAll("[data-ymode]")],
  bsBtns: [...document.querySelectorAll("[data-bs]")],
  vpBtns: [...document.querySelectorAll("[data-vpw]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
};

function syncHeroUI() {
  model = evaluate(state);
  const s = model.state;

  // 顶部状态徽标与自示范刊头标尺
  dom.statusPill.textContent = model.diagnosis.ok
    ? `${model.passedCount} / 4 已校准`
    : `${model.passedCount} / 4 待校准`;
  dom.statusPill.classList.toggle("is-ok", model.diagnosis.ok);
  dom.titleCore.classList.toggle("is-framed", model.diagnosis.ok);

  const wingLabel =
    s.xMode === "fixed-margin"
      ? "固定 220px"
      : s.maxInline === 0
        ? "余白 0px"
        : `auto ${Math.round(model.cur.marginEach)}px`;
  dom.wingL.textContent = wingLabel;
  dom.wingR.textContent = wingLabel;

  // 原海报三栏状态签
  dom.tagAlign.textContent = model.triadStatus.align.tag;
  dom.tagAlign.classList.toggle("is-ok", model.triadStatus.align.ok);
  dom.tagCenter.textContent = model.triadStatus.center.tag;
  dom.tagCenter.classList.toggle("is-ok", model.triadStatus.center.ok);
  dom.tagFocus.textContent = model.triadStatus.focus.tag;
  dom.tagFocus.classList.toggle("is-ok", model.triadStatus.focus.ok);

  // 单真源诊单
  dom.diagCard.classList.toggle("is-ok", model.diagnosis.ok);
  dom.diagBadge.textContent = model.diagnosis.badge;
  dom.diagTitle.textContent = model.diagnosis.title;
  dom.diagBody.textContent = model.diagnosis.body;
  dom.diagNext.textContent = `下一步：${model.diagnosis.next}`;

  // 实算 CSS
  dom.liveCss.textContent = model.css;

  // 滑块与输出同步
  dom.ctrlMax.value = String(s.maxInline);
  dom.outMax.textContent =
    s.maxInline === 0 ? "无上限 (none)" : `${s.maxInline}px (≈${Math.round(s.maxInline / 16)}ic)`;
  dom.ctrlGutter.value = String(s.gutter);
  dom.outGutter.textContent = `${s.gutter}px`;
  dom.ctrlVpH.value = String(s.viewportH);
  dom.outVpH.textContent = `${s.viewportH}px`;

  // 按钮激活态
  dom.sceneBtns.forEach((b) => {
    const on = b.dataset.scene === s.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  dom.xModeBtns.forEach((b) => {
    const on = b.dataset.xmode === s.xMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  dom.yModeBtns.forEach((b) => {
    const on = b.dataset.ymode === s.yMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  dom.bsBtns.forEach((b) => {
    const on = b.dataset.bs === s.boxSizing;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  dom.vpBtns.forEach((b) => {
    const target = Number(b.dataset.vpw);
    const on = Math.abs(s.viewportW - target) <= 24;
    b.classList.toggle("is-active", on);
  });
}

const stageCtrl = createAxialStage(dom.canvas, {
  getModel: () => model,
  onMutate: (patch) => {
    state = { ...state, ...patch };
    syncHeroUI();
  },
});

function mutate(patch) {
  state = { ...state, ...patch };
  syncHeroUI();
  stageCtrl.draw();
}

dom.ctrlMax.addEventListener("input", () => {
  const v = Number(dom.ctrlMax.value);
  // 0 表示 none，拉出 0 后最少从 240px 起跳避免尴尬的 16px 宽
  mutate({ maxInline: v === 0 ? 0 : Math.max(224, v) });
});
dom.ctrlGutter.addEventListener("input", () => {
  mutate({ gutter: Number(dom.ctrlGutter.value) });
});
dom.ctrlVpH.addEventListener("input", () => {
  mutate({ viewportH: Number(dom.ctrlVpH.value) });
});

dom.sceneBtns.forEach((b) => b.addEventListener("click", () => mutate({ scene: b.dataset.scene })));
dom.xModeBtns.forEach((b) => b.addEventListener("click", () => mutate({ xMode: b.dataset.xmode })));
dom.yModeBtns.forEach((b) => b.addEventListener("click", () => mutate({ yMode: b.dataset.ymode })));
dom.bsBtns.forEach((b) => b.addEventListener("click", () => mutate({ boxSizing: b.dataset.bs })));
dom.vpBtns.forEach((b) => b.addEventListener("click", () => mutate({ viewportW: Number(b.dataset.vpw) })));
dom.presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) mutate(p.patch);
  })
);

syncHeroUI();
stageCtrl.draw();

// ============================================================
// 2. 第 01 节：块居中与文字居中对照
// ============================================================
const S1_DATA = {
  full: {
    cls: "is-full",
    mode: "满宽无上限",
    rail: "有左轨，但行太长",
    feel: "回扫跨度过大、容易串行",
  },
  textcenter: {
    cls: "is-textcenter",
    mode: "块居中 · 文居中",
    rail: "锯齿漂移、无锚线",
    feel: "每换一行都要重找起点",
  },
  boxcenter: {
    cls: "is-boxcenter",
    mode: "块居中 · 文左齐",
    rail: "笔直单一垂线",
    feel: "换行回扫最轻松",
  },
};

const s1Stage = document.getElementById("s1-stage");
const s1ModeVal = document.getElementById("s1-mode-val");
const s1RailVal = document.getElementById("s1-rail-val");
const s1FeelVal = document.getElementById("s1-feel-val");
const s1Btns = [...document.querySelectorAll("[data-s1]")];

function setS1(key) {
  const d = S1_DATA[key];
  if (!d) return;
  s1Stage.className = `s1-stage ${d.cls}`;
  s1ModeVal.textContent = d.mode;
  s1RailVal.textContent = d.rail;
  s1FeelVal.textContent = d.feel;
  s1Btns.forEach((b) => {
    const on = b.dataset.s1 === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
s1Btns.forEach((b) => b.addEventListener("click", () => setS1(b.dataset.s1)));

// ============================================================
// 3. 第 02 节：五代 CSS 居中演进步进器
// ============================================================
const ERAS = {
  1996: {
    pill: "W3C CSS1 · 1996",
    cite: "Robert Bringhurst (1992) · W3C REC-CSS1 (1996-12-17)",
    heading: "排印行长传统遇上 CSS1 的 margin: auto",
    desc: "书籍排印学家 Robert Bringhurst 在 1992 年初版《The Elements of Typographic Style》中提出单栏西文舒适行长约 45–75 字符（以 66 字符为佳）。1996 年 12 月 W3C 正式发布 CSS Level 1，规定块级元素同时将 margin-left 与 margin-right 设为 auto 时，浏览器把剩余水平空间平分到两侧，由此奠定网页水平居中的根基。",
    solved: "一行声明就能让定宽或限宽块在任意桌面屏自动水平居中，无需手算像素边距。",
    limit: "只管水平不管垂直；若忘记补 padding-inline，窄屏下文字直接贴边。",
    specNote: "margin-inline: auto（仅水平居中，顶部贴齐）",
    frameStyle: { display: "block", alignContent: "normal", justifyContent: "", alignItems: "" },
    specStyle: { width: "220px", maxWidth: "100%", marginInline: "auto", marginBlock: "0" },
    code: `.column {\n  display: block;\n  max-width: 66ch;\n  margin-left: auto;\n  margin-right: auto;\n}`,
  },
  2012: {
    pill: "Flexbox · 2012",
    cite: "W3C CSS Flexible Box Layout Module Level 1",
    heading: "弹性盒首次把横纵居中变成两行声明",
    desc: "告别表格布局和绝对定位负边距时代，Flexbox 让主轴 justify-content 与交叉轴 align-items 能直截了当地把子项摆进容器正中，迅速成为按钮、卡片与弹窗的标准起手式。",
    solved: "无需知道子元素高度即可实现真正的水平 + 垂直双向居中。",
    limit: "当子元素高出容器时，裸 align-items: center 会把上半截推出负坐标导致无法向上滚回。",
    specNote: "display: flex; justify-content: center; align-items: center",
    frameStyle: { display: "flex", justifyContent: "center", alignItems: "center", alignContent: "normal" },
    specStyle: { width: "230px", maxWidth: "100%", marginInline: "0", marginBlock: "0" },
    code: `.dialog-host {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
  },
  2017: {
    pill: "CSS Grid · 2017",
    cite: "W3C CSS Grid Layout Module Level 1 (2017 主流浏览器同步落地)",
    heading: "网格容器以 place-items: center 一行定心",
    desc: "2017 年主流浏览器同步支持 CSS Grid，二维网格让「把内容摆进单元格正中」压缩成 place-items: center 一条简写，也催生了「主栏居中 + 宽图全出血突破」的网格轨写法。",
    solved: "二维对齐语法极简，并可搭配网格线轻松让个别宽图突破阅读行宽。",
    limit: "仍要搭配 safe 关键词防范溢出，否则矮屏一样会切掉起始边。",
    specNote: "display: grid; place-items: center",
    frameStyle: { display: "grid", placeItems: "center", alignContent: "normal" },
    specStyle: { width: "220px", maxWidth: "100%", marginInline: "0", marginBlock: "0" },
    code: `.stage {\n  display: grid;\n  place-items: center;\n}`,
  },
  2019: {
    pill: "Every Layout · 2019",
    cite: "Heydon Pickering & Andy Bell, Every Layout (2019)",
    heading: "「The Center」成为独立可组合的布局原语",
    desc: "Heydon Pickering 与 Andy Bell 在 2019 年推出的《Every Layout》里把居中器正式抽象成独立原语：用逻辑属性 max-inline-size 封顶行宽、margin-inline: auto 自动分白、padding-inline 守住窄屏护边，并刻意用 content-box 避免护边偷走阅读宽度。",
    solved: "不写一条媒体查询就能从 1440px 到 320px 保持一致行宽与护边，且天然适配竖排/RTL 书写模式。",
    limit: "专注水平行宽与护边；整屏垂直铺底则交给 249 封面原语配合完成。",
    specNote: "content-box + max-inline-size + margin-inline: auto + padding-inline",
    frameStyle: { display: "block", alignContent: "center" },
    specStyle: { width: "256px", maxWidth: "100%", marginInline: "auto", marginBlock: "0" },
    code: `.center {\n  box-sizing: content-box;\n  max-inline-size: var(--measure, 38ic);\n  margin-inline: auto;\n  padding-inline: var(--gutter, 1.5rem);\n}`,
  },
  2024: {
    pill: "Baseline 2024",
    cite: "W3C CSS Box Alignment Level 3 · Safari 17.4 / Chrome 123 / Firefox 125",
    heading: "普通块容器原生支持 align-content: safe center",
    desc: "2024 年 4 月起，普通 display: block 元素无需改成 flex 或 grid，直接写 align-content: safe center 即可沿块轴安全居中——空间够时居中，内容溢出时自动回退 start 顶对齐，彻底堵住负坐标吞顶。",
    solved: "保留原生块级排版流（含常规外边距行为），一行声明兼顾居中与防数据丢失。",
    limit: "仅作用于单块整体内容；多子项复杂分配仍用 Flexbox 或 Grid。",
    specNote: "display: block; align-content: safe center（零改 display）",
    frameStyle: { display: "block", alignContent: "safe center" },
    specStyle: { width: "248px", maxWidth: "100%", marginInline: "auto", marginBlock: "0" },
    code: `.panel {\n  display: block;\n  min-block-size: 260px;\n  align-content: safe center;\n}`,
  },
};

const eraBtns = [...document.querySelectorAll("[data-era]")];
const eraDom = {
  pill: document.getElementById("era-pill"),
  cite: document.getElementById("era-cite"),
  heading: document.getElementById("era-heading"),
  desc: document.getElementById("era-desc"),
  solved: document.getElementById("era-solved"),
  limit: document.getElementById("era-limit"),
  frame: document.getElementById("era-live-frame"),
  spec: document.getElementById("era-specimen"),
  specNote: document.getElementById("era-spec-note"),
  code: document.getElementById("era-code"),
};

function setEra(key) {
  const e = ERAS[key];
  if (!e) return;
  eraDom.pill.textContent = e.pill;
  eraDom.cite.textContent = e.cite;
  eraDom.heading.textContent = e.heading;
  eraDom.desc.textContent = e.desc;
  eraDom.solved.textContent = e.solved;
  eraDom.limit.textContent = e.limit;
  eraDom.specNote.textContent = e.specNote;
  eraDom.code.textContent = e.code;

  // 重置并应用该年代真实 CSS
  eraDom.frame.style.display = e.frameStyle.display || "block";
  eraDom.frame.style.justifyContent = e.frameStyle.justifyContent || "";
  eraDom.frame.style.alignItems = e.frameStyle.alignItems || "";
  eraDom.frame.style.placeItems = e.frameStyle.placeItems || "";
  eraDom.frame.style.alignContent = e.frameStyle.alignContent || "normal";
  Object.assign(eraDom.spec.style, e.specStyle);

  eraBtns.forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
eraBtns.forEach((b) => b.addEventListener("click", () => setEra(b.dataset.era)));
setEra("1996");

// ============================================================
// 4. 第 03 节暗室：左台 safe/unsafe 溢出夹具 + 右台光学质心仪
// ============================================================
let labSafe = "unsafe";
let labH = 164;
const labRig = document.getElementById("lab-scroll-rig");
const labModal = document.getElementById("lab-rig-modal");
const labDim = document.getElementById("lab-rig-dim");
const labStatus = document.getElementById("lab-rig-status");
const labSafeNote = document.getElementById("lab-safe-note");
const labSafeBtns = [...document.querySelectorAll("[data-lab-safe]")];
const labHBtns = [...document.querySelectorAll("[data-lab-h]")];

function syncLabSafe() {
  labRig.style.height = `${labH}px`;
  labRig.classList.toggle("is-unsafe", labSafe === "unsafe");
  labRig.classList.toggle("is-safe", labSafe === "safe");
  labRig.scrollTop = 0;

  const modalH = Math.max(220, Math.round(labModal.offsetHeight || 236));
  const clip = labSafe === "unsafe" && modalH > labH ? Math.round((modalH - labH) / 2) : 0;
  labDim.textContent = `viewport: ${labH}px · content: ${modalH}px`;

  if (clip > 0) {
    labStatus.textContent = `顶边被吞 -${clip}px`;
    labStatus.classList.remove("is-safe");
    labSafeNote.textContent = `当前窗口 ${labH}px 矮于弹窗 ${modalH}px：裸 center 把溢出平分上下两端，第 ① 行顶部标题被推出负坐标约 ${clip}px，滚动条拉到最顶仍无法看见。切到 safe center 即可保住顶边。`;
  } else if (modalH > labH) {
    labStatus.textContent = "safe 回退顶齐 · 完整可滚";
    labStatus.classList.add("is-safe");
    labSafeNote.textContent = `窗口 ${labH}px 虽矮于弹窗 ${modalH}px，但 safe center 检测到溢出后自动改按 start 顶对齐：第 ① 行标题稳在顶部，向下滚动即可读完全部按钮。`;
  } else {
    labStatus.textContent = labSafe === "safe" ? "宽裕居中 · 已开保护" : "宽裕居中（矮屏有隐患）";
    labStatus.classList.toggle("is-safe", labSafe === "safe");
    labSafeNote.textContent = `高窗 ${labH}px 下内容装得下，两种写法表面完全一样——这就是坑常藏到上线后在横屏手机才暴露的原因。点回「矮窗 176px」立见分晓。`;
  }

  labSafeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.labSafe === labSafe));
  labHBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.labH) === labH));
}

labSafeBtns.forEach((b) => b.addEventListener("click", () => { labSafe = b.dataset.labSafe; syncLabSafe(); }));
labHBtns.forEach((b) => b.addEventListener("click", () => { labH = Number(b.dataset.labH); syncLabSafe(); }));
syncLabSafe();

// 光学质心校准台
const OPT_SHAPES = {
  play: {
    axis: "x",
    ideal: 8, // 等边三角外接盒 50% vs 面积质心偏右约 8.3%（相对按钮直径）
    idealLabel: "向右微移 +6%～+8%",
    baseNote: "等边播放三角 ▶ 左侧底边重、右侧尖角轻：外接矩形居中会让图形显得偏左，把图形右移约 +6%～+8% 后视觉重心才落进圆心。",
  },
  badge: {
    axis: "x",
    ideal: -4, // 左图标实心重、右文字尾端轻，整组微向左退约 4% 更平衡
    idealLabel: "向左微调 -4%",
    baseNote: "左侧实心圆徽配右侧渐轻短字时，几何居中常显得略向右偏；让整组略微左移约 4%，按钮视觉重量才对称。",
  },
  card: {
    axis: "y",
    ideal: -4, // 高屏弹窗上提约 4%（46% 高度）防下坠感
    idealLabel: "向上微抬 -4%（46% 高度）",
    baseNote: "高屏里的单张焦点弹窗落在几何 50% 时，人眼常有轻微「下沉感」；向上微抬约 4%（落到约 46% 高度）更显挺拔从容。",
  },
};

let optShape = "play";
let optOffset = 0; // -12 .. +12 (% step 2)
let optReveal = false;

const optSvg = document.getElementById("opt-svg");
const optReadout = document.getElementById("opt-readout");
const optNote = document.getElementById("opt-note");
const optRevealBtn = document.getElementById("opt-reveal");
const optShapeBtns = [...document.querySelectorAll("[data-opt-shape]")];

function renderOptical() {
  const cfg = OPT_SHAPES[optShape];
  const cx = 180;
  const cy = 105;
  const dx = cfg.axis === "x" ? (optOffset / 100) * 140 : 0;
  const dy = cfg.axis === "y" ? (optOffset / 100) * 140 : 0;
  const idealDx = cfg.axis === "x" ? (cfg.ideal / 100) * 140 : 0;
  const idealDy = cfg.axis === "y" ? (cfg.ideal / 100) * 140 : 0;

  let shapeMarkup = "";
  if (optShape === "play") {
    // 圆形播放钮外框 + 几何框等边三角（宽度 56，高度 64）
    const tx = cx + dx;
    shapeMarkup = `
      <circle cx="${cx}" cy="${cy}" r="66" fill="#0C3929" stroke="#7EE4B8" stroke-width="2"/>
      <polygon points="${tx - 28},${cy - 32} ${tx - 28},${cy + 32} ${tx + 28},${cy}" fill="#F89194" stroke="#FFF8F5" stroke-width="1.5"/>
      ${optReveal ? `<rect x="${tx - 28}" y="${cy - 32}" width="56" height="64" fill="none" stroke="rgba(255,255,255,0.35)" stroke-dasharray="4 3"/>` : ""}
    `;
  } else if (optShape === "badge") {
    const bx = cx + dx;
    shapeMarkup = `
      <rect x="${cx - 115}" y="${cy - 34}" width="230" height="68" rx="34" fill="#0C3929" stroke="#7EE4B8" stroke-width="2"/>
      <g transform="translate(${bx - cx}, 0)">
        <circle cx="${cx - 56}" cy="${cy}" r="16" fill="#EE6367"/>
        <rect x="${cx - 28}" y="${cy - 8}" width="84" height="6" fill="#FFF8F5"/>
        <rect x="${cx - 28}" y="${cy + 4}" width="56" height="5" fill="#B8CFC5"/>
      </g>
    `;
  } else {
    const ky = cy + dy;
    shapeMarkup = `
      <rect x="64" y="14" width="232" height="182" fill="#082A1E" stroke="#3A7A62" stroke-width="1.5"/>
      <rect x="${cx - 64}" y="${ky - 34}" width="128" height="68" fill="#FEECE7" stroke="#00452B" stroke-width="2.5"/>
      <rect x="${cx - 46}" y="${ky - 16}" width="92" height="8" fill="#00452B"/>
      <rect x="${cx - 46}" y="${ky}" width="64" height="6" fill="#B52A30"/>
      <rect x="${cx - 46}" y="${ky + 14}" width="44" height="6" fill="#8C7B78"/>
    `;
  }

  const revealMarkup = optReveal
    ? `
      <line x1="${cx}" y1="12" x2="${cx}" y2="198" stroke="#7EE4B8" stroke-width="1.2" stroke-dasharray="4 4"/>
      <line x1="22" y1="${cy}" x2="338" y2="${cy}" stroke="#7EE4B8" stroke-width="1.2" stroke-dasharray="4 4"/>
      <circle cx="${cx + idealDx}" cy="${cy + idealDy}" r="5" fill="#FF9A9C" stroke="#051E15" stroke-width="1.5"/>
      <text x="16" y="24" fill="#7EE4B8" font-size="11" font-family="Space Mono, monospace">虚线 = 几何 50%</text>
      <text x="344" y="24" text-anchor="end" fill="#FF9A9C" font-size="11" font-family="Space Mono, monospace">粉点 = 光学建议 ${cfg.ideal > 0 ? "+" : ""}${cfg.ideal}%</text>
    `
    : `<text x="180" y="200" text-anchor="middle" fill="#9BB8AC" font-size="11" font-family="Noto Sans SC, sans-serif">先凭肉眼调到最正，再点「揭晓参考线」验证</text>`;

  optSvg.innerHTML = `${shapeMarkup}${revealMarkup}`;
  const sign = optOffset > 0 ? `+${optOffset}%` : `${optOffset}%`;
  const dir = optOffset === 0 ? "（几何中心）" : cfg.axis === "x" ? (optOffset > 0 ? "（偏右）" : "（偏左）") : optOffset < 0 ? "（上抬）" : "（下移）";
  optReadout.textContent = `当前手调：${sign}${dir}`;

  if (optReveal) {
    const diff = Math.abs(optOffset - cfg.ideal);
    const judge = diff <= 2 ? "你的手感非常准，已落在光学经验舒适带内！" : `与常见光学经验值（${cfg.idealLabel}）相差 ${diff}%，可以继续微调感受差别。`;
    optNote.textContent = `${judge} ${cfg.baseNote}`;
  } else {
    optNote.textContent = cfg.baseNote;
  }

  optRevealBtn.setAttribute("aria-pressed", String(optReveal));
  optShapeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.optShape === optShape));
}

optShapeBtns.forEach((b) =>
  b.addEventListener("click", () => {
    optShape = b.dataset.optShape;
    optOffset = 0;
    optReveal = false;
    renderOptical();
  })
);
document.getElementById("opt-minus").addEventListener("click", () => {
  optOffset = clamp(optOffset - 2, -12, 12);
  renderOptical();
});
document.getElementById("opt-plus").addEventListener("click", () => {
  optOffset = clamp(optOffset + 2, -12, 12);
  renderOptical();
});
optRevealBtn.addEventListener("click", () => {
  optReveal = !optReveal;
  renderOptical();
});
renderOptical();

// ============================================================
// 5. 第 04 节：content-box 标尺 + 移动端套娃居中器开关矩阵
// ============================================================
const s4BoxBtns = [...document.querySelectorAll("[data-s4-box]")];
const s4Outer = document.getElementById("s4-bar-outer");
const s4Core = document.getElementById("s4-core");
const s4Caption = document.getElementById("s4-box-caption");

s4BoxBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const isBorder = b.dataset.s4Box === "border-box";
    s4Outer.classList.toggle("is-border-box", isBorder);
    s4Core.textContent = isBorder ? "正文芯宽被扣成 536px（≈ 33 汉字）" : "正文芯宽足额 600px（≈ 38 汉字）";
    s4Caption.textContent = isBorder
      ? "border-box 下 600px 包含了两侧 64px 护边，正文行宽悄悄缩水 11%，调护边还会连带改动折行。"
      : "content-box 下总占宽 664px = 32px 左护边 + 600px 完整行宽 + 32px 右护边；换护边不影响正文折行。";
    s4BoxBtns.forEach((x) => x.classList.toggle("is-active", x === b));
  })
);

const nestChecks = [
  document.getElementById("nest-l1"),
  document.getElementById("nest-l2"),
  document.getElementById("nest-l3"),
];
const nestDedupe = document.getElementById("nest-dedupe");
const visLayers = [
  document.getElementById("vis-l1"),
  document.getElementById("vis-l2"),
  document.getElementById("vis-l3"),
];
const nestReadout = document.getElementById("nest-readout");
const nestNote = document.getElementById("nest-note");

function syncNesting() {
  const dedupe = nestDedupe.checked;
  let activeCount = 0;
  let seenFirst = false;

  nestChecks.forEach((cb, idx) => {
    const on = cb.checked && (!dedupe || !seenFirst);
    if (cb.checked) seenFirst = true;
    if (on) activeCount++;
    visLayers[idx].classList.toggle("is-off", !on);
  });

  const lost = activeCount * 40;
  const core = 390 - lost;
  const chars = Math.round(core / 16);
  nestReadout.textContent = `有效芯宽 ${core}px（双侧护边合计 ${lost}px）`;
  nestReadout.classList.toggle("is-ok", activeCount === 1);

  if (activeCount === 0) {
    nestNote.textContent = "三层护边全关：虽然芯宽 390px，但文字零缝贴死手机玻璃边缘，阅读同样局促。";
  } else if (activeCount === 1) {
    nestNote.textContent = `最理想的单层护边：仅损耗 40px（左右各 20px），390px 手机保留 ${core}px（约 ${chars} 汉字/行），既防贴壁又不缩水。`;
  } else {
    nestNote.textContent = `${activeCount} 层居中器叠加护边吃掉 ${lost}px（占 390px 屏宽 ${Math.round((lost / 390) * 100)}%），每行只剩约 ${chars} 个汉字。建议把水平护边收敛到最外层外壳，或对内层设置 padding-inline: 0。`;
  }
}
[...nestChecks, nestDedupe].forEach((el) => el.addEventListener("change", syncNesting));
syncNesting();

// ============================================================
// 6. 第 06 节：小练习
// ============================================================
const QUIZ_EXPLAIN = {
  A: {
    ok: false,
    verdict: "不对 · 方案 A 在 1440px 宽屏会无限拉长",
    explain: "虽然它保留了 24px 手机护边，但 max-inline-size: none 让 1440px 桌面的正文横拉到 1392px（接近 87 个汉字一行），眼球换行回扫极易串行。正解是方案 C。",
  },
  B: {
    ok: false,
    verdict: "不对 · 方案 B 在 390px 手机会零缝贴壁",
    explain: "桌面端用 38ic（约 608px）锁住了行宽，看似很干净；但一旦屏幕缩到 390px，auto 余白归零，padding-inline: 0 让中文文字直接顶死屏幕左右硬边。正解是方案 C。",
  },
  C: {
    ok: true,
    verdict: "答对了 · 方案 C 是唯一两端都稳健的居中器",
    explain: "max-inline-size: 38ic 在 1440px 桌面把每行封顶在约 38 个汉字并由 auto 均分余白；到了 390px 手机它自动收缩且靠 padding-inline: 24px 守住双侧呼吸护边，不溢不贴。",
  },
  D: {
    ok: false,
    verdict: "不对 · 方案 D 是最隐蔽的工程坑（定宽挤爆窄屏）",
    explain: "把 max-inline-size 误写成固定 width: 608px 后，在 1440px 桌面上和方案 C 一模一样；可一到 390px 手机，固定 608px 立刻撑破视口、拖出整页横向滚动条！正解是方案 C。",
  },
};

const quizCards = [...document.querySelectorAll(".quiz-card")];
const quizFb = document.getElementById("quiz-feedback");
const quizVerdict = document.getElementById("quiz-verdict");
const quizExplain = document.getElementById("quiz-explain");
const quizRevealStrip = document.getElementById("quiz-reveal-strip");
const quizRetry = document.getElementById("quiz-retry");

const QUIZ_METRICS = {
  A: "1440 桌面：拉宽至 1392px（过散） · 390 手机：芯宽 342px（护边正常）",
  B: "1440 桌面：芯宽 608px（舒适） · 390 手机：护边 0px（文字贴壁）",
  C: "1440 桌面：芯宽 608px（≈38字） · 390 手机：芯宽 342px（双侧 24px 护边）",
  D: "1440 桌面：芯宽 608px（看似正常） · 390 手机：定宽 608px 横向溢出 +218px",
};

function pickQuiz(choice) {
  const res = QUIZ_EXPLAIN[choice];
  if (!res) return;
  quizCards.forEach((c) => {
    const ch = c.dataset.choice;
    c.classList.remove("is-picked-right", "is-picked-wrong");
    if (ch === choice) c.classList.add(res.ok ? "is-picked-right" : "is-picked-wrong");
    if (!res.ok && ch === "C") c.classList.add("is-picked-right");
  });
  quizFb.hidden = false;
  quizFb.classList.toggle("is-wrong", !res.ok);
  quizVerdict.textContent = res.verdict;
  quizExplain.textContent = res.explain;
  quizRevealStrip.textContent = `实算对照（方案 ${choice}）：${QUIZ_METRICS[choice]}`;
}

quizCards.forEach((c) => c.addEventListener("click", () => pickQuiz(c.dataset.choice)));
quizRetry.addEventListener("click", () => {
  quizCards.forEach((c) => c.classList.remove("is-picked-right", "is-picked-wrong"));
  quizFb.hidden = true;
});

// ============================================================
// 7. 第 07 节：原海报灯箱（复用 #poster.src、支持缩放、拖拽与 Esc）
// ============================================================
const posterImg = document.getElementById("poster");
const lb = document.getElementById("poster-lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLb() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLb();
  lb.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLb() {
  lb.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLb);
document.getElementById("lb-close").addEventListener("click", closeLb);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 0.7, 3.2);
  applyLb();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 0.7, 3.2);
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  applyLb();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1; lbX = 0; lbY = 0;
  applyLb();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbScale <= 1) {
    closeLb();
    return;
  }
  lbDrag = { sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLb();
});
lbViewport.addEventListener("pointerup", () => { lbDrag = null; });
lbViewport.addEventListener("pointercancel", () => { lbDrag = null; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLb();
});
