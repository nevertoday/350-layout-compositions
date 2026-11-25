// 155 插页式版式 · 页面交互总控
// 严格单真源：所有读数、徽章、诊单、标题联动全部来自 model.js。

import {
  ANATOMY_LAYERS,
  ANTI_CASES,
  CRAFT_PAIRS,
  HISTORY_ERAS,
  INITIAL_STATE,
  PRESETS,
  QUIZ_ITEMS,
  clamp,
  diagnose,
  simulatePacing,
} from "./model.js";
import { createHeroStage } from "./stage-hero.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- 1. 开场活体夹页抽拉台 ----------
const state = { ...INITIAL_STATE };
let currentDiag = diagnose(state);

const els = {
  topStatus: $("#top-status"),
  titleInsert: $("#title-insert"),
  expRange: $("#exp-range"),
  expOut: $("#exp-out"),
  btnXray: $("#btn-xray"),
  btnPairBal: $("#btn-pair-bal"),
  diagSlip: $("#diag-slip"),
  diagTag: $("#diag-tag"),
  diagHead: $("#diag-head"),
  diagWhy: $("#diag-why"),
  diagHint: $("#diag-hint"),
  mExp: $("#m-exp"),
  mCov: $("#m-cov"),
  mHost: $("#m-host"),
  mBrake: $("#m-brake"),
};

function setText(el, txt) {
  if (el && el.textContent !== txt) el.textContent = txt;
}

let lastButtonsKey = "";

function syncHeroUI() {
  currentDiag = diagnose(state);
  const d = currentDiag;

  // 顶栏实时状态徽
  setText(els.topStatus, d.statusPill);
  els.topStatus.classList.toggle("is-ok", d.passed);
  els.topStatus.classList.toggle("is-err", !d.passed);

  // 标题「页」字自示范：纸材与露出感随状态实时变换
  const nextTitleStock = state.count === 0 ? "flat" : state.stock;
  if (els.titleInsert.dataset.stock !== nextTitleStock) els.titleInsert.dataset.stock = nextTitleStock;

  // 滑块与数值读数同步
  const pct = Math.round(state.exposure * 100);
  const pctStr = String(pct);
  if (els.expRange.value !== pctStr) els.expRange.value = pctStr;
  setText(els.expOut, state.count === 0 ? "0%" : `${pct}%`);

  // 按钮激活态（仅当离散选项变化时才遍历写 DOM，拖动时不反复碰 20 个按钮）
  const bKey = `${state.theme}|${state.stock}|${state.autonomy}|${state.count}|${state.anchor}|${state.pairBalance}|${state.xray}`;
  if (bKey !== lastButtonsKey) {
    lastButtonsKey = bKey;
    $$("[data-theme]").forEach((b) => {
      const on = b.dataset.theme === state.theme;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$("[data-stock]").forEach((b) => {
      const on = b.dataset.stock === state.stock;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$("[data-autonomy]").forEach((b) => {
      const on = b.dataset.autonomy === state.autonomy;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$("[data-count]").forEach((b) => {
      const on = Number(b.dataset.count) === state.count;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$("[data-anchor]").forEach((b) => {
      const on = b.dataset.anchor === state.anchor;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    els.btnXray.setAttribute("aria-pressed", String(state.xray));
    setText(els.btnXray, state.xray ? "剖面透视：开" : "剖面透视");

    // 仅当 2 张插页时显示「双卡抢戏」试错开关
    els.btnPairBal.hidden = state.count !== 2;
    const eqOn = state.pairBalance === "equal";
    els.btnPairBal.classList.toggle("is-on", eqOn);
    els.btnPairBal.setAttribute("aria-pressed", String(eqOn));
    setText(els.btnPairBal, eqOn ? "已开：双卡抢戏" : "试错：双卡抢戏");
  }

  // 原海报左栏 5 原则实时徽
  d.principles.forEach((p) => {
    const row = $(`.ledger-item[data-key="${p.key}"]`);
    const badge = $(`[data-badge="${p.key}"]`);
    if (row) {
      row.classList.toggle("is-ok", p.ok);
      row.classList.toggle("is-err", !p.ok);
    }
    setText(badge, p.badge);
  });

  // 白话单真源诊单卡
  els.diagSlip.classList.toggle("is-ok", d.passed);
  els.diagSlip.classList.toggle("is-err", !d.passed);
  setText(
    els.diagTag,
    d.fault ? `错态 · ${d.fault.tag}（${d.score} / 4）` : `通过 · 插页成局（4 / 4）`
  );
  setText(els.diagHead, d.headline);
  setText(els.diagWhy, d.why);
  setText(els.diagHint, d.hint);

  setText(els.mExp, `${d.layout.exposurePct}%`);
  setText(els.mCov, `${d.layout.coveragePct}%`);
  setText(els.mHost, `${d.layout.hostVisiblePct}%`);
  setText(els.mBrake, d.brakeTier);
}

const stage = createHeroStage(
  $("#hero-canvas"),
  () => state,
  () => currentDiag,
  {
    setExposure(val) {
      state.exposure = clamp(val, 0.08, 0.94);
      if (state.count === 0) state.count = 1;
      syncHeroUI();
    },
    cycleStock() {
      const order = ["flat", "citrine", "vellum", "navy"];
      state.stock = order[(order.indexOf(state.stock) + 1) % order.length];
      syncHeroUI();
    },
    setStock(s) {
      state.stock = s;
      syncHeroUI();
      stage.redraw();
    },
    fixAutonomy() {
      state.autonomy = "clean";
      syncHeroUI();
    },
    trimClutter() {
      state.count = 2;
      state.pairBalance = "stepped";
      syncHeroUI();
    },
    toggleXray() {
      state.xray = !state.xray;
      syncHeroUI();
      stage.redraw();
    },
  }
);

function updateAndDraw(patch) {
  Object.assign(state, patch);
  syncHeroUI();
  stage.redraw();
}

$$("[data-theme]").forEach((b) => b.addEventListener("click", () => updateAndDraw({ theme: b.dataset.theme })));
$$("[data-stock]").forEach((b) => b.addEventListener("click", () => updateAndDraw({ stock: b.dataset.stock })));
$$("[data-autonomy]").forEach((b) => b.addEventListener("click", () => updateAndDraw({ autonomy: b.dataset.autonomy })));
$$("[data-count]").forEach((b) =>
  b.addEventListener("click", () => {
    const c = Number(b.dataset.count);
    updateAndDraw({ count: c, pairBalance: c === 2 ? state.pairBalance : "stepped" });
  })
);
$$("[data-anchor]").forEach((b) => b.addEventListener("click", () => updateAndDraw({ anchor: b.dataset.anchor })));

els.expRange.addEventListener("input", () => {
  const v = Number(els.expRange.value) / 100;
  updateAndDraw({ exposure: v, count: state.count === 0 ? 1 : state.count });
});

els.btnXray.addEventListener("click", () => updateAndDraw({ xray: !state.xray }));
els.btnPairBal.addEventListener("click", () =>
  updateAndDraw({ pairBalance: state.pairBalance === "equal" ? "stepped" : "equal" })
);
$("#btn-preset-poster").addEventListener("click", () => updateAndDraw({ ...PRESETS.poster }));
$("#btn-preset-single").addEventListener("click", () => updateAndDraw({ ...PRESETS.shortLeaf }));
$("#btn-preset-broken").addEventListener("click", () => updateAndDraw({ ...PRESETS.broken }));

syncHeroUI();
stage.redraw();

// ---------- 2. 第 01 节：四层纸卡分解（支持物理错位抽拉分离） ----------
const ANATOMY_SHIFTS = {
  host: { host: "translate(24, 26)", sleeve: "translate(274, 42)", focus: "translate(362, 92)", pocket: "translate(18, 8)" },
  sleeve: { host: "translate(22, 26)", sleeve: "translate(202, 34)", focus: "translate(362, 98)", pocket: "translate(16, 10)" },
  focus: { host: "translate(28, 26)", sleeve: "translate(204, 44)", focus: "translate(306, 82)", pocket: "translate(10, 8)" },
  pocket: { host: "translate(32, 24)", sleeve: "translate(212, 38)", focus: "translate(316, 84)", pocket: "translate(0, -4)" },
};

function renderAnatomy(layerId) {
  const item = ANATOMY_LAYERS.find((x) => x.id === layerId) || ANATOMY_LAYERS[0];
  const shifts = ANATOMY_SHIFTS[item.id] || ANATOMY_SHIFTS.host;
  $$(".ltab").forEach((b) => {
    const on = b.dataset.layer === item.id;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
  $$("[data-layer-g]").forEach((g) => {
    const key = g.dataset.layerG;
    g.classList.toggle("is-active", key === item.id);
    if (shifts[key]) g.setAttribute("transform", shifts[key]);
  });
  $("#an-no").textContent = `${item.no} · ${item.en}`;
  $("#an-name").textContent = item.name;
  $("#an-quote").textContent = item.quote;
  $("#an-note").textContent = item.note;
  $("#an-spec").textContent = item.spec;
}
$$(".ltab").forEach((b) => b.addEventListener("click", () => renderAnatomy(b.dataset.layer)));
$$("[data-layer-g]").forEach((g) => {
  g.addEventListener("click", () => renderAnatomy(g.dataset.layerG));
  g.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      renderAnatomy(g.dataset.layerG);
    }
  });
});
renderAnatomy("host");

// ---------- 3. 第 02 节：12 页杂志插页节拍模拟器 ----------
const INTERVAL_STEPS = [
  { val: 0, text: "0 张插页（全册平铺）" },
  { val: 2, text: "每 2 页插 1 张（共 6 张）" },
  { val: 3, text: "每 3 页插 1 张（共 4 张）" },
  { val: 4, text: "每 4 页插 1 张（共 3 张）" },
  { val: 6, text: "每 6 页插 1 张（共 2 张）" },
  { val: 12, text: "每 12 页插 1 张（仅 1 张）" },
];

function renderPacing(stepIdx) {
  const cfg = INTERVAL_STEPS[stepIdx] || INTERVAL_STEPS[3];
  const sim = simulatePacing(cfg.val);
  $("#pacing-label").textContent = cfg.text;
  $("#pacing-range").setAttribute("aria-valuetext", cfg.text);
  $("#pacing-tier").textContent = sim.salienceTier;
  $("#pacing-verdict").textContent = sim.verdict;

  const strip = $("#spread-strip");
  strip.innerHTML = sim.pages
    .map(
      (p) =>
        `<div class="sp-page${p.isInsert ? " is-insert" : ""}"><span>P.${String(p.page).padStart(2, "0")}</span><i></i><i></i><span>${p.isInsert ? "插页" : "正文"}</span></div>`
    )
    .join("");

  // 绘制注意力曲线（明确标示意，无假精确数字）
  const chart = $("#pacing-chart");
  const W = 720;
  const H = 140;
  const padL = 42;
  const padR = 20;
  const padT = 18;
  const padB = 26;
  const xs = sim.curve.map((_, i) => padL + (i / 11) * (W - padL - padR));
  const ys = sim.curve.map((v) => padT + ((100 - v) / 100) * (H - padT - padB));
  const pts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${padL},${H - padB} ${pts} ${W - padR},${H - padB}`;

  const dots = xs
    .map((x, i) => {
      const ins = sim.pages[i].isInsert;
      return `<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="${ins ? 5.5 : 3.2}" fill="${ins ? "#ECDB2A" : "#1F6154"}" stroke="#03111E" stroke-width="${ins ? 1.8 : 0.8}"/>`;
    })
    .join("");

  chart.innerHTML = `
    <rect x="0" y="0" width="${W}" height="${H}" rx="4" fill="#F5F7F7"/>
    <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="#D5E1DE" stroke-dasharray="4 4"/>
    <line x1="${padL}" y1="${(padT + H - padB) / 2}" x2="${W - padR}" y2="${(padT + H - padB) / 2}" stroke="#D5E1DE" stroke-dasharray="4 4"/>
    <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#9EB5AF"/>
    <polygon points="${area}" fill="rgba(46, 126, 110, 0.14)"/>
    <polyline points="${pts}" fill="none" stroke="#071731" stroke-width="2.4" stroke-linejoin="round"/>
    ${dots}
    <text x="6" y="${padT + 5}" fill="#35495E" font-size="11" font-weight="700">高关注</text>
    <text x="6" y="${H - padB}" fill="#35495E" font-size="11">惯性滑读</text>
    <text x="${W - padR}" y="${H - 7}" text-anchor="end" fill="#1F6154" font-size="11">纵轴：视觉停顿与记忆突出度（示意模型）</text>
  `;
}

$("#pacing-range").addEventListener("input", (e) => renderPacing(Number(e.target.value)));
renderPacing(3);

// ---------- 4. 第 03 节：四时代实体装订图谱 ----------
const ERA_SVGS = {
  tipin: `<svg viewBox="0 0 360 220" aria-hidden="true">
    <rect width="360" height="220" rx="5" fill="#041125"/>
    <rect x="28" y="28" width="144" height="164" rx="3" fill="#ECF0F1"/>
    <rect x="174" y="28" width="154" height="164" rx="3" fill="#E9EFED"/>
    <rect x="170" y="28" width="6" height="164" fill="#2E7E6E"/>
    <rect x="176" y="42" width="126" height="136" rx="2" fill="#ECDB2A" stroke="#03111E"/>
    <rect x="184" y="54" width="110" height="84" fill="#122847"/>
    <text x="239" y="102" text-anchor="middle" fill="#ECDC40" font-size="12" font-weight="700">铜版插图页</text>
    <rect x="176" y="42" width="112" height="136" fill="rgba(245,247,247,0.52)" stroke="#B7D0C4" stroke-dasharray="4 3"/>
    <text x="186" y="168" fill="#03111E" font-size="10.5" font-weight="700">半透明防蹭墨薄护纸</text>
    <text x="42" y="56" fill="#35495E" font-size="11" font-weight="700">凸版活字正文</text>
    <path d="M173 36 L173 184" stroke="#ECDC40" stroke-width="2.5"/>
    <text x="173" y="206" text-anchor="middle" fill="#ECDC40" font-size="10.5">订口细胶条粘接</text>
  </svg>`,
  verve: `<svg viewBox="0 0 360 220" aria-hidden="true">
    <rect width="360" height="220" rx="5" fill="#041125"/>
    <rect x="24" y="26" width="150" height="168" rx="3" fill="#F3F1EF"/>
    <rect x="176" y="26" width="158" height="168" rx="3" fill="#122847" stroke="#B7D0C4"/>
    <rect x="196" y="44" width="118" height="132" rx="2" fill="#ECDB2A"/>
    <circle cx="255" cy="96" r="28" fill="#2E7E6E"/>
    <path d="M225 142 L285 142" stroke="#03111E" stroke-width="4"/>
    <text x="38" y="56" fill="#03111E" font-size="11.5" font-weight="700">文学评论正文页</text>
    <text x="38" y="76" fill="#35495E" font-size="10">轻薄哑光正文纸</text>
    <text x="255" y="164" text-anchor="middle" fill="#03111E" font-size="10.5" font-weight="700">重磅原版石版彩插</text>
  </svg>`,
  colors: `<svg viewBox="0 0 360 220" aria-hidden="true">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 Z" fill="#B82A24"/></marker></defs>
    <rect width="360" height="220" rx="5" fill="#041125"/>
    <rect x="26" y="24" width="308" height="172" rx="3" fill="#ECF0F1"/>
    <line x1="180" y1="24" x2="180" y2="196" stroke="#B7D0C4" stroke-dasharray="4 3"/>
    <rect x="180" y="34" width="108" height="152" rx="3" fill="#ECDB2A" stroke="#03111E"/>
    <text x="194" y="64" fill="#03111E" font-size="12" font-weight="900">裁窄短幅插页</text>
    <text x="194" y="84" fill="#213244" font-size="10">裁短 25mm</text>
    <text x="194" y="102" fill="#213244" font-size="10">底层右缘外露</text>
    <path d="M292 108 H326" stroke="#B82A24" stroke-width="2" marker-end="url(#arr)"/>
    <text x="310" y="96" text-anchor="middle" fill="#B82A24" font-size="10" font-weight="700">露边</text>
    <text x="42" y="56" fill="#35495E" font-size="11" font-weight="700">宿主页完整保留</text>
  </svg>`,
  web: `<svg viewBox="0 0 360 220" aria-hidden="true">
    <rect width="360" height="220" rx="5" fill="#041125"/>
    <rect x="24" y="22" width="312" height="176" rx="6" fill="#F5F7F7"/>
    <rect x="24" y="22" width="312" height="24" rx="6" fill="#122847"/>
    <circle cx="38" cy="34" r="3.5" fill="#ECDB2A"/><circle cx="50" cy="34" r="3.5" fill="#7CE5C8"/><circle cx="62" cy="34" r="3.5" fill="#B7D0C4"/>
    <text x="42" y="72" fill="#03111E" font-size="11" font-weight="700">&lt;article&gt; 主文连续流</text>
    <rect x="42" y="84" width="132" height="7" rx="2" fill="#C4D2CF"/><rect x="42" y="98" width="124" height="7" rx="2" fill="#C4D2CF"/>
    <rect x="42" y="112" width="130" height="7" rx="2" fill="#C4D2CF"/><rect x="42" y="132" width="118" height="7" rx="2" fill="#C4D2CF"/>
    <rect x="194" y="62" width="128" height="114" rx="5" fill="#071731" opacity="0.2" transform="translate(-5, 6)"/>
    <rect x="194" y="62" width="128" height="114" rx="5" fill="#ECDB2A" stroke="#03111E"/>
    <text x="206" y="86" fill="#03111E" font-size="11" font-weight="900">&lt;aside&gt; 独立插卡</text>
    <text x="206" y="106" fill="#213244" font-size="9.5">抽离后正文仍通顺</text>
    <text x="206" y="124" fill="#213244" font-size="9.5">色面反差 + 柔和 Z 影</text>
  </svg>`,
};

function renderEra(eraId) {
  const era = HISTORY_ERAS.find((e) => e.id === eraId) || HISTORY_ERAS[0];
  $$(".era-tab").forEach((b) => {
    const on = b.dataset.era === era.id;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("#era-visual").innerHTML = ERA_SVGS[era.diagram];
  $("#era-year").textContent = `${era.year} · ${era.en}`;
  $("#era-title").textContent = era.title;
  $("#era-summary").textContent = era.summary;
  $("#era-takeaway").textContent = era.takeaway;
}
$$(".era-tab").forEach((b) => b.addEventListener("click", () => renderEra(b.dataset.era)));
renderEra("tipin");

// ---------- 5. 第 04 节：纸上工艺 × 屏端转译 ----------
function renderCraft(id) {
  const item = CRAFT_PAIRS.find((c) => c.id === id) || CRAFT_PAIRS[0];
  $$(".ctab").forEach((b) => {
    const on = b.dataset.craft === item.id;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("#cp-title").textContent = item.printTitle;
  $("#cp-desc").textContent = item.printDesc;
  $("#cp-rule").textContent = item.printRule;
  $("#cs-title").textContent = item.screenTitle;
  $("#cs-desc").textContent = item.screenDesc;
  $("#cs-css").textContent = item.screenCss;
}
$$(".ctab").forEach((b) => b.addEventListener("click", () => renderCraft(b.dataset.craft)));
renderCraft("short");

// ---------- 6. 第 05 节：什么时候别用插页（翻车现场 vs 改用正途） ----------
let antiId = "contract";
let antiFixed = false;

function antiSvg(id, fixed) {
  if (id === "contract") {
    return fixed
      ? `<svg viewBox="0 0 360 190" aria-hidden="true"><rect width="360" height="190" rx="5" fill="#F5F7F7" stroke="#9ECBB9"/><text x="18" y="30" fill="#176B58" font-size="11.5" font-weight="700">正途：顺序条文 + 外侧轻量边注</text><rect x="18" y="46" width="210" height="8" rx="2" fill="#35495E"/><rect x="18" y="62" width="204" height="8" rx="2" fill="#9BB0AC"/><rect x="18" y="78" width="212" height="8" rx="2" fill="#9BB0AC"/><rect x="18" y="98" width="208" height="8" rx="2" fill="#35495E"/><rect x="18" y="114" width="196" height="8" rx="2" fill="#9BB0AC"/><rect x="18" y="130" width="212" height="8" rx="2" fill="#9BB0AC"/><rect x="246" y="46" width="96" height="62" rx="4" fill="#E9EFED" stroke="#2E7E6E"/><text x="256" y="70" fill="#1F6154" font-size="10" font-weight="700">外侧注释</text><text x="256" y="88" fill="#35495E" font-size="9">不打断主条款</text></svg>`
      : `<svg viewBox="0 0 360 190" aria-hidden="true"><rect width="360" height="190" rx="5" fill="#F5F7F7" stroke="#DFACA7"/><text x="18" y="30" fill="#B82A24" font-size="11.5" font-weight="700">错用：第 4 条中间硬塞叠压卡片</text><rect x="18" y="46" width="320" height="8" rx="2" fill="#9BB0AC"/><rect x="18" y="62" width="300" height="8" rx="2" fill="#9BB0AC"/><rect x="74" y="66" width="214" height="66" rx="5" fill="#ECDB2A" stroke="#B82A24" stroke-width="2"/><text x="90" y="94" fill="#03111E" font-size="11.5" font-weight="900">叠压提示卡遮住违约金但书</text><text x="90" y="114" fill="#B82A24" font-size="10">线性逻辑链中途被斩断</text><rect x="18" y="148" width="310" height="8" rx="2" fill="#9BB0AC"/></svg>`;
  }
  if (id === "mobile") {
    return fixed
      ? `<svg viewBox="0 0 360 190" aria-hidden="true"><rect width="360" height="190" rx="5" fill="#071731"/><rect x="118" y="12" width="124" height="166" rx="12" fill="#F5F7F7" stroke="#7CE5C8" stroke-width="2"/><rect x="130" y="28" width="100" height="7" rx="2" fill="#9BB0AC"/><rect x="130" y="42" width="92" height="7" rx="2" fill="#9BB0AC"/><rect x="130" y="60" width="100" height="52" rx="4" fill="#ECDB2A"/><text x="180" y="84" text-anchor="middle" fill="#03111E" font-size="10" font-weight="900">段间异色嵌卡</text><text x="180" y="100" text-anchor="middle" fill="#213244" font-size="8.5">停顿但不挡字</text><rect x="130" y="124" width="100" height="7" rx="2" fill="#9BB0AC"/><rect x="130" y="138" width="88" height="7" rx="2" fill="#9BB0AC"/></svg>`
      : `<svg viewBox="0 0 360 190" aria-hidden="true"><rect width="360" height="190" rx="5" fill="#071731"/><rect x="118" y="12" width="124" height="166" rx="12" fill="#F5F7F7" stroke="#FF887A" stroke-width="2"/><rect x="130" y="28" width="100" height="7" rx="2" fill="#9BB0AC"/><rect x="130" y="42" width="92" height="7" rx="2" fill="#9BB0AC"/><rect x="130" y="56" width="98" height="7" rx="2" fill="#9BB0AC"/><rect x="130" y="138" width="88" height="7" rx="2" fill="#9BB0AC"/><rect x="152" y="44" width="102" height="94" rx="5" fill="#ECDB2A" stroke="#B82A24" stroke-width="2"/><text x="203" y="84" text-anchor="middle" fill="#03111E" font-size="10" font-weight="900">挡死右半正文</text><text x="203" y="102" text-anchor="middle" fill="#B82A24" font-size="9">像关不掉的弹窗</text></svg>`;
  }
  return fixed
    ? `<svg viewBox="0 0 360 190" aria-hidden="true"><rect width="360" height="190" rx="5" fill="#F5F7F7" stroke="#9ECBB9"/><text x="18" y="28" fill="#176B58" font-size="11.5" font-weight="700">正途：同层左右并排核对</text><rect x="18" y="42" width="154" height="128" rx="4" fill="#FFFFFF" stroke="#B7D0C4"/><rect x="188" y="42" width="154" height="128" rx="4" fill="#E9EFED" stroke="#2E7E6E"/><text x="32" y="68" fill="#03111E" font-size="11" font-weight="700">方案 A 指标</text><text x="202" y="68" fill="#03111E" font-size="11" font-weight="700">方案 B 指标</text><line x1="28" y1="92" x2="332" y2="92" stroke="#2E7E6E" stroke-dasharray="4 3"/><line x1="28" y1="122" x2="332" y2="122" stroke="#2E7E6E" stroke-dasharray="4 3"/></svg>`
    : `<svg viewBox="0 0 360 190" aria-hidden="true"><rect width="360" height="190" rx="5" fill="#F5F7F7" stroke="#DFACA7"/><text x="18" y="28" fill="#B82A24" font-size="11.5" font-weight="700">错用：叠压插页遮住参照列</text><rect x="18" y="42" width="324" height="128" rx="4" fill="#FFFFFF" stroke="#CBD6D4"/><line x1="18" y1="84" x2="342" y2="84" stroke="#E2EAE8"/><line x1="18" y1="124" x2="342" y2="124" stroke="#E2EAE8"/><rect x="148" y="48" width="176" height="114" rx="5" fill="#ECDB2A" stroke="#B82A24" stroke-width="2"/><text x="164" y="88" fill="#03111E" font-size="11" font-weight="900">盖住方案 A 价格列</text><text x="164" y="108" fill="#B82A24" font-size="10">无法同行横向比对</text></svg>`;
}

function renderAnti() {
  const item = ANTI_CASES.find((x) => x.id === antiId) || ANTI_CASES[0];
  $$(".atab").forEach((b) => {
    const on = b.dataset.anti === item.id;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
  const flipBtn = $("#anti-flip");
  flipBtn.setAttribute("aria-pressed", String(antiFixed));
  flipBtn.textContent = antiFixed ? "当前：已改用正途 · 点此看错态" : "当前：错用插页 · 点此改用正途";

  $("#anti-viz").innerHTML = antiSvg(item.id, antiFixed);
  const pill = $("#anti-pill");
  pill.textContent = antiFixed ? "改用正途" : "翻车现场";
  pill.classList.toggle("is-good", antiFixed);
  pill.classList.toggle("is-bad", !antiFixed);
  $("#anti-title").textContent = antiFixed ? item.goodTitle : item.badTitle;
  $("#anti-desc").textContent = antiFixed ? item.goodNote : item.badNote;
}

$$(".atab").forEach((b) =>
  b.addEventListener("click", () => {
    antiId = b.dataset.anti;
    antiFixed = false;
    renderAnti();
  })
);
$("#anti-flip").addEventListener("click", () => {
  antiFixed = !antiFixed;
  renderAnti();
});
renderAnti();

// ---------- 7. 第 06 节：四选一练习 ----------
$$(".qcard").forEach((btn) => {
  btn.addEventListener("click", () => {
    const picked = btn.dataset.choice;
    const item = QUIZ_ITEMS[picked];
    $$(".qcard").forEach((c) => {
      const id = c.dataset.choice;
      const meta = QUIZ_ITEMS[id];
      c.setAttribute("aria-pressed", String(id === picked));
      c.classList.toggle("is-right", meta.correct);
      c.classList.toggle("is-wrong", !meta.correct && id === picked);
      const rev = $(`[data-reveal="${id}"]`, c);
      if (rev) rev.textContent = meta.tag;
    });
    const box = $("#quiz-verdict");
    box.classList.toggle("is-right", item.correct);
    box.classList.toggle("is-wrong", !item.correct);
    $("#qv-title").textContent = item.correct
      ? `方案 ${picked} · 判断准确`
      : `方案 ${picked} 存在单一硬伤：${item.tag}`;
    $("#qv-text").textContent = item.reason;
  });
});

// ---------- 8. 第 07 节：原海报放大、拖动、缩放、Esc 关闭 ----------
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbZoom = $("#lb-zoom");
const posterTrigger = $("#poster-trigger");
let zoom = 1;
let panX = 0;
let panY = 0;
let panning = false;
let panStartX = 0;
let panStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  lbZoom.textContent = `${Math.round(zoom * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  zoom = 1;
  panX = 0;
  panY = 0;
  applyLbTransform();
  lb.hidden = false;
  posterTrigger.setAttribute("aria-expanded", "true");
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lb.hidden) return;
  lb.hidden = true;
  posterTrigger.setAttribute("aria-expanded", "false");
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  zoom = clamp(zoom + 0.35, 1, 3.1);
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  zoom = clamp(zoom - 0.35, 1, 3.1);
  if (zoom === 1) {
    panX = 0;
    panY = 0;
  }
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  panning = true;
  panStartX = e.clientX - panX;
  panStartY = e.clientY - panY;
  lbStage.classList.add("is-panning");
  try {
    lbStage.setPointerCapture(e.pointerId);
  } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!panning) return;
  panX = e.clientX - panStartX;
  panY = e.clientY - panStartY;
  applyLbTransform();
});
const stopPan = () => {
  panning = false;
  lbStage.classList.remove("is-panning");
};
lbStage.addEventListener("pointerup", stopPan);
lbStage.addEventListener("pointercancel", stopPan);
lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    zoom = clamp(zoom + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.1);
    if (zoom === 1) {
      panX = 0;
      panY = 0;
    }
    applyLbTransform();
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});
