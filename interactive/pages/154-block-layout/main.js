// 154 区块式版式 · 页面交互总控
import {
  SPECIMENS,
  createBrokenState,
  createSolvedState,
  evaluate,
} from "./model.js";
import { mountWorkbench } from "./canvas.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// ==================== 开场活体工作台 ====================
const state = createBrokenState();
const heroCanvas = $("#hero-canvas");
const miniCanvas = $("#mini-canvas");

const wb = mountWorkbench({
  canvas: heroCanvas,
  miniCanvas,
  state,
  onChange: syncHeroUI,
});

function syncHeroUI() {
  const layout = wb.getLayout();
  const ev = evaluate(state, layout);

  // 1. 顶眉与底带达成徽章
  const topStatus = $("#top-status");
  topStatus.textContent = ev.ok ? "5 / 5 区块成序" : `${ev.passCount} / 5 ${ev.passCount === 0 ? "堆叠失序" : "调校中"}`;
  topStatus.className = `status-pill ${ev.ok ? "is-ok" : "is-err"}`;
  $("#score-readout").textContent = `${ev.passCount}/5`;

  // 2. 标题本身即示范：错态时 5 个字轻微错位堆挤，达标或齐边成块时收进整齐方块框架
  const demoTitle = $("#demo-title");
  demoTitle.classList.toggle("is-jumbled", !ev.principles.structure.ok || !ev.principles.zoning.ok);
  demoTitle.classList.toggle("is-ordered", ev.principles.structure.ok && ev.principles.zoning.ok);

  // 3. 右上微缩色面比例条（单真源）
  const pct = layout.surfacePct;
  const bar = $("#ratio-bar");
  bar.querySelector(".rb-orange").style.width = `${pct.orange}%`;
  bar.querySelector(".rb-cyan").style.width = `${pct.cyan}%`;
  bar.querySelector(".rb-cream").style.width = `${pct.cream}%`;
  bar.querySelector(".rb-black").style.width = `${pct.black}%`;
  $("#mini-nums").textContent = `橙 ${pct.orange}% · 青 ${pct.cyan}% · 纸 ${pct.cream}% · 黑 ${pct.black}%`;

  // 4. 展示舱底沿四项实测读数（单真源）
  $("#m-gutter").textContent = `${layout.gutter}px`;
  $("#m-dom").textContent = `${layout.dominanceRatio.toFixed(1)}×`;
  $("#m-group").textContent = state.grouped
    ? `${layout.chunkCount} 块 · 已归组`
    : `${layout.chunkCount} 块 · 错 2 项`;
  $("#m-chroma").textContent = `${layout.chromaPct}%`;

  // 5. 左栏五原则活体账本
  for (const [id, verdict] of Object.entries(ev.principles)) {
    const badge = $(`#pb-${id}`);
    if (badge) {
      badge.textContent = verdict.status;
      badge.className = `p-badge ${verdict.ok ? "is-ok" : "is-err"}`;
    }
  }
  $$(".p-item").forEach((li) => li.classList.toggle("is-active", li.dataset.p === state.highlightPrinciple));

  // 6. 控台按钮状态同步
  const btnGroup = $("#btn-group");
  btnGroup.textContent = state.grouped ? "归组：已归位" : "归组：混装 2 项";
  btnGroup.className = `act-btn ${state.grouped ? "is-ok" : "is-warn"}`;

  const btnHier = $("#btn-hierarchy");
  btnHier.textContent = state.hierarchyMode === "hierarchical" ? "层级：已拉开" : "层级：平权均分";
  btnHier.className = `act-btn ${state.hierarchyMode === "hierarchical" ? "is-ok" : "is-warn"}`;

  const btnStr = $("#btn-structure");
  btnStr.textContent =
    state.structureMode === "aligned"
      ? "结构：齐边咬合"
      : state.structureMode === "shattered"
      ? "结构：过碎 8 块"
      : "结构：错位散架";
  btnStr.className = `act-btn ${state.structureMode === "aligned" ? "is-ok" : "is-warn"}`;

  const btnShatter = $("#btn-shatter");
  btnShatter.className = `act-btn ${state.structureMode === "shattered" ? "is-warn" : ""}`;

  $("#btn-squint").setAttribute("aria-pressed", String(state.squint));
  $("#btn-xray").setAttribute("aria-pressed", String(state.xray));

  $$(".tab-btn").forEach((b) => b.classList.toggle("is-on", b.dataset.theme === state.theme));
  $$(".spec-btn").forEach((b) => b.classList.toggle("is-on", b.dataset.spec === state.specimen));

  // 7. 底沿炭黑单真源诊单
  const d = ev.diagnosis;
  const diagBadge = $("#diag-badge");
  diagBadge.textContent = d.badge;
  diagBadge.className = `diag-tag ${d.ok ? "is-ok" : "is-err"}`;
  $("#diag-headline").textContent = d.headline;
  $("#diag-reason").textContent = d.reason;
  $("#diag-next").textContent = d.nextStep;
}

// 绑定开场控件
$$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    wb.draw();
    syncHeroUI();
  });
});

$$(".spec-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.spec;
    state.hierarchyMode = "hierarchical";
    wb.draw();
    syncHeroUI();
  });
});

$$(".p-item").forEach((li) => {
  li.querySelector(".p-row").addEventListener("click", () => {
    const p = li.dataset.p;
    state.highlightPrinciple = state.highlightPrinciple === p ? null : p;
    wb.draw();
    syncHeroUI();
  });
});

$("#btn-group").addEventListener("click", () => {
  state.grouped = !state.grouped;
  wb.draw();
  syncHeroUI();
});

$("#btn-hierarchy").addEventListener("click", () => {
  state.hierarchyMode = state.hierarchyMode === "flat" ? "hierarchical" : "flat";
  wb.draw();
  syncHeroUI();
});

$("#btn-structure").addEventListener("click", () => {
  state.structureMode = state.structureMode === "aligned" ? "jitter" : "aligned";
  wb.draw();
  syncHeroUI();
});

$("#btn-shatter").addEventListener("click", () => {
  state.structureMode = state.structureMode === "shattered" ? "aligned" : "shattered";
  wb.draw();
  syncHeroUI();
});

$("#btn-squint").addEventListener("click", () => {
  state.squint = !state.squint;
  wb.draw();
  syncHeroUI();
});

$("#btn-xray").addEventListener("click", () => {
  state.xray = !state.xray;
  wb.draw();
  syncHeroUI();
});

function applyPreset(next) {
  for (const id of ["hero", "guide", "body", "meta"]) {
    if (state.surfaces[id] !== next.surfaces[id]) wb.triggerWipe(id, state.surfaces[id]);
  }
  const keepTheme = state.theme;
  Object.assign(state, next, { theme: keepTheme });
  wb.draw();
  syncHeroUI();
}

$("#btn-solve").addEventListener("click", () => applyPreset(createSolvedState(state.specimen, false)));
$("#btn-alt").addEventListener("click", () => applyPreset(createSolvedState(state.specimen, true)));
$("#btn-reset").addEventListener("click", () => applyPreset(createBrokenState()));

// ==================== 01 共同区域与组块负荷实验 ====================
const CR_COPY = {
  proximity: "没有边框时，人眼自动按距离把靠得近的两项读成一对（AB、CD、EF）。",
  override: "把原本距离较远的 B 与 C、D 与 E 放进同一闭合色块后，人脑立刻改判 B-C、D-E 是一组——共同区域压倒了空间接近。",
  zoned: "把真正属于同一主题的条目装进独立色块、用炭黑沟槽清晰切开，视觉边界与内容逻辑完全重合，扫读阻力降到最低。",
};

function renderCR(mode) {
  const svg = $("#cr-svg");
  const pts = [
    { x: 64, l: "A", sub: "展名" },
    { x: 124, l: "B", sub: "副题" },
    { x: 256, l: "C", sub: "日期" },
    { x: 316, l: "D", sub: "场馆" },
    { x: 448, l: "E", sub: "票价" },
    { x: 508, l: "F", sub: "闭馆" },
  ];
  let boxes = "";
  if (mode === "override") {
    boxes = `
      <rect x="100" y="34" width="180" height="106" fill="#FDE5D2" stroke="#FB6204" stroke-width="3"/>
      <rect x="292" y="34" width="180" height="106" fill="#DCF2F6" stroke="#15B5D1" stroke-width="3"/>
      <text x="190" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#B83B00">错框：硬把 B 与 C 绑成一组</text>
      <text x="382" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#006B7D">错框：硬把 D 与 E 绑成一组</text>
    `;
  } else if (mode === "zoned") {
    boxes = `
      <rect x="30" y="34" width="128" height="106" fill="#FB6204" stroke="#080907" stroke-width="2.5"/>
      <rect x="222" y="34" width="128" height="106" fill="#15B5D1" stroke="#080907" stroke-width="2.5"/>
      <rect x="414" y="34" width="128" height="106" fill="#F6E9D7" stroke="#080907" stroke-width="2.5"/>
      <text x="94" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#0A0B08">主题区</text>
      <text x="286" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#0A0B08">时间地点区</text>
      <text x="478" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#0A0B08">票务注脚区</text>
    `;
  } else {
    boxes = `
      <path d="M56 142 H132 M248 142 H324 M440 142 H516" stroke="#0A0B08" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="94" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#3D3A34">近距成对</text>
      <text x="286" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#3D3A34">近距成对</text>
      <text x="478" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="#3D3A34">近距成对</text>
    `;
  }
  const dots = pts
    .map(
      (p) => `
      <g>
        <rect x="${p.x - 18}" y="58" width="36" height="36" fill="#080907"/>
        <text x="${p.x}" y="81" text-anchor="middle" font-size="15" font-weight="700" fill="#F6E9D7" font-family="DM Mono, monospace">${p.l}</text>
        <text x="${p.x}" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="#0A0B08">${p.sub}</text>
      </g>`
    )
    .join("");
  svg.innerHTML = boxes + dots;
  $("#cr-note").textContent = CR_COPY[mode];
  $$("[data-cr]").forEach((b) => b.classList.toggle("is-on", b.dataset.cr === mode));
}

$$("[data-cr]").forEach((b) => b.addEventListener("click", () => renderCR(b.dataset.cr)));

const CHUNK_MODES = {
  1: {
    cols: "1fr",
    tier: "速扫负荷：偏重（无边界堆叠）",
    ok: false,
    text: "12 条信息全塞在 1 整块里，读者必须逐行通读才能挑出时间与地点，没有视觉抓手。",
    cells: [{ label: "整页未分区文字墙（12 条信息混排）", cls: "", lines: 6 }],
  },
  4: {
    cols: "1.2fr 1fr",
    tier: "速扫负荷：轻快（经验参考带 3–5 块）",
    ok: true,
    text: "4 个清晰主块正好落在单次注视的工作记忆舒适区内，眼睛能先认大区再进细节。",
    cells: [
      { label: "01 主标焦区", cls: "is-orange", lines: 2 },
      { label: "02 展期与动线", cls: "is-cyan", lines: 2 },
      { label: "03 策展导读", cls: "", lines: 3 },
      { label: "04 票务注脚", cls: "is-dark", lines: 1 },
    ],
  },
  8: {
    cols: "repeat(4, 1fr)",
    tier: "速扫负荷：开始吃力（超出 5 块带）",
    ok: false,
    text: "切成 8 块后，主次关系被摊薄，视线必须像扫商品货架一样逐格核对。",
    cells: Array.from({ length: 8 }, (_, i) => ({
      label: `块 0${i + 1}`,
      cls: i === 0 ? "is-orange" : i === 2 ? "is-cyan" : "",
      lines: 2,
    })),
  },
  12: {
    cols: "repeat(4, 1fr)",
    tier: "速扫负荷：过载（碎片网格）",
    ok: false,
    text: "12 个细碎小格把页面割得支离破碎，边界本身比文字更抢眼，彻底失去区块式版式的秩序感。",
    cells: Array.from({ length: 12 }, (_, i) => ({
      label: `#${String(i + 1).padStart(2, "0")}`,
      cls: i % 5 === 0 ? "is-orange" : i % 4 === 1 ? "is-cyan" : "",
      lines: 1,
    })),
  },
};

function renderChunks(n) {
  const cfg = CHUNK_MODES[n];
  const stage = $("#chunk-stage");
  stage.style.gridTemplateColumns = cfg.cols;
  stage.innerHTML = cfg.cells
    .map(
      (c) =>
        `<div class="chunk-cell ${c.cls}"><span>${c.label}</span><div class="chunk-lines">${"<span></span>".repeat(c.lines)}</div></div>`
    )
    .join("");
  const v = $("#chunk-verdict");
  v.innerHTML = `<span class="cv-tier ${cfg.ok ? "is-ok" : "is-warn"}">${cfg.tier}</span><p class="cv-text">${cfg.text}</p>`;
  $$("[data-chunks]").forEach((b) => b.classList.toggle("is-on", Number(b.dataset.chunks) === n));
}

$$("[data-chunks]").forEach((b) => b.addEventListener("click", () => renderChunks(Number(b.dataset.chunks))));

// ==================== 02 原海报四例标本矩阵 ====================
let specDisplayMode = "abstract"; // "abstract" | "real"

function specimenSVG(id, mode) {
  const isReal = mode === "real";
  if (id === "banner") {
    return `<svg viewBox="0 0 360 220" width="360" height="220" role="img" aria-label="顶通焦块示意">
      <rect width="360" height="220" fill="#080907"/>
      <rect x="12" y="12" width="336" height="64" fill="#15B5D1"/>
      <rect x="12" y="88" width="106" height="120" fill="#FB6204"/>
      <rect x="130" y="88" width="218" height="82" fill="#F6E9D7"/>
      <rect x="130" y="182" width="218" height="26" fill="#FB6204"/>
      ${
        isReal
          ? `<text x="24" y="42" font-size="18" font-weight="900" fill="#0A0B08">2026 现代平面秩序年展</text>
             <text x="24" y="62" font-size="11" font-weight="700" fill="#052A32">① 顶通标题块先抓全幅入口</text>
             <text x="22" y="114" font-size="13" font-weight="900" fill="#0A0B08">11.12</text>
             <text x="22" y="132" font-size="13" font-weight="900" fill="#0A0B08">12.28</text>
             <text x="22" y="156" font-size="11" font-weight="700" fill="#0A0B08">② 左竖焦</text>
             <text x="142" y="112" font-size="13" font-weight="900" fill="#0A0B08">③ 暖纸承接策展导读</text>
             <text x="142" y="132" font-size="11" fill="#3D3A34">正文远离强色块，保证连续可读性。</text>
             <text x="142" y="150" font-size="11" fill="#3D3A34">左右边界齐缝，视线向下自然滑入。</text>
             <text x="142" y="199" font-size="11" font-weight="700" fill="#0A0B08">④ 底沿细橙条：预约入场 · 东馆 3F</text>`
          : `<rect x="144" y="102" width="166" height="10" fill="#080907"/>
             <rect x="144" y="120" width="166" height="10" fill="#080907"/>
             <rect x="144" y="138" width="144" height="10" fill="#080907"/>
             <circle cx="332" cy="28" r="10" fill="#080907"/><text x="332" y="32" text-anchor="middle" font-size="11" font-weight="700" fill="#22C9E6">1</text>
             <circle cx="102" cy="104" r="10" fill="#080907"/><text x="102" y="108" text-anchor="middle" font-size="11" font-weight="700" fill="#FF7A24">2</text>
             <circle cx="332" cy="104" r="10" fill="#080907"/><text x="332" y="108" text-anchor="middle" font-size="11" font-weight="700" fill="#F6E9D7">3</text>
             <circle cx="332" cy="195" r="10" fill="#080907"/><text x="332" y="199" text-anchor="middle" font-size="11" font-weight="700" fill="#FF7A24">4</text>`
      }
    </svg>`;
  }
  if (id === "cards") {
    return `<svg viewBox="0 0 360 220" width="360" height="220" role="img" aria-label="上图三格示意">
      <rect width="360" height="220" fill="#080907"/>
      <rect x="12" y="12" width="336" height="196" fill="#F6E9D7"/>
      <rect x="26" y="26" width="108" height="84" fill="#FB6204"/>
      <rect x="26" y="124" width="308" height="22" fill="#080907"/>
      <rect x="26" y="158" width="96" height="38" fill="#15B5D1"/>
      <rect x="132" y="158" width="96" height="38" fill="#15B5D1"/>
      <rect x="238" y="158" width="96" height="38" fill="#15B5D1"/>
      ${
        isReal
          ? `<text x="36" y="56" font-size="15" font-weight="900" fill="#0A0B08">核心视觉</text>
             <text x="36" y="76" font-size="11" font-weight="700" fill="#0A0B08">① 左上橙方</text>
             <text x="150" y="50" font-size="15" font-weight="900" fill="#0A0B08">② 专题标题与导语</text>
             <text x="150" y="72" font-size="11" fill="#3D3A34">右上暖纸承接主标题与简介，</text>
             <text x="150" y="90" font-size="11" fill="#3D3A34">形成图文并置的经典上方单元。</text>
             <text x="36" y="139" font-size="11" font-weight="700" fill="#F6E9D7">③ 炭黑横带：切断上下，引出三项并列亮点</text>
             <text x="74" y="182" text-anchor="middle" font-size="12" font-weight="900" fill="#0A0B08">④A 亮点一</text>
             <text x="180" y="182" text-anchor="middle" font-size="12" font-weight="900" fill="#0A0B08">④B 亮点二</text>
             <text x="286" y="182" text-anchor="middle" font-size="12" font-weight="900" fill="#0A0B08">④C 亮点三</text>`
          : `<rect x="150" y="34" width="176" height="11" fill="#080907"/>
             <rect x="150" y="56" width="176" height="11" fill="#080907"/>
             <rect x="150" y="78" width="144" height="11" fill="#080907"/>
             <circle cx="118" cy="42" r="10" fill="#080907"/><text x="118" y="46" text-anchor="middle" font-size="11" font-weight="700" fill="#FF7A24">1</text>
             <circle cx="318" cy="100" r="10" fill="#080907"/><text x="318" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="#F6E9D7">2</text>
             <circle cx="322" cy="135" r="8" fill="#15B5D1"/><text x="322" y="139" text-anchor="middle" font-size="10" font-weight="700" fill="#080907">3</text>
             <circle cx="320" cy="177" r="10" fill="#080907"/><text x="320" y="181" text-anchor="middle" font-size="11" font-weight="700" fill="#22C9E6">4</text>`
      }
    </svg>`;
  }
  if (id === "rail") {
    return `<svg viewBox="0 0 360 220" width="360" height="220" role="img" aria-label="左侧青轨示意">
      <rect width="360" height="220" fill="#080907"/>
      <rect x="12" y="12" width="56" height="196" fill="#15B5D1"/>
      <rect x="80" y="12" width="268" height="196" fill="#F6E9D7"/>
      <rect x="96" y="114" width="114" height="80" fill="#FB6204"/>
      <rect x="218" y="114" width="114" height="80" fill="#15B5D1"/>
      <circle cx="40" cy="54" r="9" fill="#080907"/>
      <circle cx="40" cy="96" r="9" fill="#080907"/>
      <circle cx="40" cy="138" r="9" fill="#080907"/>
      ${
        isReal
          ? `<text x="40" y="182" text-anchor="middle" font-size="11" font-weight="900" fill="#0A0B08">② 索引</text>
             <text x="96" y="42" font-size="16" font-weight="900" fill="#0A0B08">① 大面积正文阅读页</text>
             <text x="96" y="64" font-size="11" fill="#3D3A34">左缘窄轨专放三段目录坐标，右纸留出充裕阅读宽。</text>
             <text x="96" y="84" font-size="11" fill="#3D3A34">下方拆成橙、青双块对照核心结论与操作入口。</text>
             <text x="108" y="144" font-size="13" font-weight="900" fill="#0A0B08">③ 橙色焦点块</text>
             <text x="108" y="164" font-size="11" fill="#0A0B08">主行动 / 核心数据</text>
             <text x="230" y="144" font-size="13" font-weight="900" fill="#0A0B08">④ 青色伴行块</text>
             <text x="230" y="164" font-size="11" fill="#052A32">扩展说明 / 导览</text>`
          : `<rect x="96" y="34" width="144" height="11" fill="#080907"/>
             <rect x="96" y="56" width="232" height="11" fill="#080907"/>
             <rect x="96" y="78" width="212" height="11" fill="#080907"/>
             <circle cx="332" cy="34" r="10" fill="#080907"/><text x="332" y="38" text-anchor="middle" font-size="11" font-weight="700" fill="#F6E9D7">1</text>
             <circle cx="194" cy="130" r="10" fill="#080907"/><text x="194" y="134" text-anchor="middle" font-size="11" font-weight="700" fill="#FF7A24">3</text>
             <circle cx="316" cy="130" r="10" fill="#080907"/><text x="316" y="134" text-anchor="middle" font-size="11" font-weight="700" fill="#22C9E6">4</text>`
      }
    </svg>`;
  }
  return `<svg viewBox="0 0 360 220" width="360" height="220" role="img" aria-label="橙面点阵示意">
    <rect width="360" height="220" fill="#080907"/>
    <rect x="12" y="12" width="218" height="132" fill="#FB6204"/>
    <rect x="242" y="12" width="106" height="162" fill="#15B5D1"/>
    <rect x="12" y="156" width="218" height="52" fill="#F6E9D7"/>
    <rect x="242" y="186" width="106" height="22" fill="#141612" stroke="#3E443B"/>
    ${Array.from({ length: 16 }, (_, i) => {
      const r = Math.floor(i / 4);
      const c = i % 4;
      return `<circle cx="${262 + c * 22}" cy="${74 + r * 22}" r="2.3" fill="#080907"/>`;
    }).join("")}
    ${
      isReal
        ? `<text x="26" y="48" font-size="19" font-weight="900" fill="#0A0B08">① 大幅橙面宣言</text>
           <text x="26" y="74" font-size="12" font-weight="700" fill="#0A0B08">用超过四成面积抢占第一眼，</text>
           <text x="26" y="94" font-size="12" font-weight="700" fill="#0A0B08">专放一句不可错过的核心主张。</text>
           <text x="254" y="40" font-size="12" font-weight="900" fill="#0A0B08">② 青色点阵</text>
           <text x="254" y="56" font-size="10" font-weight="700" fill="#052A32">清单与坐标</text>
           <text x="26" y="178" font-size="12" font-weight="900" fill="#0A0B08">③ 暖纸简述</text>
           <text x="26" y="196" font-size="11" fill="#3D3A34">承接关键背景，避免满屏强色发腻。</text>
           <text x="252" y="201" font-size="10" font-weight="700" fill="#F6E9D7">④ 版权注脚</text>`
        : `<rect x="26" y="34" width="110" height="11" fill="#080907"/>
           <rect x="26" y="56" width="182" height="11" fill="#080907"/>
           <rect x="26" y="78" width="182" height="11" fill="#080907"/>
           <rect x="26" y="100" width="156" height="11" fill="#080907"/>
           <circle cx="212" cy="30" r="10" fill="#080907"/><text x="212" y="34" text-anchor="middle" font-size="11" font-weight="700" fill="#FF7A24">1</text>
           <circle cx="332" cy="30" r="10" fill="#080907"/><text x="332" y="34" text-anchor="middle" font-size="11" font-weight="700" fill="#22C9E6">2</text>
           <circle cx="212" cy="182" r="10" fill="#080907"/><text x="212" y="186" text-anchor="middle" font-size="11" font-weight="700" fill="#F6E9D7">3</text>`
    }
  </svg>`;
}

const SPEC_META_EXTRA = {
  banner: { ratio: "主次跨比 3.1× · 适合活动海报与头条页" },
  cards: { ratio: "主次跨比 2.8× · 适合产品专题与功能三栏" },
  rail: { ratio: "主次跨比 3.0× · 适合导览手册与目录长页" },
  lblock: { ratio: "主次跨比 4.2× · 适合宣言海报与品牌封面" },
};

function renderSpecimens() {
  const grid = $("#specimen-grid");
  grid.innerHTML = Object.values(SPECIMENS)
    .map(
      (s) => `
      <article class="spec-card">
        <div class="spec-card-top">
          <strong>${s.num} ${s.name}</strong>
          <span class="spec-card-en" lang="en">${s.en}</span>
        </div>
        <div class="spec-vis">${specimenSVG(s.id, specDisplayMode)}</div>
        <div class="spec-card-foot">
          <p>${s.summary}</p>
          <div class="spec-card-actions">
            <span class="spec-ratio-tag">${SPEC_META_EXTRA[s.id].ratio}</span>
            <button type="button" class="spec-load-btn" data-load-spec="${s.id}">载入开场压机试调</button>
          </div>
        </div>
      </article>`
    )
    .join("");

  $$("[data-load-spec]", grid).forEach((btn) => {
    btn.addEventListener("click", () => {
      applyPreset(createSolvedState(btn.dataset.loadSpec, false));
      $("#top-stage").scrollIntoView({ block: "start" });
    });
  });
}

$("#spec-mode-abstract").addEventListener("click", () => {
  specDisplayMode = "abstract";
  $("#spec-mode-abstract").classList.add("is-on");
  $("#spec-mode-real").classList.remove("is-on");
  renderSpecimens();
});

$("#spec-mode-real").addEventListener("click", () => {
  specDisplayMode = "real";
  $("#spec-mode-real").classList.add("is-on");
  $("#spec-mode-abstract").classList.remove("is-on");
  renderSpecimens();
});

// ==================== 03 边界四阶炭黑暗室 ====================
const TIER_INFO = {
  1: {
    name: "第 1 阶 · 纯留白切分",
    tier: "界线负担：极轻",
    ok: true,
    title: "不画一根线，只靠区外留白明显大于区内行距建立边界",
    desc: "最省视觉重量的区块划分法，前提是区外间距至少拉到区内行距的 1.5 倍以上；一旦外间距缩窄，四个区块会立刻重新糊在一起。",
  },
  2: {
    name: "第 2 阶 · 细线标尺",
    tier: "界线负担：克制",
    ok: true,
    title: "细线标尺切分，像瑞士报刊一样冷静克制",
    desc: "1–2px 直线几乎不占视觉重量，却能沿横竖基准线把四个区域切得干脆利落；适合资讯密度高、需要客观理性气质的版面。",
  },
  3: {
    name: "第 3 阶 · 浅色面域铺底",
    tier: "界线负担：温和明确",
    ok: true,
    title: "用低饱和浅色面替代边框，既成块又保持呼吸感",
    desc: "把不同功能块铺上温和的浅橙、浅青与暖骨底，既能触发格式塔「共同区域」分组，又不会像粗黑线那样给画面增加僵硬感。",
  },
  4: {
    name: "第 4 阶 · 强对比实色块",
    tier: "界线负担：强冲击（154 原海报法）",
    ok: true,
    title: "信号橙 + 电光青 + 炭墨黑沟槽，3 米外也能一眼读出主次",
    desc: "适合海报、封面与首屏视觉焦点：把 1–2 个高饱和色块留给标题与导引，正文区块依旧守住暖骨纸底面。",
  },
  5: {
    name: "第 5 阶 · 框套框过载（反例）",
    tier: "界线负担：过载噪音",
    ok: false,
    title: "外粗框 + 内虚线框 + 标题横线，线条比字还抢戏",
    desc: "初学者常见陷阱：担心分不清，就在一个区块里反复套线框。多余的边界制造出「笼子感」，反而拖慢阅读速度。",
  },
};

function syncDarkroom() {
  const tier = Number($("#boundary-tier").value);
  const ratioVal = Number($("#spacing-ratio").value); // 8..28 => 0.8x..2.8x
  const ratio = ratioVal / 10;
  const info = TIER_INFO[tier];

  const sheet = $("#dark-sheet");
  sheet.dataset.tier = String(tier);
  sheet.style.setProperty("--sheet-gap", `${Math.round(ratio * 10)}px`);
  sheet.style.setProperty("--sheet-pad", `${tier === 5 ? 10 : Math.round(10 + Math.min(8, ratio * 3))}px`);

  $("#boundary-tier-label").textContent = info.name;
  const ratioState = ratio < 1.4 ? "外缝偏窄易混淆" : ratio > 2.4 ? "偏疏微散" : "经验清晰带";
  $("#spacing-ratio-label").textContent = `${ratio.toFixed(1)}×（${ratioState}）`;

  const warnBySpacing = tier === 1 && ratio < 1.4;
  const isOk = info.ok && !warnBySpacing;
  const drTier = $("#dr-tier");
  drTier.textContent = warnBySpacing ? "界线负担：留白不足，四区混糊" : info.tier;
  drTier.className = `dr-tier ${isOk ? "is-ok" : "is-warn"}`;
  $("#dr-title").textContent = warnBySpacing
    ? `无边框且外/内间距仅 ${ratio.toFixed(1)}×，四块边界开始消失`
    : info.title;
  $("#dr-desc").textContent = warnBySpacing
    ? "纯留白切分完全依赖「区外间距明显大于区内行距」（经验参考 ≥ 1.5×）。把下方滑杆拉到 1.6× 以上，或把边界强度升至细线/浅底。"
    : info.desc;
}

$("#boundary-tier").addEventListener("input", syncDarkroom);
$("#spacing-ratio").addEventListener("input", syncDarkroom);

// ==================== 04 从哪来时间轴 ====================
const ERAS = {
  1917: {
    meta: "1917 · 荷兰莱顿 · Theo van Doesburg / Piet Mondrian",
    title: "风格派（De Stijl）：用正交直线与原色矩形建立视觉平衡",
    body: "Theo van Doesburg 与 Piet Mondrian 于 1917 年创办《De Stijl》杂志，主张摒弃写实装饰，只保留水平与垂直线、矩形色面、原色以及黑、白、灰无彩色。154 号原海报里锐利的黑框隔断与高饱和色块，正是这一几何脉络的直系后代。",
    source: "核实出处：Tate 美术馆艺术词条 De Stijl（tate.org.uk）与 MoMA 风格派馆藏档案。",
    svg: `<svg viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="#080907"/><rect x="8" y="8" width="128" height="114" fill="#FB6204"/><rect x="144" y="8" width="168" height="64" fill="#F6E9D7"/><rect x="144" y="80" width="94" height="112" fill="#F6E9D7"/><rect x="246" y="80" width="66" height="112" fill="#15B5D1"/><rect x="8" y="130" width="128" height="62" fill="#F6E9D7"/></svg>`,
  },
  1928: {
    meta: "1928 · 德国柏林 · Jan Tschichold",
    title: "《新字体排印学》：打破中轴对称，用功能粗线切分信息块",
    body: "Jan Tschichold 于 1928 年出版《Die neue Typographie》，系统总结包豪斯、俄国构成主义与风格派的平面实践：放弃把文字居中堆砌在一条中轴上的旧法，改用非对称块面、粗黑结构线（rules/bars）与积极留白，让「清晰传达」取代装饰。",
    source: "核实出处：Jan Tschichold, Die neue Typographie (Berlin, 1928)；大英百科全书与 MoMA 馆藏说明。",
    svg: `<svg viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="#FCF8F1"/><rect x="16" y="18" width="14" height="164" fill="#080907"/><rect x="44" y="18" width="186" height="24" fill="#FB6204"/><rect x="44" y="54" width="258" height="4" fill="#080907"/><rect x="44" y="72" width="124" height="8" fill="#080907"/><rect x="44" y="88" width="110" height="8" fill="#3D3A34"/><rect x="44" y="104" width="96" height="8" fill="#3D3A34"/><rect x="194" y="72" width="108" height="86" fill="#15B5D1"/><rect x="44" y="168" width="258" height="14" fill="#080907"/></svg>`,
  },
  1956: {
    meta: "1956 & 2001 · 认知心理学 · George A. Miller / Nelson Cowan",
    title: "组块机制与约 4 块上限：区块为何能减轻阅读负荷",
    body: "George A. Miller（1956，《Psychological Review》）提出人脑通过把散碎条目合并成有意义的「组块（chunking）」来突破短时记忆瓶颈；Nelson Cowan（2001，《Behavioral and Brain Sciences》）进一步证明未经复述的纯专注容量大约只有 4 个组块（3–5 块）。这正好解释了为何版面主区块宜收在 3–5 块。",
    source: "核实出处：Miller (1956) DOI 10.1037/h0043158；Cowan (2001) PubMed PMID 11515286。",
    svg: `<svg viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="#080907"/>
      <g fill="#F6E9D7" opacity="0.45">${Array.from({ length: 12 }, (_, i) => `<rect x="${20 + (i % 6) * 20}" y="${30 + Math.floor(i / 6) * 20}" width="12" height="12"/>`).join("")}</g>
      <text x="80" y="92" text-anchor="middle" font-size="11" fill="#F6E9D7">12 项散点</text>
      <path d="M150 54 H176 M170 48 L178 54 L170 60" stroke="#22C9E6" stroke-width="2.5" fill="none"/>
      <rect x="194" y="24" width="52" height="52" fill="#FB6204"/>
      <rect x="254" y="24" width="52" height="52" fill="#15B5D1"/>
      <rect x="194" y="84" width="52" height="52" fill="#F6E9D7"/>
      <rect x="254" y="84" width="52" height="52" fill="#2A2F28" stroke="#F6E9D7"/>
      <text x="250" y="164" text-anchor="middle" font-size="12" font-weight="700" fill="#22C9E6">打包成 4 组块</text></svg>`,
  },
  1981: {
    meta: "1981 · 瑞士 · Josef Müller-Brockmann",
    title: "《平面设计中的网格系统》：让区块切分具备跨页复用纪律",
    body: "Josef Müller-Brockmann 于 1981 年由瑞士 Arthur Niggli 出版社推出双语经典《Raster Systeme für die visuelle Gestaltung / Grid Systems in Graphic Design》，系统演示如何用 8 至 32 个网格田野把图文精确装入对齐区块，使海报、画册与展览系统共享同一套秩序。",
    source: "核实出处：Josef Müller-Brockmann (1981), Arthur Niggli Verlag, ISBN 978-3-7212-0145-1。",
    svg: `<svg viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="#FCF8F1"/>
      ${[0, 1, 2, 3].map((c) => [0, 1, 2].map((r) => `<rect x="${18 + c * 73}" y="${16 + r * 58}" width="63" height="48" fill="none" stroke="#CFC2AE" stroke-dasharray="3 3"/>`).join("")).join("")}
      <rect x="18" y="16" width="136" height="106" fill="#FB6204"/>
      <rect x="164" y="16" width="136" height="48" fill="#15B5D1"/>
      <rect x="164" y="74" width="136" height="106" fill="#080907"/>
      <rect x="18" y="132" width="136" height="48" fill="#F6E9D7" stroke="#080907" stroke-width="2"/></svg>`,
  },
  1992: {
    meta: "1992 · 美国加州大学伯克利分校 · Stephen E. Palmer",
    title: "共同区域原则：为「区块分组」写下格式塔实验证据",
    body: "Stephen E. Palmer 在 1992 年《Cognitive Psychology》发表论文《Common region: A new principle of perceptual grouping》，用视觉实验证明：闭合边界或色块区域是一种独立且极强的格式塔分组法则，无法归约到接近律或闭合律，奠定了现代卡片与区块界面的感知依据。",
    source: "核实出处：Stephen E. Palmer (1992), Cognitive Psychology 24(3): 436–447, PubMed PMID 1516361。",
    svg: `<svg viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="#FCF8F1"/>
      <rect x="20" y="34" width="130" height="132" fill="#FDE5D2" stroke="#FB6204" stroke-width="3"/>
      <rect x="170" y="34" width="130" height="132" fill="#DCF2F6" stroke="#15B5D1" stroke-width="3"/>
      <circle cx="58" cy="100" r="14" fill="#080907"/><circle cx="112" cy="100" r="14" fill="#080907"/>
      <circle cx="208" cy="100" r="14" fill="#080907"/><circle cx="262" cy="100" r="14" fill="#080907"/>
      <text x="85" y="152" text-anchor="middle" font-size="11" font-weight="700" fill="#B83B00">共同区域 A</text>
      <text x="235" y="152" text-anchor="middle" font-size="11" font-weight="700" fill="#006B7D">共同区域 B</text></svg>`,
  },
};

function renderEra(yr) {
  const e = ERAS[yr];
  $("#era-diagram").innerHTML = e.svg;
  $("#era-meta").textContent = e.meta;
  $("#era-title").textContent = e.title;
  $("#era-body").textContent = e.body;
  $("#era-source").textContent = e.source;
  $$(".era-tab").forEach((t) => {
    const on = t.dataset.era === String(yr);
    t.classList.toggle("is-on", on);
    t.setAttribute("aria-selected", String(on));
  });
}

$$(".era-tab").forEach((t) => t.addEventListener("click", () => renderEra(t.dataset.era)));

// ==================== 05 命题分诊 ====================
const BRIEFS = {
  festival: {
    fit: true,
    badge: "非常适合 · 典型多维扫读场景",
    title: "拆成「主视觉 + 展期动线 + 六场论坛 + 票务」四大区块",
    body: "逛展读者带着不同问题来扫海报：有人只看时间，有人找某场嘉宾，有人扫购票码。区块式版式让四组功能一眼分家，不必从第一行读到最后一行。",
    alt: "推荐骨架：Ⅰ 顶通焦块 或 Ⅲ 左侧青轨。",
    svg: `<svg viewBox="0 0 180 130" width="180" height="130"><rect width="180" height="130" fill="#080907"/><rect x="8" y="8" width="164" height="36" fill="#FB6204"/><rect x="8" y="50" width="54" height="72" fill="#15B5D1"/><rect x="68" y="50" width="104" height="46" fill="#F6E9D7"/><rect x="68" y="102" width="104" height="20" fill="#F6E9D7"/></svg>`,
  },
  novel: {
    fit: false,
    badge: "别用 · 会把沉浸叙事切碎",
    title: "长篇连续文学最忌色块强切，留白与稳定单栏才是正解",
    body: "读小说需要均匀、不中断的眼动节奏。若硬套色块与粗沟槽，每隔两段就撞上一道视觉高墙，情绪和语流立刻断片。",
    alt: "替代方案：经典单栏书版，仅靠首行缩进与章节留白换气。",
    svg: `<svg viewBox="0 0 180 130" width="180" height="130"><rect width="180" height="130" fill="#FCF8F1"/>
      <rect x="26" y="18" width="128" height="6" fill="#080907"/><rect x="26" y="32" width="128" height="6" fill="#3D3A34"/><rect x="26" y="46" width="114" height="6" fill="#3D3A34"/>
      <rect x="26" y="68" width="128" height="6" fill="#3D3A34"/><rect x="26" y="82" width="128" height="6" fill="#3D3A34"/><rect x="26" y="96" width="94" height="6" fill="#3D3A34"/>
      <line x1="16" y1="16" x2="164" y2="114" stroke="#B42318" stroke-width="2" stroke-dasharray="4 3"/></svg>`,
  },
  camera: {
    fit: true,
    badge: "非常适合 · 规格参数对照利器",
    title: "用「产品主图 + 核心卖点 + 规格三列 + 配件注脚」切分清晰",
    body: "工业产品单页里图像、数值、接口表混杂。用强色块锚定核心型号，暖纸区承载精细规格参数，采购和工程师几秒就能各取所需。",
    alt: "推荐骨架：Ⅱ 上图三格（左上实拍，底沿三列核心参数）。",
    svg: `<svg viewBox="0 0 180 130" width="180" height="130"><rect width="180" height="130" fill="#080907"/><rect x="8" y="8" width="164" height="114" fill="#F6E9D7"/><rect x="16" y="16" width="54" height="44" fill="#FB6204"/><rect x="78" y="20" width="84" height="8" fill="#080907"/><rect x="78" y="36" width="72" height="6" fill="#3D3A34"/><rect x="16" y="68" width="148" height="12" fill="#080907"/><rect x="16" y="88" width="46" height="26" fill="#15B5D1"/><rect x="67" y="88" width="46" height="26" fill="#15B5D1"/><rect x="118" y="88" width="46" height="26" fill="#15B5D1"/></svg>`,
  },
  poem: {
    fit: false,
    badge: "别用 · 单一信息无需硬切",
    title: "整幅只有 1 张图 + 6 个字，强切四块只会画蛇添足",
    body: "区块式版式是为「多组不同功能的信息」服务的。当画面本来就只有一条纯粹的视觉情绪时，为了显得有设计感而强加四个空盒，只会分散注意力。",
    alt: "替代方案：满幅出血大图配克制单行标题。",
    svg: `<svg viewBox="0 0 180 130" width="180" height="130"><rect width="180" height="130" fill="#080907"/><rect x="10" y="10" width="160" height="110" fill="#2A312C"/><circle cx="90" cy="58" r="24" fill="#F6E9D7" opacity="0.85"/><rect x="62" y="96" width="56" height="6" fill="#F6E9D7"/></svg>`,
  },
};

function renderTriage(id) {
  const b = BRIEFS[id];
  $("#triage-card").innerHTML = `
    <div>
      <span class="tc-badge ${b.fit ? "is-fit" : "is-no"}">${b.badge}</span>
      <h3>${b.title}</h3>
      <p>${b.body}</p>
      <p class="tc-alt">${b.alt}</p>
    </div>
    <div class="tc-svg">${b.svg}</div>`;
  $$(".triage-btn").forEach((btn) => btn.classList.toggle("is-on", btn.dataset.brief === id));
}

$$(".triage-btn").forEach((btn) => btn.addEventListener("click", () => renderTriage(btn.dataset.brief)));

// ==================== 06 单变量盲测小练习 ====================
const QUIZZES = [
  {
    prompt: "下面四张展讯海报的内容、字体、对齐和配色完全一致，只改了一个变量：区块的面积分配与边界沟槽。哪一版能在 3 秒内看清主次、又不把版面切得稀碎？",
    correct: 1,
    options: [
      {
        label: "方案 A",
        why: "沟槽宽度合适，但四块面积几乎均分（各占约 25%）。四个方块势均力敌，视线进场后找不到第一落脚点。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="10" y="10" width="95" height="62" fill="#FB6204"/>
          <rect x="115" y="10" width="95" height="62" fill="#15B5D1"/>
          <rect x="10" y="82" width="95" height="62" fill="#F6E9D7"/>
          <rect x="115" y="82" width="95" height="62" fill="#F6E9D7"/>
          <rect x="18" y="22" width="54" height="9" fill="#0A0B08"/><rect x="18" y="38" width="68" height="5" fill="#0A0B08"/>
          <rect x="123" y="22" width="50" height="8" fill="#0A0B08"/><rect x="123" y="36" width="60" height="5" fill="#052A32"/>
          <rect x="18" y="96" width="70" height="6" fill="#0A0B08"/><rect x="18" y="108" width="62" height="5" fill="#3D3A34"/><rect x="18" y="119" width="52" height="5" fill="#3D3A34"/>
          <rect x="123" y="96" width="64" height="6" fill="#0A0B08"/><rect x="123" y="108" width="48" height="5" fill="#3D3A34"/></svg>`,
      },
      {
        label: "方案 B",
        why: "正确！主标橙块面积最大率先抓眼，导引青块、暖纸正文块与底沿注脚块按重要度阶梯递减，10px 清晰炭黑沟槽既隔开共同区域又不挤占版心。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="10" y="10" width="200" height="52" fill="#FB6204"/>
          <rect x="10" y="72" width="62" height="72" fill="#15B5D1"/>
          <rect x="82" y="72" width="128" height="46" fill="#F6E9D7"/>
          <rect x="82" y="126" width="128" height="18" fill="#F6E9D7"/>
          <rect x="20" y="22" width="108" height="12" fill="#0A0B08"/><rect x="20" y="40" width="136" height="6" fill="#0A0B08"/>
          <rect x="18" y="84" width="40" height="8" fill="#0A0B08"/><rect x="18" y="98" width="44" height="5" fill="#052A32"/>
          <rect x="92" y="82" width="96" height="6" fill="#0A0B08"/><rect x="92" y="94" width="104" height="5" fill="#3D3A34"/><rect x="92" y="104" width="84" height="5" fill="#3D3A34"/>
          <rect x="92" y="132" width="72" height="5" fill="#0A0B08"/></svg>`,
      },
      {
        label: "方案 C",
        why: "面积主次安排得不错，但边界沟槽被压成 1.5px 极细缝，暖纸正文与底沿注脚几乎粘成一块，远看容易混读。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="4" y="4" width="212" height="56" fill="#FB6204"/>
          <rect x="4" y="61.5" width="66" height="88.5" fill="#15B5D1"/>
          <rect x="71.5" y="61.5" width="144.5" height="62" fill="#F6E9D7"/>
          <rect x="71.5" y="125" width="144.5" height="25" fill="#F6E9D7"/>
          <rect x="14" y="18" width="108" height="12" fill="#0A0B08"/><rect x="14" y="36" width="136" height="6" fill="#0A0B08"/>
          <rect x="12" y="76" width="40" height="8" fill="#0A0B08"/><rect x="12" y="90" width="44" height="5" fill="#052A32"/>
          <rect x="80" y="74" width="96" height="6" fill="#0A0B08"/><rect x="80" y="86" width="104" height="5" fill="#3D3A34"/><rect x="80" y="96" width="84" height="5" fill="#3D3A34"/>
          <rect x="80" y="134" width="72" height="5" fill="#0A0B08"/></svg>`,
      },
      {
        label: "方案 D",
        why: "主次比例虽然正确，但炭黑沟槽膨胀到 24px 粗壁，黑框反客为主吞掉大量版心，内部文字和导引被压成局促细条。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="20" y="20" width="180" height="36" fill="#FB6204"/>
          <rect x="20" y="78" width="44" height="56" fill="#15B5D1"/>
          <rect x="86" y="78" width="114" height="24" fill="#F6E9D7"/>
          <rect x="86" y="122" width="114" height="12" fill="#F6E9D7"/>
          <rect x="28" y="30" width="92" height="9" fill="#0A0B08"/>
          <rect x="26" y="90" width="28" height="6" fill="#0A0B08"/>
          <rect x="92" y="86" width="74" height="5" fill="#0A0B08"/>
          <rect x="92" y="126" width="54" height="4" fill="#0A0B08"/></svg>`,
      },
    ],
  },
  {
    prompt: "这四版拥有完全相同的优秀骨架、主次面积与 10px 清晰沟槽，只改了一个变量：四个区块的色面对比分配。哪一版既抓眼又能安静读完正文？",
    correct: 2,
    options: [
      {
        label: "方案 A",
        why: "四块全部使用暖骨纸，眯眼看只剩一片亮度接近的浅灰面，缺少能一眼锚定入口的高对比焦块。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="10" y="10" width="200" height="52" fill="#F6E9D7"/>
          <rect x="10" y="72" width="62" height="72" fill="#F6E9D7"/>
          <rect x="82" y="72" width="128" height="46" fill="#F6E9D7"/>
          <rect x="82" y="126" width="128" height="18" fill="#F6E9D7"/>
          <rect x="20" y="22" width="108" height="12" fill="#0A0B08"/><rect x="20" y="40" width="136" height="6" fill="#3D3A34"/>
          <rect x="18" y="84" width="40" height="8" fill="#0A0B08"/>
          <rect x="92" y="82" width="96" height="6" fill="#0A0B08"/><rect x="92" y="94" width="104" height="5" fill="#3D3A34"/>
          <rect x="92" y="132" width="72" height="5" fill="#0A0B08"/></svg>`,
      },
      {
        label: "方案 B",
        why: "主标块与正文阅读块同时涂成高饱和信号橙——两块大面积炙橙互相抢戏，且多行正文铺在刺眼橙底上读起来很快发累。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="10" y="10" width="200" height="52" fill="#FB6204"/>
          <rect x="10" y="72" width="62" height="72" fill="#15B5D1"/>
          <rect x="82" y="72" width="128" height="46" fill="#FB6204"/>
          <rect x="82" y="126" width="128" height="18" fill="#F6E9D7"/>
          <rect x="20" y="22" width="108" height="12" fill="#0A0B08"/><rect x="20" y="40" width="136" height="6" fill="#0A0B08"/>
          <rect x="18" y="84" width="40" height="8" fill="#0A0B08"/>
          <rect x="92" y="82" width="96" height="6" fill="#0A0B08"/><rect x="92" y="94" width="104" height="5" fill="#0A0B08"/>
          <rect x="92" y="132" width="72" height="5" fill="#0A0B08"/></svg>`,
      },
      {
        label: "方案 C",
        why: "正确！主标用信号橙锁定第一入口，左轨用电光青标识导引信息，正文与注脚保留安静暖骨纸——既有强对比焦点，又有舒服的阅读缓冲面。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="10" y="10" width="200" height="52" fill="#FB6204"/>
          <rect x="10" y="72" width="62" height="72" fill="#15B5D1"/>
          <rect x="82" y="72" width="128" height="46" fill="#F6E9D7"/>
          <rect x="82" y="126" width="128" height="18" fill="#141612" stroke="#3B4138"/>
          <rect x="20" y="22" width="108" height="12" fill="#0A0B08"/><rect x="20" y="40" width="136" height="6" fill="#0A0B08"/>
          <rect x="18" y="84" width="40" height="8" fill="#0A0B08"/>
          <rect x="92" y="82" width="96" height="6" fill="#0A0B08"/><rect x="92" y="94" width="104" height="5" fill="#3D3A34"/>
          <rect x="92" y="132" width="72" height="5" fill="#F6E9D7"/></svg>`,
      },
      {
        label: "方案 D",
        why: "四块全部填满高饱和实色与重墨，全幅找不到一块安静的浅纸缓冲面，色彩彼此抵消反而显得闷堵噪杂。",
        svg: `<svg viewBox="0 0 220 154" width="220" height="154"><rect width="220" height="154" fill="#080907"/>
          <rect x="10" y="10" width="200" height="52" fill="#FB6204"/>
          <rect x="10" y="72" width="62" height="72" fill="#15B5D1"/>
          <rect x="82" y="72" width="128" height="46" fill="#15B5D1"/>
          <rect x="82" y="126" width="128" height="18" fill="#FB6204"/>
          <rect x="20" y="22" width="108" height="12" fill="#0A0B08"/><rect x="20" y="40" width="136" height="6" fill="#0A0B08"/>
          <rect x="18" y="84" width="40" height="8" fill="#0A0B08"/>
          <rect x="92" y="82" width="96" height="6" fill="#0A0B08"/><rect x="92" y="94" width="104" height="5" fill="#052A32"/>
          <rect x="92" y="132" width="72" height="5" fill="#0A0B08"/></svg>`,
      },
    ],
  },
];

let activeQuiz = 0;
let pickedMap = {};

function renderQuiz(idx) {
  activeQuiz = idx;
  const q = QUIZZES[idx];
  $("#quiz-prompt").textContent = q.prompt;
  $$("[data-quiz]").forEach((b) => b.classList.toggle("is-on", Number(b.dataset.quiz) === idx));

  const picked = pickedMap[idx];
  const grid = $("#quiz-grid");
  grid.innerHTML = q.options
    .map((o, i) => {
      let cls = "q-opt";
      if (picked !== undefined) {
        if (i === picked) cls += i === q.correct ? " is-right" : " is-wrong";
        else if (i === q.correct) cls += " is-right";
      }
      return `<button type="button" class="${cls}" data-opt="${i}">
        <span class="q-label">${o.label}</span>
        ${o.svg}
      </button>`;
    })
    .join("");

  $$("[data-opt]", grid).forEach((btn) => {
    btn.addEventListener("click", () => {
      pickedMap[idx] = Number(btn.dataset.opt);
      renderQuiz(idx);
    });
  });

  const fb = $("#quiz-feedback");
  if (picked === undefined) {
    fb.innerHTML = `<p class="qf-idle">点选上方任一方案（A / B / C / D），看看这一个变量到底改变了什么。</p>`;
  } else {
    const ok = picked === q.correct;
    const chosen = q.options[picked];
    const right = q.options[q.correct];
    fb.innerHTML = `<div class="qf-res">
      <span class="qf-badge ${ok ? "is-ok" : "is-err"}">${ok ? `选对了 · ${chosen.label}` : `再看看 · 你选了 ${chosen.label}（正解为 ${right.label}）`}</span>
      <strong>${chosen.label} 解析</strong>
      <p>${chosen.why}</p>
      ${ok ? "" : `<p><strong>为什么 ${right.label} 更好：</strong>${right.why.replace(/^正确！/, "")}</p>`}
    </div>`;
  }
}

$$("[data-quiz]").forEach((b) => b.addEventListener("click", () => renderQuiz(Number(b.dataset.quiz))));

// ==================== 07 原海报灯箱（放大 + 拖拽平移 + Esc 关闭） ====================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScaleEl = $("#lb-scale");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  $("#poster-open-btn").focus();
}

$("#poster-open-btn").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbDrag = { x0: e.clientX - lbX, y0: e.clientY - lbY, id: e.pointerId };
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture(e.pointerId);
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x0;
  lbY = e.clientY - lbDrag.y0;
  applyLbTransform();
});

const endLbDrag = () => {
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
};
lbStage.addEventListener("pointerup", endLbDrag);
lbStage.addEventListener("pointercancel", endLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 首次挂载渲染 ====================
syncHeroUI();
renderCR("proximity");
renderChunks(4);
renderSpecimens();
syncDarkroom();
renderEra(1917);
renderTriage("festival");
renderQuiz(0);
